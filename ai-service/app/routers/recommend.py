from fastapi import APIRouter, Depends

from schemas.predict import RecommendRequest, RecommendResponse
from services.security import verify_internal_key
from rootcause.rules import generate_recommendation

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    result = generate_recommendation(req)
    return RecommendResponse(**result)
