from __future__ import annotations
import asyncio
from fastapi import WebSocket
from tastytrade import Account
from backend.config import session
from backend.services import live_state

async def _safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default

class AccountStreamer:
    def __init__(self) -> None:
        self.clients: list[WebSocket] = []

    async def start(self, _session=None) -> None:
        while True:
            try:
                accounts = await Account.get(session)
                balances_rows = []
                positions_rows = []
                for acc in accounts:
                    bal = await acc.get_balances(session)
                    balances_rows.append({
                        'account_number': getattr(acc, 'account_number', ''),
                        'net_liquidating_value': await _safe_float(getattr(bal, 'net_liquidating_value', 0)),
                        'cash': await _safe_float(getattr(bal, 'cash_balance', 0)),
                        'buying_power': await _safe_float(getattr(bal, 'equity_buying_power', getattr(bal, 'option_buying_power', 0))),
                        'option_buying_power': await _safe_float(getattr(bal, 'option_buying_power', getattr(bal, 'equity_buying_power', 0))),
                        'currency': getattr(bal, 'currency', 'USD'),
                    })
                    getter = getattr(acc, 'get_positions', None) or getattr(acc, 'a_get_positions', None)
                    if getter is None:
                        continue
                    raw_positions = await getter(session, include_marks=True)
                    for pos in raw_positions:
                        qty = await _safe_float(getattr(pos, 'quantity', 0))
                        mark = await _safe_float(getattr(pos, 'mark', getattr(pos, 'mark_price', 0)))
                        avg = await _safe_float(getattr(pos, 'average_open_price', 0))
                        underlying = str(getattr(pos, 'underlying_symbol', '') or getattr(pos, 'symbol', '')).upper()
                        exp = str(getattr(pos, 'expiration_date', '') or getattr(pos, 'expires_at', '') or '')
                        strike = await _safe_float(getattr(pos, 'strike_price', 0))
                        opt_type = str(getattr(pos, 'option_type', '') or getattr(pos, 'call_or_put', '')).lower()
                        if opt_type in ('c', 'call'): opt_type = 'call'
                        elif opt_type in ('p', 'put'): opt_type = 'put'
                        else: opt_type = 'equity'
                        positions_rows.append({
                            'id': f"{getattr(acc,'account_number','')}_{underlying}_{exp}_{strike}_{opt_type}_{qty}",
                            'account_number': getattr(acc, 'account_number', ''),
                            'symbol': str(getattr(pos, 'symbol', underlying)).upper(),
                            'underlying_symbol': underlying,
                            'quantity': qty,
                            'mark': mark,
                            'average_open_price': avg,
                            'pl_open': round((mark - avg) * qty * 100, 2) if opt_type in ('call','put') else round((mark - avg) * qty, 2),
                            'expiration': exp[:10],
                            'strike': strike,
                            'type': opt_type,
                            'delta': await _safe_float(getattr(pos, 'delta', 0)),
                            'theta': await _safe_float(getattr(pos, 'theta', 0)),
                            'gamma': await _safe_float(getattr(pos, 'gamma', 0)),
                            'bp_effect': await _safe_float(getattr(pos, 'cost_effect', getattr(pos, 'maintenance_requirement', 0))),
                            'cost': round(avg * abs(qty) * (100 if opt_type in ('call','put') else 1), 2),
                            'net_liq': round(mark * qty * (100 if opt_type in ('call','put') else 1), 2),
                        })
                live_state.set_balances(balances_rows)
                live_state.set_positions(positions_rows)
                snapshot = {'type': 'account_snapshot', 'balances': balances_rows, 'positions': positions_rows}
                for client in self.clients[:]:
                    try: await client.send_json(snapshot)
                    except Exception: self.clients.remove(client)
                await asyncio.sleep(5)
            except Exception as exc:
                print(f'account streamer error: {exc}')
                await asyncio.sleep(5)

    async def broadcast_to(self, websocket: WebSocket) -> None:
        self.clients.append(websocket)
        try:
            await websocket.send_json({'type': 'account_snapshot', 'balances': live_state.balances_cache, 'positions': live_state.positions_cache})
            while True: await asyncio.sleep(30)
        finally:
            if websocket in self.clients: self.clients.remove(websocket)

account_streamer = AccountStreamer()
