from fastapi import FastAPI

app = FastAPI(title="QULIN AI Service")

@app.get("/health")
def health():
    return {"status": "ok", "service": "qulin-ai-service"}

# Future router mounts (Phase 6):
# app.include_router(demand.router, prefix="/predict")
# app.include_router(waste_risk.router, prefix="/predict")
# app.include_router(recommend.router)