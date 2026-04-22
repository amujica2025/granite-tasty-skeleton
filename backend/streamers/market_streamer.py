import asyncio
import json
import websockets

from config import session
from services.db import upsert_quote
from services.live_state import set_quote, set_market_connected, set_stream_error
from services.symbol_registry import get_symbols


BATCH_SIZE = 64


class MarketStreamer:
    def __init__(self):
        self.clients = []
        self.subscribed_symbols = set()

    async def start(self):
        while True:
            try:
                symbols = get_symbols()
                symbol_count = len(symbols)
                print(f"📋 Registry active symbols: {symbol_count}")

                if not symbols:
                    print("⚠️ No symbols in registry")
                    set_market_connected(False)
                    set_stream_error("No symbols in registry")
                    await asyncio.sleep(2)
                    continue

                response = await session._client.get("/api-quote-tokens")
                payload = response.json()

                print("QUOTE TOKEN RAW:", payload)

                token_data = payload.get("data", payload)
                token = token_data.get("token")
                dxlink_url = token_data.get("dxlink-url")

                if not token or not dxlink_url:
                    raise RuntimeError(f"Missing token/dxlink-url: {payload}")

                print(f"✅ Token OK | symbol_count={symbol_count}")

                async with websockets.connect(
                    dxlink_url,
                    ping_interval=20,
                    ping_timeout=20,
                    close_timeout=10,
                    max_size=None,
                ) as ws:
                    print("✅ Connected to DXLink")
                    set_market_connected(True)
                    set_stream_error(None)
                    self.subscribed_symbols = set()

                    await ws.send(json.dumps({
                        "type": "SETUP",
                        "channel": 0,
                        "version": "0.1-DXF-JS/0.3.0",
                        "keepaliveTimeout": 60,
                        "acceptKeepaliveTimeout": 60,
                    }))

                    await ws.send(json.dumps({
                        "type": "AUTH",
                        "channel": 0,
                        "token": token,
                    }))

                    await ws.send(json.dumps({
                        "type": "CHANNEL_REQUEST",
                        "channel": 1,
                        "service": "FEED",
                        "parameters": {"contract": "AUTO"},
                    }))

                    await ws.send(json.dumps({
                        "type": "FEED_SETUP",
                        "channel": 1,
                        "acceptAggregationPeriod": 0.1,
                        "acceptDataFormat": "COMPACT",
                        "acceptEventFields": {
                            "Quote": ["eventSymbol", "bidPrice", "askPrice"]
                        },
                    }))

                    await self._subscribe_in_batches(ws, symbols)
                    print(f"📡 Subscribed to {len(self.subscribed_symbols)} symbols in batches")

                    async for message in ws:
                        data = json.loads(message)
                        msg_type = data.get("type")

                        if msg_type == "KEEPALIVE":
                            continue

                        if msg_type != "FEED_DATA":
                            continue

                        feed = data.get("data", [])
                        if not feed or feed[0] != "Quote":
                            continue

                        values = feed[1] if len(feed) > 1 else []
                        if not isinstance(values, list):
                            continue

                        for i in range(0, len(values), 3):
                            try:
                                symbol = str(values[i]).upper()
                                bid = float(values[i + 1] or 0)
                                ask = float(values[i + 2] or 0)
                            except Exception:
                                continue

                            mid = round((bid + ask) / 2, 4) if (bid or ask) else 0.0

                            quote = {
                                "symbol": symbol,
                                "bid": bid,
                                "ask": ask,
                                "mid": mid,
                            }

                            set_quote(symbol, quote)
                            upsert_quote(symbol, bid, ask)
                            await self._broadcast_quote(quote)

            except Exception as e:
                set_market_connected(False)
                set_stream_error(f"{type(e).__name__}: {e}")
                print(f"⚠️ Stream error: {type(e).__name__} - {e}")
                await asyncio.sleep(3)

    async def _subscribe_in_batches(self, ws, symbols):
        symbols = sorted(set(symbols))
        for idx in range(0, len(symbols), BATCH_SIZE):
            batch = symbols[idx: idx + BATCH_SIZE]
            await ws.send(json.dumps({
                "type": "FEED_SUBSCRIPTION",
                "channel": 1,
                "reset": idx == 0,
                "add": [{"type": "Quote", "symbol": s} for s in batch],
            }))
            self.subscribed_symbols.update(batch)
            print(
                f"📦 Subscription batch {idx // BATCH_SIZE + 1}: "
                f"{len(batch)} symbols | total={len(self.subscribed_symbols)}"
            )
            await asyncio.sleep(0.15)

    async def _broadcast_quote(self, quote):
        stale_clients = []

        for client in self.clients[:]:
            try:
                await client.send_json({"type": "quote", "data": quote})
            except Exception:
                stale_clients.append(client)

        for client in stale_clients:
            if client in self.clients:
                self.clients.remove(client)

    async def broadcast_to(self, websocket):
        self.clients.append(websocket)
        try:
            while True:
                await websocket.receive_text()
        except Exception:
            pass
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)
            print("❌ WebSocket disconnected")


market_streamer = MarketStreamer()