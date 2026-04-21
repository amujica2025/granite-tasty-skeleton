from __future__ import annotations

import asyncio
import json

import websockets
from fastapi import WebSocket
from tastytrade import Session

from db import snapshot_watchlist, upsert_quote
from services.symbol_registry import get_active_symbols, refresh_registry


class MarketStreamer:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self.data_cache: dict[str, dict] = {}
        self.current_symbols: set[str] = set()

    async def start(self, session: Session):
        registry_stats = refresh_registry()
        print(f"ðŸš€ Starting DXLink market streamer | registry active={registry_stats['active_count']}")

        asyncio.create_task(self._snapshot_loop())
        asyncio.create_task(self._registry_refresh_loop())

        while True:
            try:
                response = await session._client.get("/api-quote-tokens")
                token_data = response.json()["data"]
                token = token_data["token"]
                dxlink_url = token_data["dxlink-url"]

                async with websockets.connect(dxlink_url, ping_interval=20, ping_timeout=20) as ws:
                    print(f"âœ… DXLink connected to {dxlink_url}")

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

                    await self._sync_subscriptions(ws, force_reset=True)

                    async for message in ws:
                        data = json.loads(message)

                        if data.get("type") == "FEED_DATA":
                            await self._handle_feed_data(data)
                            await self._broadcast({"type": "RawFeed", "data": data})

                        elif data.get("type") == "KEEPALIVE":
                            print("ðŸ’“ DXLink keepalive")
                            await self._sync_subscriptions(ws, force_reset=False)
            except Exception as e:
                print(f"âš ï¸ DXLink connection error: {type(e).__name__} - {e}")
                await asyncio.sleep(3)

    async def _sync_subscriptions(self, ws, force_reset: bool):
        target_symbols = set(get_active_symbols())

        if not target_symbols:
            print("âš ï¸ Symbol registry is empty; no market subscriptions sent")
            self.current_symbols = set()
            return

        if force_reset or not self.current_symbols:
            await ws.send(json.dumps({
                "type": "FEED_SUBSCRIPTION",
                "channel": 1,
                "reset": True,
                "add": [{"type": "Quote", "symbol": s} for s in sorted(target_symbols)]
            }))
            self.current_symbols = target_symbols
            print(f"ðŸ“¡ DXLink subscribed to {len(self.current_symbols)} registry symbols")
            return

        to_add = sorted(target_symbols - self.current_symbols)
        to_remove = sorted(self.current_symbols - target_symbols)

        if to_add or to_remove:
            payload = {
                "type": "FEED_SUBSCRIPTION",
                "channel": 1,
                "reset": False,
            }
            if to_add:
                payload["add"] = [{"type": "Quote", "symbol": s} for s in to_add]
            if to_remove:
                payload["remove"] = [{"type": "Quote", "symbol": s} for s in to_remove]

            await ws.send(json.dumps(payload))
            self.current_symbols = target_symbols
            print(f"ðŸ”„ DXLink registry sync | add={len(to_add)} remove={len(to_remove)} total={len(self.current_symbols)}")

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
                print("ðŸ§Š 5-min market snapshots written")
            except Exception as e:
                print(f"âš ï¸ Snapshot loop error: {type(e).__name__} - {e}")

    async def _registry_refresh_loop(self):
        while True:
            await asyncio.sleep(60)
            try:
                stats = refresh_registry()
                print(f"ðŸ§­ Registry refresh | active={stats['active_count']} weeklys={stats['weeklys_count']} positions={stats['positions_count']}")
            except Exception as e:
                print(f"âš ï¸ Registry refresh error: {type(e).__name__} - {e}")

    async def _broadcast(self, payload: dict):
        for client in self.clients[:]:
            try:
                await client.send_json(payload)
            except Exception:
                if client in self.clients:
                    self.clients.remove(client)

    async def broadcast_to(self, websocket: WebSocket):
        print("ðŸ”Œ New client connected to market streamer")
        self.clients.append(websocket)
        try:
            while True:
                await asyncio.sleep(30)
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)


market_streamer = MarketStreamer()
