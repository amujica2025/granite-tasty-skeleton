import time

quote_cache = {}
market_connected = False
last_quote_ts = None
last_stream_error = None

balances_cache = []
positions_cache = []
account_connected = False
last_account_event_ts = None
last_account_error = None


def _now_ms():
    return int(time.time() * 1000)


def set_quote(symbol: str, payload: dict):
    global last_quote_ts
    quote_cache[symbol] = payload
    last_quote_ts = _now_ms()


def get_all_quotes():
    return list(quote_cache.values())


def set_market_connected(value: bool):
    global market_connected
    market_connected = value


def set_stream_error(message):
    global last_stream_error
    last_stream_error = message


def set_balances(rows: list[dict]):
    global balances_cache
    balances_cache = rows


def set_positions(rows: list[dict]):
    global positions_cache
    positions_cache = rows


def set_account_connected(value: bool):
    global account_connected
    account_connected = value


def set_account_error(message):
    global last_account_error
    last_account_error = message


def mark_account_event():
    global last_account_event_ts
    last_account_event_ts = _now_ms()