import asyncio
import json
import websockets
from fastapi import WebSocket
from tastytrade import Session

class MarketStreamer:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self.symbols = ["SPY", "AAPL", "QQQ", "TSLA", "NVDA"]
        self.data_cache = {}

    async def start(self, session: Session):
        print("🚀 Starting Direct DXLink WebSocket (protocol 1.0.2)...")

        while True:
            try:
                # Get quote token using the internal client
                response = await session._client.get("/api-quote-tokens")
                print(f"Quote token response: {response.status_code} - {response.text}")

                token_data = response.json()["data"]
                token = token_data["token"]
                dxlink_url = token_data["dxlink-url"]

                print(f"✅ Got DXLink token, connecting to {dxlink_url}")

                async with websockets.connect(dxlink_url) as ws:
                    print("✅ Connected to DXLink WebSocket")

                    # 1. SETUP
                    await ws.send(json.dumps({
                        "type": "SETUP",
                        "channel": 0,
                        "version": "0.1-DXF-JS/0.3.0",
                        "keepaliveTimeout": 60,
                        "acceptKeepaliveTimeout": 60
                    }))

                    # 2. AUTH
                    await ws.send(json.dumps({
                        "type": "AUTH",
                        "channel": 0,
                        "token": token
                    }))

                    # 3. CHANNEL_REQUEST
                    await ws.send(json.dumps({
                        "type": "CHANNEL_REQUEST",
                        "channel": 1,
                        "service": "FEED",
                        "parameters": {"contract": "AUTO"}
                    }))

                    # 4. FEED_SETUP
                    await ws.send(json.dumps({
                        "type": "FEED_SETUP",
                        "channel": 1,
                        "acceptAggregationPeriod": 0.1,
                        "acceptDataFormat": "COMPACT",
                        "acceptEventFields": {
                            "Quote": ["eventSymbol", "bidPrice", "askPrice", "bidSize", "askSize"]
                        }
                    }))

                    # 5. Subscribe
                    sub_msg = {
                        "type": "FEED_SUBSCRIPTION",
                        "channel": 1,
                        "reset": True,
                        "add": [{"type": "Quote", "symbol": s} for s in self.symbols]
                    }
                    await ws.send(json.dumps(sub_msg))
                    print(f"✅ Subscribed to Quotes for {self.symbols}")

                    # 6. Main loop - receive FEED_DATA
                    async for message in ws:
                        try:
                            data = json.loads(message)
                            if data.get("type") == "FEED_DATA":
                                print(f"RAW FEED_DATA: {data}")
                                for client in self.clients[:]:
                                    try:
                                        await client.send_json({
                                            "type": "RawFeed",
                                            "data": data
                                        })
                                    except:
                                        self.clients.remove(client)
                        except Exception as parse_err:
                            print(f"Parse error: {parse_err}")

            except Exception as e:
                print(f"⚠️ DXLink connection error: {type(e).__name__} - {e}")
                await asyncio.sleep(2)

    async def broadcast_to(self, websocket: WebSocket):
        print("🔌 New client connected to market streamer")
        self.clients.append(websocket)
        try:
            while True:
                await asyncio.sleep(30)
        except:
            if websocket in self.clients:
                self.clients.remove(websocket)

market_streamer = MarketStreamer()