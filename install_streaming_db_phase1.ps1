$ErrorActionPreference = "Stop"

$repo = "C:\Users\alexm\granite_tasty_skeleton"
$backend = Join-Path $repo "backend"
$streamers = Join-Path $backend "streamers"
$routers = Join-Path $backend "routers"
$services = Join-Path $backend "services"

foreach ($p in @($backend, $streamers, $routers, $services)) {
    if (!(Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p | Out-Null
    }
}

$dbPy = @'
from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "granite_streaming.db"


def _dict_factory(cursor: sqlite3.Cursor, row: tuple[Any, ...]) -> dict[str, Any]:
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = _dict_factory
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def now_ms() -> int:
    return int(time.time() * 1000)


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS account_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            account_number TEXT,
            event_ts_ms INTEGER NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS market_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            symbol TEXT,
            event_ts_ms INTEGER NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS balances_latest (
            account_number TEXT PRIMARY KEY,
            net_liq REAL,
            cash REAL,
            buying_power REAL,
            currency TEXT,
            source TEXT NOT NULL,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS positions_latest (
            account_number TEXT NOT NULL,
            symbol TEXT NOT NULL,
            quantity REAL,
            instrument_type TEXT,
            underlying_symbol TEXT,
            average_open_price REAL,
            mark REAL,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL,
            PRIMARY KEY (account_number, symbol)
        );

        CREATE TABLE IF NOT EXISTS orders_latest (
            order_id TEXT PRIMARY KEY,
            account_number TEXT,
            underlying_symbol TEXT,
            status TEXT,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS fills_latest (
            fill_id TEXT PRIMARY KEY,
            order_id TEXT,
            account_number TEXT,
            symbol TEXT,
            quantity REAL,
            fill_price REAL,
            filled_at TEXT,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS watchlist_quotes_latest (
            symbol TEXT PRIMARY KEY,
            bid REAL,
            ask REAL,
            bid_size REAL,
            ask_size REAL,
            mid REAL,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS watchlist_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            snapshot_ts_ms INTEGER NOT NULL,
            row_count INTEGER NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS market_context_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            snapshot_ts_ms INTEGER NOT NULL,
            context_name TEXT NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_account_events_type_ts
            ON account_events(event_type, event_ts_ms DESC);

        CREATE INDEX IF NOT EXISTS idx_market_events_symbol_ts
            ON market_events(symbol, event_ts_ms DESC);

        CREATE INDEX IF NOT EXISTS idx_quotes_updated
            ON watchlist_quotes_latest(updated_at_ms DESC);
        """
    )

    conn.execute(
        """
        INSERT OR IGNORE INTO migrations (name, applied_at_ms)
        VALUES (?, ?)
        """,
        ("streaming_db_phase1", now_ms()),
    )

    conn.commit()
    conn.close()


def upsert_balance(row: dict[str, Any], source: str = "seed") -> None:
    ts = now_ms()
    account_number = str(row.get("account_number") or row.get("account-number") or "UNKNOWN")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO balances_latest (
            account_number, net_liq, cash, buying_power, currency, source, raw_json, updated_at_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_number) DO UPDATE SET
            net_liq = excluded.net_liq,
            cash = excluded.cash,
            buying_power = excluded.buying_power,
            currency = excluded.currency,
            source = excluded.source,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (
            account_number,
            row.get("net_liquidating_value") or row.get("net_liq"),
            row.get("cash"),
            row.get("buying_power"),
            row.get("currency"),
            source,
            json.dumps(row),
            ts,
        ),
    )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Balance", account_number, ts, json.dumps(row)),
    )
    conn.commit()
    conn.close()


def replace_positions_snapshot(account_number: str, positions: list[dict[str, Any]], source: str = "seed") -> None:
    ts = now_ms()
    conn = get_conn()
    conn.execute("DELETE FROM positions_latest WHERE account_number = ?", (account_number,))
    for pos in positions:
        conn.execute(
            """
            INSERT INTO positions_latest (
                account_number, symbol, quantity, instrument_type, underlying_symbol,
                average_open_price, mark, raw_json, updated_at_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                account_number,
                str(pos.get("symbol") or ""),
                pos.get("quantity"),
                pos.get("instrument-type") or pos.get("instrument_type"),
                pos.get("underlying-symbol") or pos.get("underlying_symbol"),
                pos.get("average-open-price") or pos.get("average_open_price"),
                pos.get("mark"),
                json.dumps(pos),
                ts,
            ),
        )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("PositionsSnapshot", account_number, ts, json.dumps({"source": source, "positions": positions})),
    )
    conn.commit()
    conn.close()


def upsert_position_from_stream(payload: dict[str, Any]) -> None:
    ts = now_ms()
    account_number = str(payload.get("account-number") or payload.get("account_number") or "UNKNOWN")
    symbol = str(payload.get("symbol") or "")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO positions_latest (
            account_number, symbol, quantity, instrument_type, underlying_symbol,
            average_open_price, mark, raw_json, updated_at_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_number, symbol) DO UPDATE SET
            quantity = excluded.quantity,
            instrument_type = excluded.instrument_type,
            underlying_symbol = excluded.underlying_symbol,
            average_open_price = excluded.average_open_price,
            mark = excluded.mark,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (
            account_number,
            symbol,
            payload.get("quantity"),
            payload.get("instrument-type") or payload.get("instrument_type"),
            payload.get("underlying-symbol") or payload.get("underlying_symbol"),
            payload.get("average-open-price") or payload.get("average_open_price"),
            payload.get("mark"),
            json.dumps(payload),
            ts,
        ),
    )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Position", account_number, ts, json.dumps(payload)),
    )
    conn.commit()
    conn.close()


def upsert_order(order: dict[str, Any]) -> None:
    ts = now_ms()
    order_id = str(order.get("id"))
    account_number = order.get("account-number") or order.get("account_number")
    underlying_symbol = order.get("underlying-symbol") or order.get("underlying_symbol")
    status = order.get("status")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO orders_latest (order_id, account_number, underlying_symbol, status, raw_json, updated_at_ms)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(order_id) DO UPDATE SET
            account_number = excluded.account_number,
            underlying_symbol = excluded.underlying_symbol,
            status = excluded.status,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (order_id, account_number, underlying_symbol, status, json.dumps(order), ts),
    )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Order", account_number, ts, json.dumps(order)),
    )

    for leg in order.get("legs") or []:
        for fill in leg.get("fills") or []:
            fill_id = str(fill.get("fill-id") or fill.get("fill_id") or fill.get("ext-exec-id") or f"{order_id}_{ts}")
            conn.execute(
                """
                INSERT INTO fills_latest (
                    fill_id, order_id, account_number, symbol, quantity, fill_price,
                    filled_at, raw_json, updated_at_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(fill_id) DO UPDATE SET
                    order_id = excluded.order_id,
                    account_number = excluded.account_number,
                    symbol = excluded.symbol,
                    quantity = excluded.quantity,
                    fill_price = excluded.fill_price,
                    filled_at = excluded.filled_at,
                    raw_json = excluded.raw_json,
                    updated_at_ms = excluded.updated_at_ms
                """,
                (
                    fill_id,
                    order_id,
                    account_number,
                    leg.get("symbol"),
                    fill.get("quantity"),
                    fill.get("fill-price") or fill.get("fill_price"),
                    fill.get("filled-at") or fill.get("filled_at"),
                    json.dumps(fill),
                    ts,
                ),
            )
    conn.commit()
    conn.close()


def record_account_message(msg_type: str, payload: dict[str, Any]) -> None:
    msg_key = (msg_type or "").lower()

    if "order" in msg_key:
        upsert_order(payload)
        return

    if "position" in msg_key:
        upsert_position_from_stream(payload)
        return

    if "balance" in msg_key:
        upsert_balance(payload, source="stream")
        return

    account_number = payload.get("account-number") or payload.get("account_number")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        (msg_type, account_number, now_ms(), json.dumps(payload)),
    )
    conn.commit()
    conn.close()


def upsert_quote(symbol: str, bid: float | None, ask: float | None, bid_size: float | None, ask_size: float | None, raw: dict[str, Any]) -> None:
    ts = now_ms()
    mid = None
    if bid is not None and ask is not None:
        mid = round((bid + ask) / 2, 6)
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO watchlist_quotes_latest (symbol, bid, ask, bid_size, ask_size, mid, raw_json, updated_at_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
            bid = excluded.bid,
            ask = excluded.ask,
            bid_size = excluded.bid_size,
            ask_size = excluded.ask_size,
            mid = excluded.mid,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (symbol.upper(), bid, ask, bid_size, ask_size, mid, json.dumps(raw), ts),
    )
    conn.execute(
        """
        INSERT INTO market_events (event_type, symbol, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Quote", symbol.upper(), ts, json.dumps(raw)),
    )
    conn.commit()
    conn.close()


def snapshot_watchlist(name: str = "WEEKLYS") -> None:
    ts = now_ms()
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT symbol, bid, ask, bid_size, ask_size, mid, updated_at_ms
        FROM watchlist_quotes_latest
        ORDER BY symbol
        """
    ).fetchall()
    payload = {"name": name, "rows": rows}
    snapshot_id = f"{name}_{ts}"
    conn.execute(
        """
        INSERT INTO watchlist_snapshots (snapshot_id, snapshot_ts_ms, row_count, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        (snapshot_id, ts, len(rows), json.dumps(payload)),
    )
    conn.execute(
        """
        INSERT INTO market_context_snapshots (snapshot_id, snapshot_ts_ms, context_name, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        (
            f"market_context_{ts}",
            ts,
            "watchlist_quote_snapshot",
            json.dumps(
                {
                    "symbol_count": len(rows),
                    "rows_with_mid": sum(1 for r in rows if r.get("mid") is not None),
                    "symbols": [r["symbol"] for r in rows],
                }
            ),
        ),
    )
    conn.commit()
    conn.close()
'@

$symbolLoaderPy = @'
from __future__ import annotations

from pathlib import Path


def load_weeklys_symbols() -> list[str]:
    repo_root = Path(__file__).resolve().parents[2]
    seed_path = repo_root / "frontend" / "src" / "components" / "watchlist" / "watchlistSeed.ts"

    if not seed_path.exists():
        return ["SPY", "QQQ", "IWM", "TSLA", "NVDA"]

    text = seed_path.read_text(encoding="utf-8", errors="ignore")
    start_marker = "const WEEKLYS_CSV = `"
    start = text.find(start_marker)
    if start == -1:
        return ["SPY", "QQQ", "IWM", "TSLA", "NVDA"]

    start += len(start_marker)
    end = text.find("`;", start)
    if end == -1:
        return ["SPY", "QQQ", "IWM", "TSLA", "NVDA"]

    csv_block = text[start:end]
    symbols: list[str] = []
    for line in csv_block.splitlines():
        value = line.strip().upper()
        if not value or value == "SYMBOL":
            continue
        if value not in symbols:
            symbols.append(value)

    return symbols or ["SPY", "QQQ", "IWM", "TSLA", "NVDA"]
'@

$accountStreamerPy = @'
from __future__ import annotations

import asyncio
import json
import os

import websockets
from fastapi import WebSocket
from tastytrade import Account

from db import record_account_message, replace_positions_snapshot, upsert_balance

STREAMER_HOST_PROD = "wss://streamer.tastyworks.com"
STREAMER_HOST_CERT = "wss://streamer.cert.tastyworks.com"


class AccountStreamer:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self.account_numbers: list[str] = []
        self.host = STREAMER_HOST_CERT if os.getenv("TASTY_SANDBOX", "false").lower() == "true" else STREAMER_HOST_PROD

    async def seed_once(self, session) -> None:
        print("🌱 Seeding balances + positions once via REST before account stream takes over...")
        accounts = await Account.get(session)
        self.account_numbers = []

        for acc in accounts:
            account_number = getattr(acc, "account_number", None)
            if not account_number:
                continue

            self.account_numbers.append(account_number)

            try:
                balance = await acc.get_balances(session)
                upsert_balance(
                    {
                        "account_number": account_number,
                        "net_liquidating_value": float(getattr(balance, "net_liquidating_value", 0) or 0),
                        "cash": float(getattr(balance, "cash_balance", 0) or 0),
                        "buying_power": float(
                            getattr(balance, "equity_buying_power", 0)
                            or getattr(balance, "derivatives_buying_power", 0)
                            or 0
                        ),
                        "currency": getattr(balance, "currency", "USD"),
                    },
                    source="seed",
                )
            except Exception as e:
                print(f"⚠️ Balance seed failed for {account_number}: {type(e).__name__} - {e}")

            try:
                positions = await acc.get_positions(session)
                replace_positions_snapshot(
                    account_number=account_number,
                    positions=[p.__dict__ if hasattr(p, "__dict__") else dict(p) for p in positions],
                    source="seed",
                )
            except Exception as e:
                print(f"⚠️ Position seed failed for {account_number}: {type(e).__name__} - {e}")

        print(f"✅ Account seed complete | accounts={self.account_numbers}")

    async def start(self, session):
        await self.seed_once(session)

        while True:
            try:
                token = f"Bearer {session.session_token}"
                async with websockets.connect(self.host, ping_interval=20, ping_timeout=20) as ws:
                    print(f"✅ Account streamer websocket connected to {self.host}")

                    connect_msg = {
                        "action": "connect",
                        "value": self.account_numbers,
                        "auth-token": token,
                        "request-id": 1,
                    }
                    await ws.send(json.dumps(connect_msg))
                    print(f"📡 Account streamer connect sent for accounts={self.account_numbers}")

                    heartbeat_task = asyncio.create_task(self._heartbeat_loop(ws, token))

                    try:
                        async for message in ws:
                            data = json.loads(message)

                            if "status" in data:
                                if data.get("status") == "ok" and data.get("action") == "connect":
                                    print(f"✅ Account streamer subscribed | session={data.get('web-socket-session-id')}")
                                elif data.get("status") == "ok" and data.get("action") == "heartbeat":
                                    print("💓 Account streamer heartbeat ack")
                                continue

                            msg_type = data.get("type")
                            payload = data.get("data", {}) or {}

                            if msg_type:
                                record_account_message(msg_type, payload)
                                print(f"🔔 ACCOUNT {msg_type}")
                                await self._broadcast(data)
                    finally:
                        heartbeat_task.cancel()
            except Exception as e:
                print(f"⚠️ Account streamer lost connection: {type(e).__name__} - {e}")
                await asyncio.sleep(5)

    async def _heartbeat_loop(self, ws, token):
        while True:
            await asyncio.sleep(15)
            await ws.send(json.dumps({"action": "heartbeat", "auth-token": token, "request-id": 99}))

    async def _broadcast(self, payload: dict):
        for client in self.clients[:]:
            try:
                await client.send_json(payload)
            except Exception:
                if client in self.clients:
                    self.clients.remove(client)

    async def broadcast_to(self, websocket: WebSocket):
        self.clients.append(websocket)
        try:
            while True:
                await asyncio.sleep(30)
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)


account_streamer = AccountStreamer()
'@

$marketStreamerPy = @'
from __future__ import annotations

import asyncio
import json

import websockets
from fastapi import WebSocket
from tastytrade import Session

from db import snapshot_watchlist, upsert_quote
from services.symbol_loader import load_weeklys_symbols


class MarketStreamer:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self.symbols = load_weeklys_symbols()
        self.data_cache: dict[str, dict] = {}

    async def start(self, session: Session):
        print(f"🚀 Starting DXLink market streamer | weeklys={len(self.symbols)} symbols")
        asyncio.create_task(self._snapshot_loop())

        while True:
            try:
                response = await session._client.get("/api-quote-tokens")
                token_data = response.json()["data"]
                token = token_data["token"]
                dxlink_url = token_data["dxlink-url"]

                async with websockets.connect(dxlink_url, ping_interval=20, ping_timeout=20) as ws:
                    print(f"✅ DXLink connected to {dxlink_url}")

                    await ws.send(json.dumps({
                        "type": "SETUP",
                        "channel": 0,
                        "version": "0.1-DXF-JS/0.3.0",
                        "keepaliveTimeout": 60,
                        "acceptKeepaliveTimeout": 60
                    }))

                    await ws.send(json.dumps({
                        "type": "AUTH",
                        "channel": 0,
                        "token": token
                    }))

                    await ws.send(json.dumps({
                        "type": "CHANNEL_REQUEST",
                        "channel": 1,
                        "service": "FEED",
                        "parameters": {"contract": "AUTO"}
                    }))

                    await ws.send(json.dumps({
                        "type": "FEED_SETUP",
                        "channel": 1,
                        "acceptAggregationPeriod": 0.1,
                        "acceptDataFormat": "COMPACT",
                        "acceptEventFields": {
                            "Quote": ["eventSymbol", "bidPrice", "askPrice", "bidSize", "askSize"]
                        }
                    }))

                    add = [{"type": "Quote", "symbol": s} for s in self.symbols]
                    await ws.send(json.dumps({
                        "type": "FEED_SUBSCRIPTION",
                        "channel": 1,
                        "reset": True,
                        "add": add
                    }))
                    print(f"📡 DXLink subscribed to {len(add)} underlying quotes")

                    async for message in ws:
                        data = json.loads(message)

                        if data.get("type") == "FEED_DATA":
                            await self._handle_feed_data(data)
                            await self._broadcast({"type": "RawFeed", "data": data})
                        elif data.get("type") == "KEEPALIVE":
                            print("💓 DXLink keepalive")
            except Exception as e:
                print(f"⚠️ DXLink connection error: {type(e).__name__} - {e}")
                await asyncio.sleep(3)

    async def _handle_feed_data(self, data: dict):
        payload = data.get("data", [])
        if len(payload) < 2:
            return

        event_type = payload[0]
        values = payload[1]
        if event_type != "Quote" or not isinstance(values, list):
            return

        for i in range(0, len(values), 5):
            try:
                symbol = values[i]
                bid = values[i + 1]
                ask = values[i + 2]
                bid_size = values[i + 3]
                ask_size = values[i + 4]
            except IndexError:
                continue

            normalized = {
                "symbol": symbol,
                "bid": bid,
                "ask": ask,
                "bidSize": bid_size,
                "askSize": ask_size,
            }
            self.data_cache[symbol] = normalized
            upsert_quote(symbol, bid, ask, bid_size, ask_size, normalized)

    async def _snapshot_loop(self):
        while True:
            await asyncio.sleep(300)
            try:
                snapshot_watchlist("WEEKLYS")
                print("🧊 5-min market snapshots written")
            except Exception as e:
                print(f"⚠️ Snapshot loop error: {type(e).__name__} - {e}")

    async def _broadcast(self, payload: dict):
        for client in self.clients[:]:
            try:
                await client.send_json(payload)
            except Exception:
                if client in self.clients:
                    self.clients.remove(client)

    async def broadcast_to(self, websocket: WebSocket):
        print("🔌 New client connected to market streamer")
        self.clients.append(websocket)
        try:
            while True:
                await asyncio.sleep(30)
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)


market_streamer = MarketStreamer()
'@

$storeRouterPy = @'
from fastapi import APIRouter
from db import get_conn

router = APIRouter()

@router.get("/store/health")
async def store_health():
    conn = get_conn()
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
    counts = {
        "balances_latest": conn.execute("SELECT COUNT(*) AS c FROM balances_latest").fetchone()["c"],
        "positions_latest": conn.execute("SELECT COUNT(*) AS c FROM positions_latest").fetchone()["c"],
        "watchlist_quotes_latest": conn.execute("SELECT COUNT(*) AS c FROM watchlist_quotes_latest").fetchone()["c"],
        "account_events": conn.execute("SELECT COUNT(*) AS c FROM account_events").fetchone()["c"],
        "market_events": conn.execute("SELECT COUNT(*) AS c FROM market_events").fetchone()["c"],
    }
    conn.close()
    return {"ok": True, "tables": [t["name"] for t in tables], "counts": counts}
'@

$mainPy = @'
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

from db import init_db
from streamers.market_streamer import market_streamer
from streamers.account_streamer import account_streamer

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
    print(f"✅ React frontend mounted at /app")
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
'@

Set-Content -Path (Join-Path $backend "db.py") -Value $dbPy -Encoding UTF8
Set-Content -Path (Join-Path $services "symbol_loader.py") -Value $symbolLoaderPy -Encoding UTF8
Set-Content -Path (Join-Path $streamers "account_streamer.py") -Value $accountStreamerPy -Encoding UTF8
Set-Content -Path (Join-Path $streamers "market_streamer.py") -Value $marketStreamerPy -Encoding UTF8
Set-Content -Path (Join-Path $routers "store.py") -Value $storeRouterPy -Encoding UTF8
Set-Content -Path (Join-Path $backend "main.py") -Value $mainPy -Encoding UTF8

Write-Host "Installed DB + streaming phase 1."
Write-Host "Next:"
Write-Host "cd $backend"
Write-Host "python main.py"
Write-Host "start http://localhost:8000/api/store/health"