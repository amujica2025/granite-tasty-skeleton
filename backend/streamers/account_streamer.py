from __future__ import annotations

import asyncio
import json
import os

import websockets
from fastapi import WebSocket
from tastytrade import Account

from config import session
from services import live_state

STREAMER_HOST_PROD = "wss://streamer.tastyworks.com"
STREAMER_HOST_CERT = "wss://streamer.cert.tastyworks.com"


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def _serialize_position(pos, account_number: str) -> dict:
    qty = _safe_float(getattr(pos, "quantity", 0))
    mark = _safe_float(getattr(pos, "mark", getattr(pos, "mark_price", 0)))
    avg = _safe_float(getattr(pos, "average_open_price", 0))
    underlying = str(getattr(pos, "underlying_symbol", "") or getattr(pos, "symbol", "")).upper()
    exp = str(getattr(pos, "expiration_date", "") or getattr(pos, "expires_at", "") or "")
    strike = _safe_float(getattr(pos, "strike_price", 0))
    opt_type = str(getattr(pos, "option_type", "") or getattr(pos, "call_or_put", "")).lower()

    if opt_type in ("c", "call"):
        opt_type = "call"
    elif opt_type in ("p", "put"):
        opt_type = "put"
    else:
        opt_type = "equity"

    multiplier = 100 if opt_type in ("call", "put") else 1

    return {
        "id": f"{account_number}_{underlying}_{exp}_{strike}_{opt_type}_{qty}",
        "account_number": account_number,
        "symbol": str(getattr(pos, "symbol", underlying)).upper(),
        "underlying_symbol": underlying,
        "quantity": qty,
        "mark": mark,
        "average_open_price": avg,
        "pl_open": round((mark - avg) * qty * multiplier, 2),
        "expiration": exp[:10],
        "strike": strike,
        "type": opt_type,
        "delta": _safe_float(getattr(pos, "delta", 0)),
        "theta": _safe_float(getattr(pos, "theta", 0)),
        "gamma": _safe_float(getattr(pos, "gamma", 0)),
        "bp_effect": _safe_float(getattr(pos, "cost_effect", getattr(pos, "maintenance_requirement", 0))),
        "cost": round(avg * abs(qty) * multiplier, 2),
        "net_liq": round(mark * qty * multiplier, 2),
    }


class AccountStreamer:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self.account_numbers: list[str] = []
        self.host = (
            STREAMER_HOST_CERT
            if os.getenv("TASTY_SANDBOX", "false").lower() == "true"
            else STREAMER_HOST_PROD
        )

    async def seed_once(self, active_session) -> None:
        print("🌱 Seeding balances + positions once before account stream takes over...")

        accounts = await Account.get(active_session)
        self.account_numbers = []

        balances_rows: list[dict] = []
        positions_rows: list[dict] = []

        for acc in accounts:
            account_number = getattr(acc, "account_number", None)
            if not account_number:
                continue

            self.account_numbers.append(account_number)

            try:
                bal = await acc.get_balances(active_session)
                balances_rows.append(
                    {
                        "account_number": account_number,
                        "net_liquidating_value": _safe_float(
                            getattr(bal, "net_liquidating_value", 0)
                        ),
                        "cash": _safe_float(getattr(bal, "cash_balance", 0)),
                        "buying_power": _safe_float(
                            getattr(
                                bal,
                                "equity_buying_power",
                                getattr(bal, "option_buying_power", 0),
                            )
                        ),
                        "option_buying_power": _safe_float(
                            getattr(
                                bal,
                                "option_buying_power",
                                getattr(bal, "equity_buying_power", 0),
                            )
                        ),
                        "currency": getattr(bal, "currency", "USD"),
                    }
                )
            except Exception as exc:
                print(f"⚠️ Balance seed failed for {account_number}: {type(exc).__name__} - {exc}")

            try:
                getter = getattr(acc, "get_positions", None) or getattr(acc, "a_get_positions", None)
                if getter is None:
                    continue

                raw_positions = await getter(active_session, include_marks=True)
                for pos in raw_positions:
                    positions_rows.append(_serialize_position(pos, account_number))
            except Exception as exc:
                print(f"⚠️ Position seed failed for {account_number}: {type(exc).__name__} - {exc}")

        live_state.set_balances(balances_rows)
        live_state.set_positions(positions_rows)
        live_state.mark_account_event()

        print(
            f"✅ Account seed complete | accounts={len(self.account_numbers)} "
            f"balances={len(balances_rows)} positions={len(positions_rows)}"
        )

    async def start(self, active_session=None):
        active_session = active_session or session

        await self.seed_once(active_session)

        while True:
            try:
                if not self.account_numbers:
                    live_state.set_account_connected(False)
                    live_state.set_account_error("No accounts available")
                    await asyncio.sleep(5)
                    continue

                token = f"Bearer {active_session.session_token}"

                async with websockets.connect(
                    self.host,
                    ping_interval=20,
                    ping_timeout=20,
                    close_timeout=10,
                    max_size=None,
                ) as ws:
                    print(f"✅ Account streamer connected to {self.host}")
                    live_state.set_account_connected(True)
                    live_state.set_account_error(None)

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

                            if data.get("status") == "ok":
                                live_state.mark_account_event()
                                continue

                            live_state.mark_account_event()

                            payload = {"type": "account_event", "data": data}
                            await self._broadcast(payload)
                    finally:
                        heartbeat_task.cancel()

            except Exception as exc:
                live_state.set_account_connected(False)
                live_state.set_account_error(f"{type(exc).__name__}: {exc}")
                print(f"⚠️ Account streamer lost connection: {type(exc).__name__} - {exc}")
                await asyncio.sleep(5)

    async def _heartbeat_loop(self, ws, token):
        while True:
            await asyncio.sleep(15)
            await ws.send(
                json.dumps(
                    {
                        "action": "heartbeat",
                        "auth-token": token,
                        "request-id": 99,
                    }
                )
            )

    async def _broadcast(self, payload: dict):
        stale_clients = []

        for client in self.clients[:]:
            try:
                await client.send_json(payload)
            except Exception:
                stale_clients.append(client)

        for client in stale_clients:
            if client in self.clients:
                self.clients.remove(client)

    async def broadcast_to(self, websocket: WebSocket):
        self.clients.append(websocket)
        try:
            await websocket.send_json(
                {
                    "type": "account_snapshot",
                    "balances": live_state.balances_cache,
                    "positions": live_state.positions_cache,
                }
            )

            while True:
                await websocket.receive_text()
        except Exception:
            pass
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)
            print("❌ Account WebSocket disconnected")


account_streamer = AccountStreamer()