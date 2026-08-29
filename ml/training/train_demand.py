"""
QULIN — Demand Model Training
Owner: Member 2

Target: consumed_qty (regression) — "how much will actually be consumed".

Split: time-based (not random) — train on first 70% of dates, validate on
next 15%, test on final 15%. Random splitting would leak future patterns
into training, which is wrong for a forecasting problem (per roadmap Sec. 10).

Usage:
    cd ml/training
    python train_demand.py
"""

import sys
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

sys.path.append(str(Path(__file__).resolve().parents[1] / "preprocessing"))
from clean import clean_dataset
from features import engineer_features, get_feature_matrix

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "processed" / "dataset.csv"
MODEL_OUT = Path(__file__).resolve().parents[1] / "models" / "demand_model.pkl"
METRICS_OUT = Path(__file__).resolve().parents[1] / "evaluation" / "metrics_report.md"


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


def main():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH, parse_dates=["date"])
    df = clean_dataset(df)
    df = engineer_features(df)

    train, val, test = time_based_split(df)
    print(f"Train: {len(train)} rows | Val: {len(val)} rows | Test: {len(test)} rows")

    X_train, y_train = get_feature_matrix(train), train["consumed_qty"]
    X_val, y_val = get_feature_matrix(val), val["consumed_qty"]
    X_test, y_test = get_feature_matrix(test), test["consumed_qty"]

    print("Training XGBRegressor (demand model)...")
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

    # Evaluate on held-out test split
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mape = np.mean(np.abs((y_test - preds) / np.maximum(y_test, 1))) * 100

    # Naive baseline for comparison: "predict last week's same-day value"
    baseline_preds = test["prepared_qty_last_week_same_day"]
    baseline_mae = mean_absolute_error(y_test, baseline_preds)

    print(f"\nDemand Model — Test MAE: {mae:.2f} | RMSE: {rmse:.2f} | MAPE: {mape:.1f}%")
    print(f"Naive baseline MAE: {baseline_mae:.2f}")
    beats_baseline = mae < baseline_mae
    print(f"Beats naive baseline: {beats_baseline}")

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    import joblib
    joblib.dump(model, MODEL_OUT)
    print(f"\nModel saved to {MODEL_OUT}")

    METRICS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(METRICS_OUT, "a") as f:
        f.write(f"\n## Demand Model — {datetime.now().isoformat()}\n\n")
        f.write(f"- Train/Val/Test rows: {len(train)}/{len(val)}/{len(test)}\n")
        f.write(f"- Test MAE: {mae:.2f}\n")
        f.write(f"- Test RMSE: {rmse:.2f}\n")
        f.write(f"- Test MAPE: {mape:.1f}%\n")
        f.write(f"- Naive baseline MAE: {baseline_mae:.2f}\n")
        f.write(f"- Beats naive baseline: {beats_baseline}\n")
        f.write(f"- Best iteration: {model.best_iteration}\n")

    print(f"Metrics appended to {METRICS_OUT}")


if __name__ == "__main__":
    main()
