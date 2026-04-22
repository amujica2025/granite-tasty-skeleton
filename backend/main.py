import asyncio
from fastapi import FastAPI, WebSocket

from config import session
from services.db import init_db
from streamers.market_streamer import market_streamer
from streamers.account_streamer import account_streamer
from routers.health import router as health_router

app = FastAPI()

app.include_router(health_router, prefix="/api")


@app.on_event("startup")
async def startup():
    print("🚀 Starting Granite Backend (Clean Build)")

    init_db()
    print("✅ DB initialized")

    print("🔄 Refreshing tastytrade session...")
    await session.refresh()
    print("✅ Session refreshed")

    asyncio.create_task(market_streamer.start())
    print("✅ Market streamer started")

    asyncio.create_task(account_streamer.start(session))
    print("✅ Account streamer started")


@app.get("/")
def root():
    return {"status": "ok"}


@app.websocket("/ws/market")
async def market_ws(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Market WebSocket client connected")
    await market_streamer.broadcast_to(websocket)


@app.websocket("/ws/account")
async def account_ws(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Account WebSocket client connected")
    await account_streamer.broadcast_to(websocket)