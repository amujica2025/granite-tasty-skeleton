from fastapi import APIRouter
from backend.services import live_state

router = APIRouter()

@router.get('/balances')
async def get_balances():
    return {'balances': live_state.balances_cache}

@router.get('/positions')
async def get_positions():
    return {'positions': live_state.positions_cache}
