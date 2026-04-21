from __future__ import annotations
import asyncio, time
import httpx
from plyer import notification
from backend.config import PUSHOVER_APP_TOKEN, PUSHOVER_USER_KEY
from backend.services import live_state


def _value_for(rule, quote):
    return float(quote.get('latest', 0)) if rule.get('field') == 'price' else float(quote.get('pct_change', 0))


def _should_trigger(rule, prev, cur):
    op = rule.get('operator')
    target = float(rule.get('value', 0))
    if op == '>': return cur > target
    if op == '<': return cur < target
    if op == '>=': return cur >= target
    if op == '<=': return cur <= target
    if op == 'crosses_above': return prev is not None and prev <= target and cur > target
    if op == 'crosses_below': return prev is not None and prev >= target and cur < target
    return False

async def _send_pushover(message: str):
    if not (PUSHOVER_USER_KEY and PUSHOVER_APP_TOKEN): return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post('https://api.pushover.net/1/messages.json', data={'token':PUSHOVER_APP_TOKEN,'user':PUSHOVER_USER_KEY,'message':message,'title':'Granite Alert'})
    except Exception as exc:
        print(f'pushover send failed: {exc}')

async def _backend_toast(message: str):
    try:
        notification.notify(title='Granite Alert', message=message, timeout=10, app_name='Granite Tasty Skeleton')
    except Exception as exc:
        print(f'desktop notify failed: {exc}')

class AlertEngine:
    async def start(self):
        while True:
            rules = live_state.load_rules()
            for rule in rules:
                if not rule.get('enabled', True):
                    continue
                quote = live_state.quote_cache.get(str(rule.get('symbol','')).upper())
                if not quote: continue
                key = str(rule.get('id'))
                cur = _value_for(rule, quote)
                prev = live_state.last_alert_values.get(key)
                live_state.last_alert_values[key] = cur
                cooldown_ms = int(rule.get('cooldownMs', 0) or 0)
                if not _should_trigger(rule, prev, cur):
                    continue
                last_ts = live_state.last_trigger_times.get(key, 0)
                if cooldown_ms and ((time.time()*1000)-last_ts) < cooldown_ms:
                    continue
                live_state.last_trigger_times[key] = time.time()*1000
                message = f"{rule.get('symbol')} {rule.get('field')} {rule.get('operator')} {rule.get('value')} | current={cur:.2f}"
                event = {'id': f"evt_{int(time.time()*1000)}", 'timestamp': int(time.time()*1000), 'symbol': rule.get('symbol'), 'message': message}
                live_state.append_alert_event(event)
                if rule.get('desktop'): await _backend_toast(message)
                if rule.get('pushover'): await _send_pushover(message)
                for client in live_state.alert_clients[:]:
                    try: await client.send_json({'type': 'alert_triggered', 'event': event})
                    except Exception: live_state.alert_clients.remove(client)
            await asyncio.sleep(1)

alert_engine = AlertEngine()
