# QULIN — Model Cards

## Demand Model (`demand_model.pkl`)

- **Task:** Regression — predicts `consumed_qty` for a given item/meal/date
- **Algorithm:** XGBoost Regressor
- **Features:** see `ml/preprocessing/feature_columns.py` — 9 engineered features (day-of-week, weekend/holiday flags, rolling 7-day avg consumption, last-week-same-day prep qty, days to expiry, stock level, item/meal encoding)
- **Training data:** `ml/data/processed/dataset.csv` (150 days synthetic, Phase 3)
- **Split:** Time-based 70/15/15 (train/val/test)
- **Metrics:** see `ml/evaluation/metrics_report.md` for the latest run
- **Known limitations:** trained on synthetic data with injected Friday-rice overproduction pattern and irregular "surprise" days; real pilot-kitchen data will require retraining. Item/meal encoding is a fixed mapping — adding a new item requires appending to `ITEM_ENCODING` in `feature_columns.py`, never reordering.

## Waste-Risk Model (`waste_risk_model.pkl`)

- **Task:** Regression — predicts `waste_qty / prepared_qty` ratio, bucketed into 🔴 (>15%) / 🟠 (5-15%) / 🟢 (<5%) bands for display
- **Algorithm:** XGBoost Regressor
- **Features:** identical feature set to the demand model (see above)
- **Training data:** same as demand model
- **Split:** Time-based 70/15/15
- **Metrics:** MAE/RMSE on the raw ratio, plus precision/recall/F1/confusion matrix on the bucketed bands — see `ml/evaluation/metrics_report.md`
- **Known limitations:** band thresholds (15%/5%) are a reasonable default, not tuned against real business cost data — revisit once real waste-cost figures are available.

---

*Regenerate this file's metrics section after every retrain by re-running `train_demand.py` / `train_waste_risk.py` — they append fresh entries to `ml/evaluation/metrics_report.md` automatically.*
