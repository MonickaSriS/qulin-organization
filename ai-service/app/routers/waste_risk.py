from fastapi import APIRouter, Depends, HTTPException

from schemas.predict import PredictFeaturesRequest, WasteRiskResponse
from services.security import verify_internal_key
from services.model_loader import get_waste_risk_model
from services.feature_mapper import build_feature_vector

router = APIRouter(dependencies=[Depends(verify_internal_key)])

# Must match ml/training/train_waste_risk.py exactly
RED_THRESHOLD = 0.15
ORANGE_THRESHOLD = 0.05


def _to_band(ratio: float) -> str:
    if ratio > RED_THRESHOLD:
        return "red"
    elif ratio > ORANGE_THRESHOLD:
        return "orange"
    return "green"


@router.post("/waste-risk", response_model=WasteRiskResponse)
def predict_waste_risk(req: PredictFeaturesRequest):
    model = get_waste_risk_model()

    try:
        features = build_feature_vector(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    ratio = max(0.0, min(1.0, float(model.predict(features)[0])))  # clip to [0,1]

    return WasteRiskResponse(
        item=req.item,
        riskScore=round(ratio * 100, 1),
        band=_to_band(ratio),
    )
