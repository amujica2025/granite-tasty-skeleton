from fastapi import APIRouter
from db import get_conn

router = APIRouter()

@router.get("/store/health")
async def store_health():
    conn = get_conn()
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
    counts = {
        "balances_latest": conn.execute("SELECT COUNT(*) AS c FROM balances_latest").fetchone()["c"],
        "positions_latest": conn.execute("SELECT COUNT(*) AS c FROM positions_latest").fetchone()["c"],
        "watchlist_quotes_latest": conn.execute("SELECT COUNT(*) AS c FROM watchlist_quotes_latest").fetchone()["c"],
        "account_events": conn.execute("SELECT COUNT(*) AS c FROM account_events").fetchone()["c"],
        "market_events": conn.execute("SELECT COUNT(*) AS c FROM market_events").fetchone()["c"],
    }
    conn.close()
    return {"ok": True, "tables": [t["name"] for t in tables], "counts": counts}
