from pydantic import BaseModel
from typing import Optional


class PredictFeaturesRequest(BaseModel):
    """
    Matches docs/api-contract.md Section 3.2 — the backend sends named
    fields, this service maps them to the fixed FEATURE_COLUMNS order
    internally (see services/feature_mapper.py). The backend never needs
    to know the raw column order.
    """
    item: str
    meal: str
    date: str  # ISO date string, informational only — not fed to the model directly
    day_of_week: int  # 0=Monday..6=Sunday
    is_weekend: int
    is_holiday: int
    rolling_7day_avg_consumption: float
    prepared_qty_last_week_same_day: float
    days_to_expiry: float
    stock_level: float


class DemandResponse(BaseModel):
    item: str
    expectedDemand: float


class WasteRiskResponse(BaseModel):
    item: str
    riskScore: float  # 0-100
    band: str  # "red" | "orange" | "green"


class FeatureDeltas(BaseModel):
    """Recent trend deltas used by the root-cause rule engine."""
    preparedQtyTrend: Optional[float] = None   # e.g. % change in prepared qty over recent period
    consumedQtyTrend: Optional[float] = None    # e.g. % change in consumed qty over recent period
    daysToExpiry: Optional[float] = None


class RecommendRequest(BaseModel):
    item: str
    riskScore: float
    band: str
    recentFeatureDeltas: FeatureDeltas


class RecommendResponse(BaseModel):
    item: str
    cause: str
    evidence: str
    recommendation: str
    suggestedQty: Optional[float] = None
