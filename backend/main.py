import sys
from pathlib import Path
from contextlib import asynccontextmanager

backend_root = Path(__file__).parent.resolve()
sys.path.insert(0, str(backend_root))

from config import session
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio

from streamers.market_streamer import market_streamer
from streamers.account_streamer import account_streamer

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Authenticating session...")
    await session.refresh()
    print("✅ Session authenticated.")

    print("🚀 Starting background streamers...")
    asyncio.create_task(market_streamer.start(session))
    asyncio.create_task(account_streamer.start(session))

    # Force initial balances call so we get real Net Liq immediately
    try:
        from routers.accounts import get_balances
        await get_balances()
        print("✅ Initial balances fetch completed")
    except Exception as e:
        print(f"⚠️ Initial balances fetch failed: {e}")

    yield
    print("Shutting down streamers...")

app = FastAPI(title="Granite Tasty Skeleton", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React frontend
dist_path = backend_root.parent / "frontend" / "dist"
if dist_path.exists():
    app.mount("/app", StaticFiles(directory=str(dist_path), html=True), name="frontend")
    print(f"✅ React frontend mounted at /app")
else:
    print("⚠️ Frontend dist not found")

# Routers
from routers.accounts import router as accounts_router
from routers.market import router as market_router
from routers.orders import router as orders_router

app.include_router(accounts_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(orders_router, prefix="/api")

# WebSocket endpoints
@app.websocket("/ws/market")
async def market_websocket(websocket: WebSocket):
    print("🔌 New client connected to /ws/market")
    try:
        await websocket.accept()
        await market_streamer.broadcast_to(websocket)
    except Exception as e:
        print(f"❌ /ws/market error: {e}")

@app.websocket("/ws/account")
async def account_websocket(websocket: WebSocket):
    print("🔌 New client connected to /ws/account")
    try:
        await websocket.accept()
        await account_streamer.broadcast_to(websocket)
    except Exception as e:
        print(f"❌ /ws/account error: {e}")

if __name__ == "__main__":
    print("✅ Starting Granite Tasty Skeleton...")
    uvicorn.run(app, host="0.0.0.0", port=8000)