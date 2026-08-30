import sys
from pathlib import Path
import joblib

# ml/ is a sibling of ai-service/ — add it to the path so we import the
# SAME feature_columns.py used during training. This is the mechanism
# that prevents column-order drift described in docs/api-contract.md.
REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.append(str(REPO_ROOT / "ml" / "preprocessing"))

from feature_columns import FEATURE_COLUMNS, ITEM_ENCODING, MEAL_ENCODING  # noqa: E402

DEMAND_MODEL_PATH = REPO_ROOT / "ml" / "models" / "demand_model.pkl"
WASTE_RISK_MODEL_PATH = REPO_ROOT / "ml" / "models" / "waste_risk_model.pkl"

_demand_model = None
_waste_risk_model = None


def load_models():
    """Called once at FastAPI startup (see app/main.py)."""
    global _demand_model, _waste_risk_model
    if not DEMAND_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Demand model not found at {DEMAND_MODEL_PATH}. Run ml/training/train_demand.py first."
        )
    if not WASTE_RISK_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Waste-risk model not found at {WASTE_RISK_MODEL_PATH}. Run ml/training/train_waste_risk.py first."
        )
    _demand_model = joblib.load(DEMAND_MODEL_PATH)
    _waste_risk_model = joblib.load(WASTE_RISK_MODEL_PATH)
    print(f"Loaded models from {DEMAND_MODEL_PATH.parent}")


def get_demand_model():
    if _demand_model is None:
        raise RuntimeError("Demand model not loaded — load_models() must run at startup")
    return _demand_model


def get_waste_risk_model():
    if _waste_risk_model is None:
        raise RuntimeError("Waste-risk model not loaded — load_models() must run at startup")
    return _waste_risk_model
