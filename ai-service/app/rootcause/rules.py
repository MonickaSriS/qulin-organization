"""
QULIN — Root Cause + Recommendation Rules
Owner: Member 2

Deliberately rule-based, not a trained model — the source doc's examples
(Section 5 ④) are all threshold/pattern explanations, not black-box
classifications. This keeps the reasoning inspectable and debuggable,
which matters for a kitchen manager who needs to trust the "why."
"""

from schemas.predict import RecommendRequest

# Thresholds — reasonable defaults, not tuned against real cost data yet
TREND_FLAT_THRESHOLD = 0.05  # ±5% treated as "roughly constant"
TREND_DROP_THRESHOLD = -0.10  # >10% decline treated as "meaningfully lower"
EXPIRY_URGENT_DAYS = 3


def generate_recommendation(req: RecommendRequest) -> dict:
    deltas = req.recentFeatureDeltas
    prepared_trend = deltas.preparedQtyTrend or 0.0
    consumed_trend = deltas.consumedQtyTrend or 0.0
    days_to_expiry = deltas.daysToExpiry

    # Rule 1: Overproduction — prep stayed flat while demand dropped
    # (this is the exact Friday-rice pattern from the source doc)
    if (
        abs(prepared_trend) <= TREND_FLAT_THRESHOLD
        and consumed_trend <= TREND_DROP_THRESHOLD
    ):
        cause = "overproduction"
        evidence = (
            f"{req.item} preparation remained roughly constant "
            f"({prepared_trend:+.0%}) while customer demand decreased "
            f"({consumed_trend:+.0%})."
        )
        reduction_pct = min(abs(consumed_trend), 0.20)  # cap suggested cut at 20%
        recommendation = (
            f"Reduce {req.item} preparation by approximately {reduction_pct:.0%}."
        )
        return {
            "item": req.item,
            "cause": cause,
            "evidence": evidence,
            "recommendation": recommendation,
            "suggestedQty": None,  # caller (backend) can compute an absolute qty from this % if needed
        }

    # Rule 2: Expiry risk — item is close to spoiling regardless of demand trend
    if days_to_expiry is not None and 0 <= days_to_expiry <= EXPIRY_URGENT_DAYS:
        cause = "expiry_risk"
        evidence = f"{req.item} has only {days_to_expiry:.0f} day(s) until expiry."
        recommendation = (
            f"Prioritize using existing {req.item} stock before purchasing more."
        )
        return {
            "item": req.item,
            "cause": cause,
            "evidence": evidence,
            "recommendation": recommendation,
            "suggestedQty": None,
        }

    # Rule 3: General high risk without a clear single driver — still flag it
    if req.band == "red":
        cause = "elevated_risk_unclear_driver"
        evidence = (
            f"{req.item} shows a high waste-risk score ({req.riskScore:.0f}%) "
            "without a single dominant trend in preparation or consumption."
        )
        recommendation = (
            f"Review recent {req.item} preparation quantities manually this week."
        )
        return {
            "item": req.item,
            "cause": cause,
            "evidence": evidence,
            "recommendation": recommendation,
            "suggestedQty": None,
        }

    # Default — low/orange risk, no action needed
    return {
        "item": req.item,
        "cause": "none",
        "evidence": f"{req.item} waste-risk score ({req.riskScore:.0f}%) is within acceptable range.",
        "recommendation": "No action needed at this time.",
        "suggestedQty": None,
    }
