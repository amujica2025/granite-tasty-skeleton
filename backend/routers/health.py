from fastapi import APIRouter

from services import live_state
from services.db import db_health
from services.symbol_registry import get_registry_stats

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "market_connected": live_state.market_connected,
        "last_quote_ts": live_state.last_quote_ts,
        "last_stream_error": live_state.last_stream_error,
        "quote_cache_count": len(live_state.quote_cache),
        "account_connected": live_state.account_connected,
        "last_account_event_ts": live_state.last_account_event_ts,
        "last_account_error": live_state.last_account_error,
        "balances_count": len(live_state.balances_cache),
        "positions_count": len(live_state.positions_cache),
        "registry": get_registry_stats(),
        "db": db_health(),
    }