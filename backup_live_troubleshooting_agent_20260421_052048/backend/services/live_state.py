from __future__ import annotations
import json, os, threading
from pathlib import Path
from typing import Any
from backend.data.weeklys_symbols import WEEKLYS_SYMBOLS

ROOT = Path(__file__).resolve().parents[1]
RULES_FILE = ROOT / 'data' / 'alert_rules.json'

_lock = threading.Lock()
quote_cache: dict[str, dict[str, Any]] = {}
positions_cache: list[dict[str, Any]] = []
balances_cache: list[dict[str, Any]] = []
alert_history: list[dict[str, Any]] = []
open_position_symbols: set[str] = set()
quote_subscribers: set[str] = set(WEEKLYS_SYMBOLS)
last_alert_values: dict[str, float] = {}
last_trigger_times: dict[str, float] = {}
alert_clients: list[Any] = []
account_clients: list[Any] = []
market_clients: list[Any] = []


def _ensure_rules_file() -> None:
    RULES_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not RULES_FILE.exists():
        RULES_FILE.write_text('[]', encoding='utf-8')


def load_rules() -> list[dict[str, Any]]:
    _ensure_rules_file()
    try:
        return json.loads(RULES_FILE.read_text(encoding='utf-8'))
    except Exception:
        return []


def save_rules(rules: list[dict[str, Any]]) -> None:
    _ensure_rules_file()
    RULES_FILE.write_text(json.dumps(rules, indent=2), encoding='utf-8')


def get_quote_symbols() -> list[str]:
    with _lock:
        return sorted(set(quote_subscribers) | set(open_position_symbols))


def set_quote(symbol: str, payload: dict[str, Any]) -> None:
    with _lock:
        quote_cache[symbol.upper()] = payload


def set_positions(rows: list[dict[str, Any]]) -> None:
    with _lock:
        global positions_cache, open_position_symbols
        positions_cache = rows
        open_position_symbols = {str(r.get('underlying_symbol') or r.get('symbol') or '').upper() for r in rows if str(r.get('underlying_symbol') or r.get('symbol') or '').strip()}


def set_balances(rows: list[dict[str, Any]]) -> None:
    with _lock:
        global balances_cache
        balances_cache = rows


def append_alert_event(event: dict[str, Any]) -> None:
    with _lock:
        alert_history.insert(0, event)
        del alert_history[200:]
