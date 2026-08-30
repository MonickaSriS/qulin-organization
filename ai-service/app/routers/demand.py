from fastapi import APIRouter, Depends, HTTPException

from schemas.predict import PredictFeaturesRequest, DemandResponse
from services.security import verify_internal_key
from services.model_loader import get_demand_model
from services.feature_mapper import build_feature_vector

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/demand", response_model=DemandResponse)
def predict_demand(req: PredictFeaturesRequest):
    model = get_demand_model()

    try:
        features = build_feature_vector(req)
    except ValueError as e:
        # Unknown item/meal — this is a client error (bad input), not a
        # server failure, so it should be a 400, never a bare 500.
        raise HTTPException(status_code=400, detail=str(e))

    prediction = model.predict(features)[0]
    return DemandResponse(item=req.item, expectedDemand=round(float(prediction), 2))
