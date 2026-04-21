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
        print("ðŸŒ± Seeding balances + positions once via REST before account stream takes over...")
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
                print(f"âš ï¸ Balance seed failed for {account_number}: {type(e).__name__} - {e}")

            try:
                positions = await acc.get_positions(session)
                replace_positions_snapshot(
                    account_number=account_number,
                    positions=[p.__dict__ if hasattr(p, "__dict__") else dict(p) for p in positions],
                    source="seed",
                )
            except Exception as e:
                print(f"âš ï¸ Position seed failed for {account_number}: {type(e).__name__} - {e}")

        print(f"âœ… Account seed complete | accounts={self.account_numbers}")

    async def start(self, session):
        await self.seed_once(session)

        while True:
            try:
                token = f"Bearer {session.session_token}"
                async with websockets.connect(self.host, ping_interval=20, ping_timeout=20) as ws:
                    print(f"âœ… Account streamer websocket connected to {self.host}")

                    connect_msg = {
                        "action": "connect",
                        "value": self.account_numbers,
                        "auth-token": token,
                        "request-id": 1,
                    }
                    await ws.send(json.dumps(connect_msg))
                    print(f"ðŸ“¡ Account streamer connect sent for accounts={self.account_numbers}")

                    heartbeat_task = asyncio.create_task(self._heartbeat_loop(ws, token))

                    try:
                        async for message in ws:
                            data = json.loads(message)

                            if "status" in data:
                                if data.get("status") == "ok" and data.get("action") == "connect":
                                    print(f"âœ… Account streamer subscribed | session={data.get('web-socket-session-id')}")
                                elif data.get("status") == "ok" and data.get("action") == "heartbeat":
                                    print("ðŸ’“ Account streamer heartbeat ack")
                                continue

                            msg_type = data.get("type")
                            payload = data.get("data", {}) or {}

                            if msg_type:
                                record_account_message(msg_type, payload)
                                print(f"ðŸ”” ACCOUNT {msg_type}")
                                await self._broadcast(data)
                    finally:
                        heartbeat_task.cancel()
            except Exception as e:
                print(f"âš ï¸ Account streamer lost connection: {type(e).__name__} - {e}")
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
