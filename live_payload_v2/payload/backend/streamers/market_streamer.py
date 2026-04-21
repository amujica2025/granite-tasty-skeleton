from __future__ import annotations
import asyncio, json
from fastapi import WebSocket
import websockets
from tastytrade import Session
from backend.services import live_state

class MarketStreamer:
    def __init__(self) -> None:
        self.clients: list[WebSocket] = []
        self._current_symbols: set[str] = set()

    async def start(self, session: Session) -> None:
        while True:
            symbols = live_state.get_quote_symbols()
            if not symbols:
                await asyncio.sleep(2)
                continue
            self._current_symbols = set(symbols)
            try:
                response = await session._client.get('/api-quote-tokens')
                token_data = response.json()['data']
                token = token_data['token']
                dxlink_url = token_data['dxlink-url']
                async with websockets.connect(dxlink_url) as ws:
                    await ws.send(json.dumps({"type":"SETUP","channel":0,"version":"0.1-DXF-JS/0.3.0","keepaliveTimeout":60,"acceptKeepaliveTimeout":60}))
                    await ws.send(json.dumps({"type":"AUTH","channel":0,"token":token}))
                    await ws.send(json.dumps({"type":"CHANNEL_REQUEST","channel":1,"service":"FEED","parameters":{"contract":"AUTO"}}))
                    await ws.send(json.dumps({"type":"FEED_SETUP","channel":1,"acceptAggregationPeriod":0.1,"acceptDataFormat":"COMPACT","acceptEventFields":{"Quote":["eventSymbol","bidPrice","askPrice","bidSize","askSize"]}}))
                    await ws.send(json.dumps({"type":"FEED_SUBSCRIPTION","channel":1,"reset":True,"add":[{"type":"Quote","symbol":s} for s in symbols]}))
                    initial_seen: dict[str,float] = {}
                    async for message in ws:
                        data = json.loads(message)
                        if data.get('type') != 'FEED_DATA':
                            if self._current_symbols != set(live_state.get_quote_symbols()):
                                break
                            continue
                        feed = data.get('data', [])
                        if not feed or feed[0] != 'Quote':
                            continue
                        values = feed[1] if len(feed) > 1 and isinstance(feed[1], list) else []
                        for i in range(0, len(values), 5):
                            symbol = str(values[i]).upper()
                            bid = float(values[i+1] or 0)
                            ask = float(values[i+2] or 0)
                            mid = round((bid + ask) / 2, 4) if (bid or ask) else 0.0
                            prev = live_state.quote_cache.get(symbol, {})
                            base = initial_seen.setdefault(symbol, prev.get('base_price') or mid or 1.0)
                            pct = round(((mid - base) / base) * 100, 4) if base else 0.0
                            payload = {'symbol': symbol, 'bid': bid, 'ask': ask, 'latest': mid, 'pct_change': pct, 'base_price': base}
                            live_state.set_quote(symbol, payload)
                            await self._broadcast({'type': 'quote', 'data': payload})
                        if self._current_symbols != set(live_state.get_quote_symbols()):
                            break
            except Exception as exc:
                print(f'market streamer reconnecting after error: {exc}')
                await asyncio.sleep(2)

    async def _broadcast(self, message: dict) -> None:
        for client in self.clients[:]:
            try:
                await client.send_json(message)
            except Exception:
                if client in self.clients:
                    self.clients.remove(client)

    async def broadcast_to(self, websocket: WebSocket) -> None:
        self.clients.append(websocket)
        try:
            for payload in live_state.quote_cache.values():
                await websocket.send_json({'type': 'quote', 'data': payload})
            while True:
                await asyncio.sleep(30)
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)

market_streamer = MarketStreamer()
