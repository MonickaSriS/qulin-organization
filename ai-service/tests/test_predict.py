import os
import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("AI_SERVICE_KEY", "test-key-shared")

from fastapi.testclient import TestClient
from app.main import app  # noqa: E402

HEADERS = {"X-Internal-Key": "test-key-shared"}

SAMPLE_FEATURES = {
    "item": "Rice",
    "meal": "lunch",
    "date": "2026-08-28",
    "day_of_week": 4,
    "is_weekend": 0,
    "is_holiday": 0,
    "rolling_7day_avg_consumption": 420.0,
    "prepared_qty_last_week_same_day": 500.0,
    "days_to_expiry": 10.0,
    "stock_level": 80.0,
}


@pytest.fixture(scope="module")
def client():
    """
    Using TestClient as a context manager triggers FastAPI's lifespan
    startup/shutdown events (load_models() in app/main.py). Without
    this `with` block, newer Starlette/httpx versions skip lifespan
    entirely, leaving the models unloaded during tests.
    """
    with TestClient(app) as c:
        yield c


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_predict_demand_requires_internal_key(client):
    res = client.post("/predict/demand", json=SAMPLE_FEATURES)  # no header
    assert res.status_code == 401


def test_predict_demand_success(client):
    res = client.post("/predict/demand", json=SAMPLE_FEATURES, headers=HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert body["item"] == "Rice"
    assert isinstance(body["expectedDemand"], float)


def test_predict_waste_risk_success(client):
    res = client.post("/predict/waste-risk", json=SAMPLE_FEATURES, headers=HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert body["band"] in ("red", "orange", "green")
    assert 0 <= body["riskScore"] <= 100


def test_predict_rejects_unknown_item(client):
    bad = {**SAMPLE_FEATURES, "item": "Pasta"}
    res = client.post("/predict/demand", json=bad, headers=HEADERS)
    assert res.status_code == 400  # unknown item is a client error, not a server crash
    assert "Unknown item" in res.json()["detail"]


def test_recommend_overproduction_pattern(client):
    """Reproduces the Friday-rice scenario: flat prep, dropping demand."""
    payload = {
        "item": "Rice",
        "riskScore": 82.0,
        "band": "red",
        "recentFeatureDeltas": {
            "preparedQtyTrend": 0.0,
            "consumedQtyTrend": -0.15,
            "daysToExpiry": 10,
        },
    }
    res = client.post("/recommend", json=payload, headers=HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert body["cause"] == "overproduction"
    assert "Reduce" in body["recommendation"]


def test_recommend_expiry_risk_pattern(client):
    payload = {
        "item": "Spinach",
        "riskScore": 60.0,
        "band": "orange",
        "recentFeatureDeltas": {
            "preparedQtyTrend": 0.02,
            "consumedQtyTrend": 0.01,
            "daysToExpiry": 1,
        },
    }
    res = client.post("/recommend", json=payload, headers=HEADERS)
    assert res.status_code == 200
    assert res.json()["cause"] == "expiry_risk"


def test_recommend_low_risk_no_action(client):
    payload = {
        "item": "Chicken",
        "riskScore": 10.0,
        "band": "green",
        "recentFeatureDeltas": {
            "preparedQtyTrend": 0.01,
            "consumedQtyTrend": 0.02,
            "daysToExpiry": 15,
        },
    }
    res = client.post("/recommend", json=payload, headers=HEADERS)
    assert res.status_code == 200
    assert res.json()["cause"] == "none"
