"""
QULIN — Shared Feature Column Contract
Owner: Member 2

CRITICAL: This exact list and order is imported by BOTH:
  - ml/training/train_demand.py, ml/training/train_waste_risk.py
  - ai-service/app/services/*.py (Phase 6)

Never edit this file without re-training AND redeploying both models —
column order drift between training and serving silently produces
garbage predictions with no error thrown.

See docs/api-contract.md, Section 2, for the full contract.
"""

FEATURE_COLUMNS = [
    "day_of_week_num",              # int, 0=Monday..6=Sunday
    "is_weekend",                    # int, 0/1
    "is_holiday",                     # int, 0/1
    "rolling_7day_avg_consumption",    # float
    "prepared_qty_last_week_same_day",  # float
    "days_to_expiry",                    # float
    "stock_level",                        # float
    "item_encoded",                        # int (label-encoded item name)
    "meal_encoded",                         # int (label-encoded meal)
]

# Encoding maps — fixed and versioned here so training and serving agree.
# If a new item/meal is added later, append to the END of these lists
# (never reorder or remove) to keep existing encodings stable.
ITEM_ENCODING = {
    "Rice": 0,
    "Chicken": 1,
    "Vegetables": 2,
    "Bread": 3,
    "Spinach": 4,
}

MEAL_ENCODING = {
    "breakfast": 0,
    "lunch": 1,
    "dinner": 2,
    "snack": 3,
}
