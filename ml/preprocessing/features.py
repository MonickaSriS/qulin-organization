"""
QULIN — Feature Engineering
Owner: Member 2

Produces the exact FEATURE_COLUMNS defined in feature_columns.py from the
cleaned flat dataset (date, day_of_week, item, meal, prepared_qty,
consumed_qty, waste_qty, waste_reason, stock_level, days_to_expiry,
customer_count).
"""

import json
from pathlib import Path

import pandas as pd

from feature_columns import FEATURE_COLUMNS, ITEM_ENCODING, MEAL_ENCODING

HOLIDAYS_PATH = Path(__file__).resolve().parent / "holidays.json"


def _load_holidays() -> set:
    with open(HOLIDAYS_PATH) as f:
        data = json.load(f)
    return set(pd.to_datetime(data["holidays"]).date)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["item", "meal", "date"]).copy()

    # day_of_week_num: 0=Monday..6=Sunday (matches feature_columns.py contract)
    df["day_of_week_num"] = df["date"].dt.dayofweek
    df["is_weekend"] = df["day_of_week_num"].isin([5, 6]).astype(int)

    holidays = _load_holidays()
    df["is_holiday"] = df["date"].dt.date.isin(holidays).astype(int)

    # Rolling 7-day average consumption, per (item, meal) — shift(1) so we
    # never leak the current day's own value into its own feature
    df["rolling_7day_avg_consumption"] = (
        df.groupby(["item", "meal"])["consumed_qty"]
        .transform(lambda s: s.shift(1).rolling(window=7, min_periods=1).mean())
    )

    # Prepared qty exactly 7 days prior, same item/meal (captures the
    # "kitchen always preps X on this weekday" pattern — e.g. Friday rice)
    df["prepared_qty_last_week_same_day"] = (
        df.groupby(["item", "meal"])["prepared_qty"].shift(7)
    )

    # Encode item/meal using the fixed contract mapping
    df["item_encoded"] = df["item"].map(ITEM_ENCODING)
    df["meal_encoded"] = df["meal"].map(MEAL_ENCODING)

    # First 7 rows per (item, meal) group won't have rolling/lag features yet —
    # fill with the row's own current values as a reasonable cold-start default
    df["rolling_7day_avg_consumption"] = df["rolling_7day_avg_consumption"].fillna(
        df["consumed_qty"]
    )
    df["prepared_qty_last_week_same_day"] = df["prepared_qty_last_week_same_day"].fillna(
        df["prepared_qty"]
    )

    missing_items = df[df["item_encoded"].isna()]["item"].unique()
    if len(missing_items) > 0:
        raise ValueError(
            f"Unknown item(s) not in ITEM_ENCODING: {missing_items}. "
            "Add them to feature_columns.py (append only, never reorder)."
        )

    return df


def get_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Returns just the ordered feature columns, ready for model input."""
    return df[FEATURE_COLUMNS]
