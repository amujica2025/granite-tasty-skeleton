import sys
from pathlib import Path
from contextlib import asynccontextmanager
import asyncio

backend_root = Path(__file__).parent.resolve()
sys.path.insert(0, str(backend_root))

from config import session
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from db import init_db
from streamers.market_streamer import market_streamer
from streamers.account_streamer import account_streamer
from services.chain_manager import chain_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🗄️ Initializing SQLite DB...")
    init_db()
    print("✅ DB ready")

    print("🔄 Authenticating session...")
    await session.refresh()
    print("✅ Session authenticated.")

    print("🚀 Starting streamers...")
    asyncio.create_task(market_streamer.start(session))
    asyncio.create_task(account_streamer.start(session))

    print("🧬 Seeding option chains from active registry...")
    asyncio.create_task(chain_manager.seed_registry_symbols(session))
    asyncio.create_task(chain_manager.periodic_refresh_loop(session, interval_seconds=300))

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

dist_path = backend_root.parent / "frontend" / "dist"
if dist_path.exists():
    app.mount("/app", StaticFiles(directory=str(dist_path), html=True), name="frontend")
    print("✅ React frontend mounted at /app")
else:
    print("⚠️ Frontend dist not found")

from routers.accounts import router as accounts_router
from routers.market import router as market_router
from routers.orders import router as orders_router
from routers.store import router as store_router

app.include_router(accounts_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(store_router, prefix="/api")


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