import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "granite.db"


def get_conn():
    return sqlite3.connect(DB_PATH)


def now():
    return int(time.time() * 1000)


def init_db():
    conn = get_conn()

    conn.execute("""
    CREATE TABLE IF NOT EXISTS watchlist_quotes_latest (
        symbol TEXT PRIMARY KEY,
        bid REAL,
        ask REAL,
        mid REAL,
        updated_at_ms INTEGER
    )
    """)

    conn.commit()
    conn.close()


def upsert_quote(symbol: str, bid: float, ask: float):
    conn = get_conn()

    mid = (bid + ask) / 2 if (bid or ask) else None

    conn.execute("""
    INSERT INTO watchlist_quotes_latest
    (symbol, bid, ask, mid, updated_at_ms)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(symbol) DO UPDATE SET
        bid=excluded.bid,
        ask=excluded.ask,
        mid=excluded.mid,
        updated_at_ms=excluded.updated_at_ms
    """, (symbol, bid, ask, mid, now()))

    conn.commit()
    conn.close()


def db_health():
    conn = get_conn()
    try:
        conn.execute("SELECT 1")
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        conn.close()