import sys
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Load .env FIRST, before any other module (e.g. services/security.py) tries
# to read os.getenv(...) — this was missing, causing AI_SERVICE_KEY to be None.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

sys.path.append(
    str(Path(__file__).resolve().parent)
)  # allow `from services...` style imports

from fastapi import FastAPI

from services.model_loader import load_models
from routers import demand, waste_risk, recommend


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load both .pkl models ONCE at startup, not per-request (Section 10 of the roadmap)
    load_models()
    yield


app = FastAPI(title="QULIN AI Service", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok", "service": "qulin-ai-service"}


app.include_router(demand.router, prefix="/predict", tags=["predict"])
app.include_router(waste_risk.router, prefix="/predict", tags=["predict"])
app.include_router(recommend.router, tags=["recommend"])
