from fastapi import APIRouter

router = APIRouter()

@router.get("/symbols")
async def get_symbols():
    return {"message": "Market data streaming available via /ws/market WebSocket"}
