from __future__ import annotations

from db import get_conn, now_ms
from services.symbol_loader import load_weeklys_symbols


def _upsert_symbol(symbol: str, source: str, metadata_json: str = "{}") -> None:
    symbol = (symbol or "").strip().upper()
    if not symbol:
        return

    ts = now_ms()
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO symbol_registry (symbol, source, is_active, metadata_json, created_at_ms, updated_at_ms)
        VALUES (?, ?, 1, ?, ?, ?)
        ON CONFLICT(symbol, source) DO UPDATE SET
            is_active = 1,
            metadata_json = excluded.metadata_json,
            updated_at_ms = excluded.updated_at_ms
        """,
        (symbol, source, metadata_json, ts, ts),
    )
    conn.commit()
    conn.close()


def seed_registry_from_weeklys() -> int:
    symbols = load_weeklys_symbols()
    for symbol in symbols:
        _upsert_symbol(symbol, "WEEKLYS")
    return len(symbols)


def merge_registry_from_positions() -> int:
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT DISTINCT COALESCE(NULLIF(underlying_symbol, ''), NULLIF(symbol, '')) AS symbol
        FROM positions_latest
        WHERE COALESCE(NULLIF(underlying_symbol, ''), NULLIF(symbol, '')) IS NOT NULL
        """
    ).fetchall()
    conn.close()

    count = 0
    for row in rows:
        symbol = row.get("symbol")
        if symbol:
            _upsert_symbol(symbol, "OPEN_POSITIONS")
            count += 1
    return count


def add_user_watchlist_symbol(symbol: str) -> None:
    _upsert_symbol(symbol, "USER_WATCHLIST")


def deactivate_missing_source_symbols(source: str, symbols_to_keep: list[str]) -> None:
    keep = {s.strip().upper() for s in symbols_to_keep if s.strip()}
    conn = get_conn()
    rows = conn.execute(
        "SELECT symbol FROM symbol_registry WHERE source = ?",
        (source,),
    ).fetchall()

    ts = now_ms()
    for row in rows:
        symbol = row["symbol"]
        if symbol not in keep:
            conn.execute(
                """
                UPDATE symbol_registry
                SET is_active = 0, updated_at_ms = ?
                WHERE source = ? AND symbol = ?
                """,
                (ts, source, symbol),
            )
    conn.commit()
    conn.close()


def refresh_registry() -> dict:
    weeklys = load_weeklys_symbols()
    for symbol in weeklys:
        _upsert_symbol(symbol, "WEEKLYS")
    deactivate_missing_source_symbols("WEEKLYS", weeklys)

    positions_count = merge_registry_from_positions()
    active = get_active_symbols()
    return {
        "weeklys_count": len(weeklys),
        "positions_count": positions_count,
        "active_count": len(active),
    }


def get_active_symbols() -> list[str]:
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT DISTINCT symbol
        FROM symbol_registry
        WHERE is_active = 1
        ORDER BY symbol
        """
    ).fetchall()
    conn.close()
    return [row["symbol"] for row in rows]
