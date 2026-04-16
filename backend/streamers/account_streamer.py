import asyncio
import json
import websockets
from fastapi import WebSocket

class AccountStreamer:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self.host = "wss://streamer.tastyworks.com" 

    async def start(self, session):
        print("🚀 Starting Manual Account Streamer (Hardcoded Mode)...")
        acc_numbers = "5WZ28546"
        
        while True:
            try:
                # Using session_token as required by the SDK Session object
                token = f"Bearer {session.session_token}"
                
                async with websockets.connect(self.host) as ws:
                    print(f"✅ WebSocket Connected to {self.host}")

                    # 1. CONNECT / SUBSCRIBE
                    connect_msg = {
                        "action": "connect",
                        "value": acc_numbers,
                        "auth-token": token
                    }
                    await ws.send(json.dumps(connect_msg))

                    # 2. START HEARTBEAT TASK
                    asyncio.create_task(self._heartbeat_loop(ws, token))

                    # 3. LISTEN FOR NOTIFICATIONS
                    async for message in ws:
                        data = json.loads(message)
                        
                        if "status" in data:
                            if data.get("status") == "ok":
                                action = data.get("action")
                                if action == "connect":
                                    print(f"✅ Subscription Active (Session: {data.get('web-socket-session-id')})")
                                elif action == "heartbeat":
                                    print("💓 Heartbeat Acknowledged") # Confirms connection is alive
                                continue
                        
                        msg_type = data.get("type")
                        if msg_type:
                            symbol = data.get("data", {}).get("symbol", "N/A")
                            print(f"🔔 {msg_type.upper()} UPDATE: {symbol}")
                            
                            for client in self.clients[:]:
                                try:
                                    await client.send_json(data)
                                except:
                                    if client in self.clients:
                                        self.clients.remove(client)

            except Exception as e:
                print(f"⚠️ Account streamer connection lost: {type(e).__name__} - {e}")
                await asyncio.sleep(5)

    async def _heartbeat_loop(self, ws, token):
        try:
            while True:
                await asyncio.sleep(30)
                heartbeat = {
                    "action": "heartbeat",
                    "auth-token": token,
                    "request-id": 1
                }
                await ws.send(json.dumps(heartbeat))
        except:
            pass

    async def broadcast_to(self, websocket: WebSocket):
        self.clients.append(websocket)
        try:
            while True:
                await asyncio.sleep(30)
        except:
            if websocket in self.clients:
                self.clients.remove(websocket)

account_streamer = AccountStreamer()