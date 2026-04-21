import sys, asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

backend_root = Path(__file__).parent.resolve()
sys.path.insert(0, str(backend_root.parent))
sys.path.insert(0, str(backend_root))

from backend.config import session
from backend.streamers.market_streamer import market_streamer
from backend.streamers.account_streamer import account_streamer
from backend.services.alert_engine import alert_engine
from backend.services import live_state
from backend.routers.accounts import router as accounts_router
from backend.routers.market import router as market_router
from backend.routers.alerts import router as alerts_router
from backend.routers.orders import router as orders_router
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    await session.refresh()
    asyncio.create_task(market_streamer.start(session))
    asyncio.create_task(account_streamer.start(session))
    asyncio.create_task(alert_engine.start())
    yield

app = FastAPI(title='Granite Tasty Skeleton', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
dist_path = backend_root.parent / 'frontend' / 'dist'
if dist_path.exists():
    app.mount('/app', StaticFiles(directory=str(dist_path), html=True), name='frontend')
app.include_router(accounts_router, prefix='/api')
app.include_router(market_router, prefix='/api')
app.include_router(alerts_router, prefix='/api')
app.include_router(orders_router, prefix='/api')

@app.websocket('/ws/market')
async def market_ws(websocket: WebSocket):
    await websocket.accept(); await market_streamer.broadcast_to(websocket)

@app.websocket('/ws/account')
async def account_ws(websocket: WebSocket):
    await websocket.accept(); await account_streamer.broadcast_to(websocket)

@app.websocket('/ws/alerts')
async def alerts_ws(websocket: WebSocket):
    await websocket.accept(); live_state.alert_clients.append(websocket)
    try:
        for event in live_state.alert_history[:20]:
            await websocket.send_json({'type':'alert_triggered','event': event})
        while True: await asyncio.sleep(30)
    finally:
        if websocket in live_state.alert_clients: live_state.alert_clients.remove(websocket)

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
