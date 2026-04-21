from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "granite_streaming.db"


def _dict_factory(cursor: sqlite3.Cursor, row: tuple[Any, ...]) -> dict[str, Any]:
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = _dict_factory
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def now_ms() -> int:
    return int(time.time() * 1000)


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS account_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            account_number TEXT,
            event_ts_ms INTEGER NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS market_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            symbol TEXT,
            event_ts_ms INTEGER NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS balances_latest (
            account_number TEXT PRIMARY KEY,
            net_liq REAL,
            cash REAL,
            buying_power REAL,
            currency TEXT,
            source TEXT NOT NULL,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS positions_latest (
            account_number TEXT NOT NULL,
            symbol TEXT NOT NULL,
            quantity REAL,
            instrument_type TEXT,
            underlying_symbol TEXT,
            average_open_price REAL,
            mark REAL,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL,
            PRIMARY KEY (account_number, symbol)
        );

        CREATE TABLE IF NOT EXISTS orders_latest (
            order_id TEXT PRIMARY KEY,
            account_number TEXT,
            underlying_symbol TEXT,
            status TEXT,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS fills_latest (
            fill_id TEXT PRIMARY KEY,
            order_id TEXT,
            account_number TEXT,
            symbol TEXT,
            quantity REAL,
            fill_price REAL,
            filled_at TEXT,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS watchlist_quotes_latest (
            symbol TEXT PRIMARY KEY,
            bid REAL,
            ask REAL,
            bid_size REAL,
            ask_size REAL,
            mid REAL,
            raw_json TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS watchlist_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            snapshot_ts_ms INTEGER NOT NULL,
            row_count INTEGER NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS market_context_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            snapshot_ts_ms INTEGER NOT NULL,
            context_name TEXT NOT NULL,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS symbol_registry (
            symbol TEXT NOT NULL,
            source TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            metadata_json TEXT,
            created_at_ms INTEGER NOT NULL,
            updated_at_ms INTEGER NOT NULL,
            PRIMARY KEY (symbol, source)
        );

        CREATE INDEX IF NOT EXISTS idx_account_events_type_ts
            ON account_events(event_type, event_ts_ms DESC);

        CREATE INDEX IF NOT EXISTS idx_market_events_symbol_ts
            ON market_events(symbol, event_ts_ms DESC);

        CREATE INDEX IF NOT EXISTS idx_quotes_updated
            ON watchlist_quotes_latest(updated_at_ms DESC);

        CREATE INDEX IF NOT EXISTS idx_symbol_registry_active
            ON symbol_registry(is_active, symbol);
        """
    )

    conn.execute(
        """
        INSERT OR IGNORE INTO migrations (name, applied_at_ms)
        VALUES (?, ?)
        """,
        ("streaming_db_phase1", now_ms()),
    )

    conn.execute(
        """
        INSERT OR IGNORE INTO migrations (name, applied_at_ms)
        VALUES (?, ?)
        """,
        ("streaming_db_phase1b_symbol_registry", now_ms()),
    )

    conn.commit()
    conn.close()


def upsert_balance(row: dict[str, Any], source: str = "seed") -> None:
    ts = now_ms()
    account_number = str(row.get("account_number") or row.get("account-number") or "UNKNOWN")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO balances_latest (
            account_number, net_liq, cash, buying_power, currency, source, raw_json, updated_at_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_number) DO UPDATE SET
            net_liq = excluded.net_liq,
            cash = excluded.cash,
            buying_power = excluded.buying_power,
            currency = excluded.currency,
            source = excluded.source,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (
            account_number,
            row.get("net_liquidating_value") or row.get("net_liq"),
            row.get("cash"),
            row.get("buying_power"),
            row.get("currency"),
            source,
            json.dumps(row),
            ts,
        ),
    )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Balance", account_number, ts, json.dumps(row)),
    )
    conn.commit()
    conn.close()


def replace_positions_snapshot(account_number: str, positions: list[dict[str, Any]], source: str = "seed") -> None:
    ts = now_ms()
    conn = get_conn()
    conn.execute("DELETE FROM positions_latest WHERE account_number = ?", (account_number,))
    for pos in positions:
        conn.execute(
            """
            INSERT INTO positions_latest (
                account_number, symbol, quantity, instrument_type, underlying_symbol,
                average_open_price, mark, raw_json, updated_at_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                account_number,
                str(pos.get("symbol") or ""),
                pos.get("quantity"),
                pos.get("instrument-type") or pos.get("instrument_type"),
                pos.get("underlying-symbol") or pos.get("underlying_symbol"),
                pos.get("average-open-price") or pos.get("average_open_price"),
                pos.get("mark"),
                json.dumps(pos),
                ts,
            ),
        )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("PositionsSnapshot", account_number, ts, json.dumps({"source": source, "positions": positions})),
    )
    conn.commit()
    conn.close()


def upsert_position_from_stream(payload: dict[str, Any]) -> None:
    ts = now_ms()
    account_number = str(payload.get("account-number") or payload.get("account_number") or "UNKNOWN")
    symbol = str(payload.get("symbol") or "")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO positions_latest (
            account_number, symbol, quantity, instrument_type, underlying_symbol,
            average_open_price, mark, raw_json, updated_at_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_number, symbol) DO UPDATE SET
            quantity = excluded.quantity,
            instrument_type = excluded.instrument_type,
            underlying_symbol = excluded.underlying_symbol,
            average_open_price = excluded.average_open_price,
            mark = excluded.mark,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (
            account_number,
            symbol,
            payload.get("quantity"),
            payload.get("instrument-type") or payload.get("instrument_type"),
            payload.get("underlying-symbol") or payload.get("underlying_symbol"),
            payload.get("average-open-price") or payload.get("average_open_price"),
            payload.get("mark"),
            json.dumps(payload),
            ts,
        ),
    )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Position", account_number, ts, json.dumps(payload)),
    )
    conn.commit()
    conn.close()


def upsert_order(order: dict[str, Any]) -> None:
    ts = now_ms()
    order_id = str(order.get("id"))
    account_number = order.get("account-number") or order.get("account_number")
    underlying_symbol = order.get("underlying-symbol") or order.get("underlying_symbol")
    status = order.get("status")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO orders_latest (order_id, account_number, underlying_symbol, status, raw_json, updated_at_ms)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(order_id) DO UPDATE SET
            account_number = excluded.account_number,
            underlying_symbol = excluded.underlying_symbol,
            status = excluded.status,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (order_id, account_number, underlying_symbol, status, json.dumps(order), ts),
    )
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Order", account_number, ts, json.dumps(order)),
    )

    for leg in order.get("legs") or []:
        for fill in leg.get("fills") or []:
            fill_id = str(fill.get("fill-id") or fill.get("fill_id") or fill.get("ext-exec-id") or f"{order_id}_{ts}")
            conn.execute(
                """
                INSERT INTO fills_latest (
                    fill_id, order_id, account_number, symbol, quantity, fill_price,
                    filled_at, raw_json, updated_at_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(fill_id) DO UPDATE SET
                    order_id = excluded.order_id,
                    account_number = excluded.account_number,
                    symbol = excluded.symbol,
                    quantity = excluded.quantity,
                    fill_price = excluded.fill_price,
                    filled_at = excluded.filled_at,
                    raw_json = excluded.raw_json,
                    updated_at_ms = excluded.updated_at_ms
                """,
                (
                    fill_id,
                    order_id,
                    account_number,
                    leg.get("symbol"),
                    fill.get("quantity"),
                    fill.get("fill-price") or fill.get("fill_price"),
                    fill.get("filled-at") or fill.get("filled_at"),
                    json.dumps(fill),
                    ts,
                ),
            )
    conn.commit()
    conn.close()


def record_account_message(msg_type: str, payload: dict[str, Any]) -> None:
    msg_key = (msg_type or "").lower()

    if "order" in msg_key:
        upsert_order(payload)
        return

    if "position" in msg_key:
        upsert_position_from_stream(payload)
        return

    if "balance" in msg_key:
        upsert_balance(payload, source="stream")
        return

    account_number = payload.get("account-number") or payload.get("account_number")
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO account_events (event_type, account_number, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        (msg_type, account_number, now_ms(), json.dumps(payload)),
    )
    conn.commit()
    conn.close()


def upsert_quote(symbol: str, bid: float | None, ask: float | None, bid_size: float | None, ask_size: float | None, raw: dict[str, Any]) -> None:
    ts = now_ms()
    mid = None
    if bid is not None and ask is not None:
        mid = round((bid + ask) / 2, 6)
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO watchlist_quotes_latest (symbol, bid, ask, bid_size, ask_size, mid, raw_json, updated_at_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
            bid = excluded.bid,
            ask = excluded.ask,
            bid_size = excluded.bid_size,
            ask_size = excluded.ask_size,
            mid = excluded.mid,
            raw_json = excluded.raw_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (symbol.upper(), bid, ask, bid_size, ask_size, mid, json.dumps(raw), ts),
    )
    conn.execute(
        """
        INSERT INTO market_events (event_type, symbol, event_ts_ms, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        ("Quote", symbol.upper(), ts, json.dumps(raw)),
    )
    conn.commit()
    conn.close()


def snapshot_watchlist(name: str = "WEEKLYS") -> None:
    ts = now_ms()
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT symbol, bid, ask, bid_size, ask_size, mid, updated_at_ms
        FROM watchlist_quotes_latest
        ORDER BY symbol
        """
    ).fetchall()
    payload = {"name": name, "rows": rows}
    snapshot_id = f"{name}_{ts}"
    conn.execute(
        """
        INSERT INTO watchlist_snapshots (snapshot_id, snapshot_ts_ms, row_count, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        (snapshot_id, ts, len(rows), json.dumps(payload)),
    )
    conn.execute(
        """
        INSERT INTO market_context_snapshots (snapshot_id, snapshot_ts_ms, context_name, payload_json)
        VALUES (?, ?, ?, ?)
        """,
        (
            f"market_context_{ts}",
            ts,
            "watchlist_quote_snapshot",
            json.dumps(
                {
                    "symbol_count": len(rows),
                    "rows_with_mid": sum(1 for r in rows if r.get("mid") is not None),
                    "symbols": [r["symbol"] for r in rows],
                }
            ),
        ),
    )
    conn.commit()
    conn.close()
