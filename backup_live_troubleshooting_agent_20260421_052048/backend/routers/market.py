from __future__ import annotations
import asyncio
from fastapi import APIRouter, Query
from tastytrade import DXLinkStreamer
from tastytrade.dxfeed import Quote, Greeks
from tastytrade.instruments import get_option_chain
from backend.config import session
from backend.services import live_state

router = APIRouter()

@router.get('/symbols')
async def get_symbols():
    return {'symbols': live_state.get_quote_symbols()}

@router.get('/watchlist')
async def get_watchlist(group: str = Query('WEEKLYS')):
    group = group.upper()
    symbols = []
    if group == 'POSITIONS':
        symbols = sorted(live_state.open_position_symbols)
    else:
        symbols = live_state.get_quote_symbols()
    rows = []
    for symbol in symbols:
        q = live_state.quote_cache.get(symbol, {})
        rows.append({'symbol': symbol, 'latest': float(q.get('latest', 0) or 0), 'pctChange': float(q.get('pct_change', 0) or 0)})
    return {'group': group, 'rows': rows}

@router.get('/chain')
async def get_chain(symbol: str, expirations: int = 2, strikes_per_side: int = 8):
    chain = await get_option_chain(session, symbol)
    expiries = sorted(chain.keys())[:max(1, expirations)]
    options = []
    for exp in expiries:
        options.extend(chain[exp])
    strikes = sorted({float(getattr(o, 'strike_price', 0)) for o in options if getattr(o, 'strike_price', None) is not None})
    spot = live_state.quote_cache.get(symbol.upper(), {}).get('latest') or (strikes[len(strikes)//2] if strikes else 0)
    nearby = {s for s in strikes if abs(float(s) - float(spot)) <= max(5, strikes_per_side * 2)}
    selected = [o for o in options if float(getattr(o, 'strike_price', 0)) in nearby]
    streamer_symbols = [getattr(o, 'streamer_symbol', None) for o in selected if getattr(o, 'streamer_symbol', None)]
    quotes, greeks = {}, {}
    if streamer_symbols:
        try:
            async with DXLinkStreamer(session) as streamer:
                await streamer.subscribe(Quote, streamer_symbols)
                await streamer.subscribe(Greeks, streamer_symbols)
                async def collect(event_cls, store):
                    end = asyncio.get_running_loop().time() + 2.0
                    while asyncio.get_running_loop().time() < end and len(store) < len(streamer_symbols):
                        try:
                            event = await asyncio.wait_for(streamer.get_event(event_cls), timeout=0.25)
                            store[getattr(event, 'eventSymbol', getattr(event, 'event_symbol', ''))] = event
                        except Exception:
                            pass
                await asyncio.gather(collect(Quote, quotes), collect(Greeks, greeks))
        except Exception as exc:
            print(f'chain live hydrate failed for {symbol}: {exc}')
    rows = []
    for opt in selected:
        streamer_symbol = getattr(opt, 'streamer_symbol', '')
        q = quotes.get(streamer_symbol)
        g = greeks.get(streamer_symbol)
        bid = float(getattr(q, 'bidPrice', 0) or getattr(q, 'bid_price', 0) or 0)
        ask = float(getattr(q, 'askPrice', 0) or getattr(q, 'ask_price', 0) or 0)
        iv = float(getattr(g, 'volatility', 0) or 0)
        rows.append({
            'symbol': symbol.upper(),
            'expiration': str(getattr(opt, 'expiration_date', getattr(opt, 'expiration', '')))[:10],
            'strike': float(getattr(opt, 'strike_price', 0) or 0),
            'type': 'call' if 'call' in str(getattr(opt, 'option_type', '')).lower() or str(getattr(opt, 'option_type', '')).lower() == 'c' else 'put',
            'bid': bid,
            'ask': ask,
            'mark': round((bid + ask) / 2, 4) if (bid or ask) else 0,
            'iv': iv,
            'delta': float(getattr(g, 'delta', 0) or 0),
            'gamma': float(getattr(g, 'gamma', 0) or 0),
            'theta': float(getattr(g, 'theta', 0) or 0),
            'streamerSymbol': streamer_symbol,
        })
    return {'symbol': symbol.upper(), 'rows': rows}
