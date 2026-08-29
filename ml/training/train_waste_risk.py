"""
QULIN — Waste-Risk Model Training
Owner: Member 2

Target: waste_qty / prepared_qty as a continuous risk ratio (regression),
then bucketed into red/orange/green bands for display — matching the doc's
percentage score (e.g. "Rice: 82% risk"), not a class label directly.

Split: time-based, same rationale as train_demand.py.

Usage:
    cd ml/training
    python train_waste_risk.py
"""

import sys
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, precision_recall_fscore_support, confusion_matrix

sys.path.append(str(Path(__file__).resolve().parents[1] / "preprocessing"))
from clean import clean_dataset
from features import engineer_features, get_feature_matrix

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "processed" / "dataset.csv"
MODEL_OUT = Path(__file__).resolve().parents[1] / "models" / "waste_risk_model.pkl"
METRICS_OUT = Path(__file__).resolve().parents[1] / "evaluation" / "metrics_report.md"

# Risk band thresholds — matches the doc's 🔴/🟠/🟢 display convention
RED_THRESHOLD = 0.15   # >15% wasted = high risk
ORANGE_THRESHOLD = 0.05  # 5-15% = medium risk


def time_based_split(df: pd.DataFrame):
    df = df.sort_values("date")
    dates = df["date"].unique()
    n = len(dates)
    train_end = dates[int(n * 0.70)]
    val_end = dates[int(n * 0.85)]

    train = df[df["date"] <= train_end]
    val = df[(df["date"] > train_end) & (df["date"] <= val_end)]
    test = df[df["date"] > val_end]
    return train, val, test


def to_band(ratio: float) -> str:
    if ratio > RED_THRESHOLD:
        return "red"
    elif ratio > ORANGE_THRESHOLD:
        return "orange"
    return "green"


def main():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH, parse_dates=["date"])
    df = clean_dataset(df)
    df = engineer_features(df)

    # Waste ratio target — guard against divide-by-zero for zero-prep rows
    df["waste_ratio"] = np.where(
        df["prepared_qty"] > 0, df["waste_qty"] / df["prepared_qty"], 0
    )

    train, val, test = time_based_split(df)
    print(f"Train: {len(train)} rows | Val: {len(val)} rows | Test: {len(test)} rows")

    X_train, y_train = get_feature_matrix(train), train["waste_ratio"]
    X_val, y_val = get_feature_matrix(val), val["waste_ratio"]
    X_test, y_test = get_feature_matrix(test), test["waste_ratio"]

    print("Training XGBRegressor (waste-risk model)...")
    model = XGBRegressor(
        n_estimators=500,
        learning_rate=0.08,
        max_depth=5,
        min_child_weight=3,
        reg_lambda=1.0,
        early_stopping_rounds=20,
        eval_metric="mae",
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    preds = np.clip(model.predict(X_test), 0, 1)  # ratio can't be negative or >100%
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))

    # Bucket both true and predicted ratios into bands for a classification-style report
    true_bands = y_test.apply(to_band)
    pred_bands = pd.Series(preds, index=y_test.index).apply(to_band)

    precision, recall, f1, _ = precision_recall_fscore_support(
        true_bands, pred_bands, labels=["red", "orange", "green"], average=None, zero_division=0
    )
    cm = confusion_matrix(true_bands, pred_bands, labels=["red", "orange", "green"])

    print(f"\nWaste-Risk Model — Test MAE (ratio): {mae:.4f} | RMSE: {rmse:.4f}")
    print(f"Precision (red/orange/green): {precision}")
    print(f"Recall (red/orange/green): {recall}")
    print(f"F1 (red/orange/green): {f1}")
    print(f"Confusion matrix:\n{cm}")

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    import joblib
    joblib.dump(model, MODEL_OUT)
    print(f"\nModel saved to {MODEL_OUT}")

    METRICS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(METRICS_OUT, "a") as f:
        f.write(f"\n## Waste-Risk Model — {datetime.now().isoformat()}\n\n")
        f.write(f"- Train/Val/Test rows: {len(train)}/{len(val)}/{len(test)}\n")
        f.write(f"- Test MAE (ratio): {mae:.4f}\n")
        f.write(f"- Test RMSE (ratio): {rmse:.4f}\n")
        f.write(f"- Precision (red/orange/green): {[f'{p:.2f}' for p in precision]}\n")
        f.write(f"- Recall (red/orange/green): {[f'{r:.2f}' for r in recall]}\n")
        f.write(f"- F1 (red/orange/green): {[f'{s:.2f}' for s in f1]}\n")
        f.write(f"- Confusion matrix (rows=true, cols=pred, order=[red,orange,green]):\n")
        f.write(f"```\n{cm}\n```\n")
        f.write(f"- Best iteration: {model.best_iteration}\n")

    print(f"Metrics appended to {METRICS_OUT}")


if __name__ == "__main__":
    main()
