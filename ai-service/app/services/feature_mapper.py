import pandas as pd

from services.model_loader import FEATURE_COLUMNS, ITEM_ENCODING, MEAL_ENCODING
from schemas.predict import PredictFeaturesRequest


def build_feature_vector(req: PredictFeaturesRequest) -> pd.DataFrame:
    """
    Converts a named request into a single-row DataFrame with columns
    in the exact order FEATURE_COLUMNS expects — this is the only place
    that ordering assumption lives, so if it ever changes, this is the
    one function to update alongside ml/preprocessing/features.py.
    """
    if req.item not in ITEM_ENCODING:
        raise ValueError(f"Unknown item '{req.item}' — not in ITEM_ENCODING. Retrain or update the mapping.")
    if req.meal not in MEAL_ENCODING:
        raise ValueError(f"Unknown meal '{req.meal}' — not in MEAL_ENCODING.")

    row = {
        "day_of_week_num": req.day_of_week,
        "is_weekend": req.is_weekend,
        "is_holiday": req.is_holiday,
        "rolling_7day_avg_consumption": req.rolling_7day_avg_consumption,
        "prepared_qty_last_week_same_day": req.prepared_qty_last_week_same_day,
        "days_to_expiry": req.days_to_expiry,
        "stock_level": req.stock_level,
        "item_encoded": ITEM_ENCODING[req.item],
        "meal_encoded": MEAL_ENCODING[req.meal],
    }

    df = pd.DataFrame([row])
    return df[FEATURE_COLUMNS]  # enforce exact column order
