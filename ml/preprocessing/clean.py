"""
QULIN — Data Cleaning
Owner: Member 2

Drops/flags rows with negative quantities or impossible dates before
feature engineering. Called by both train_demand.py and train_waste_risk.py.
"""

import pandas as pd


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    initial_rows = len(df)

    # Drop rows with negative quantities — shouldn't exist post Phase-3 seeding,
    # but this is a real safeguard once real pilot-kitchen data replaces synthetic data
    df = df[
        (df["prepared_qty"] >= 0)
        & (df["consumed_qty"] >= 0)
        & (df["waste_qty"] >= 0)
    ].copy()

    # Drop rows with unparseable/impossible dates
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])

    # Fill missing days_to_expiry / stock_level with a neutral default rather
    # than dropping the row — these are less critical than qty fields
    df["days_to_expiry"] = df["days_to_expiry"].fillna(-1)
    df["stock_level"] = df["stock_level"].fillna(0)
    df["customer_count"] = df["customer_count"].fillna(0)

    dropped = initial_rows - len(df)
    if dropped > 0:
        print(f"[clean_dataset] Dropped {dropped} invalid rows out of {initial_rows}.")

    return df.reset_index(drop=True)
