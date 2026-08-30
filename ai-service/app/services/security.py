import os
from fastapi import Header, HTTPException


async def verify_internal_key(x_internal_key: str = Header(None)):
    """
    The AI service trusts the backend as an internal caller — end users
    never call FastAPI directly. Auth is a shared secret header, not a
    user JWT (per docs/api-contract.md Section 3.2 / roadmap Section 12).
    """
    expected = os.getenv("AI_SERVICE_KEY")
    if not expected:
        raise HTTPException(status_code=500, detail="AI_SERVICE_KEY not configured on server")
    if x_internal_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing internal service key")
