# granite_tasty_50_20_positions_layout.ps1
$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$appFile = Join-Path $projectRoot "frontend\src\App.tsx"

if (-not (Test-Path $projectRoot)) {
    throw "Project root not found: $projectRoot"
}

if (Test-Path $appFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item $appFile "$appFile.bak_$timestamp" -Force
}

$appContent = @'
import { useEffect, useMemo, useState } from 'react';
import PositionsPanel from './components/PositionsPanel';

type WatchlistRow = {
  symbol: string;
  latest: number;
  pctChange: number;
  relStr14d: number;
  ivPctl: number;
  ivHv: number;
  impVol: number;
  iv5d: number;
  iv1m: number;
  iv3m: number;
  iv6m: number;
  bbPct: number;
  bbRank: number;
  ttmSqueeze: string;
  adr14d: number;
  optionsVol: number;
  totalVol1m: number;
  callVol: number;
  putVol: number;
};

type TickerCard = {
  symbol: string;
  last: number;
  chgPct: number;
};

const watchlistSeed: WatchlistRow[] = [
  { symbol: 'SPY', latest: 513.24, pctChange: 0.42, relStr14d: 57.1, ivPctl: 31.0, ivHv: 1.08, impVol: 15.4, iv5d: 14.6, iv1m: 15.2, iv3m: 16.4, iv6m: 17.1, bbPct: 62.0, bbRank: 58.0, ttmSqueeze: 'Off', adr14d: 7.2, optionsVol: 2450000, totalVol1m: 19400000, callVol: 1290000, putVol: 1160000 },
  { symbol: 'QQQ', latest: 441.82, pctChange: -0.21, relStr14d: 49.2, ivPctl: 34.0, ivHv: 1.11, impVol: 18.2, iv5d: 17.9, iv1m: 18.0, iv3m: 19.5, iv6m: 20.3, bbPct: 48.0, bbRank: 44.0, ttmSqueeze: 'On', adr14d: 8.8, optionsVol: 1840000, totalVol1m: 13800000, callVol: 910000, putVol: 930000 },
  { symbol: 'IWM', latest: 201.64, pctChange: 0.66, relStr14d: 61.2, ivPctl: 43.0, ivHv: 1.22, impVol: 22.4, iv5d: 21.8, iv1m: 22.2, iv3m: 24.0, iv6m: 25.6, bbPct: 68.0, bbRank: 65.0, ttmSqueeze: 'Off', adr14d: 4.9, optionsVol: 621000, totalVol1m: 4550000, callVol: 308000, putVol: 313000 },
  { symbol: 'TSLA', latest: 172.31, pctChange: 1.81, relStr14d: 72.4, ivPctl: 68.0, ivHv: 1.36, impVol: 48.5, iv5d: 45.0, iv1m: 46.8, iv3m: 50.9, iv6m: 55.1, bbPct: 77.0, bbRank: 74.0, ttmSqueeze: 'Off', adr14d: 9.1, optionsVol: 1310000, totalVol1m: 11300000, callVol: 690000, putVol: 620000 },
  { symbol: 'NVDA', latest: 880.44, pctChange: 2.26, relStr14d: 78.5, ivPctl: 64.0, ivHv: 1.19, impVol: 41.7, iv5d: 40.2, iv1m: 41.1, iv3m: 43.9, iv6m: 46.2, bbPct: 82.0, bbRank: 79.0, ttmSqueeze: 'Off', adr14d: 28.2, optionsVol: 2100000, totalVol1m: 16200000, callVol: 1180000, putVol: 920000 },
  { symbol: 'SPX', latest: 5208.43, pctChange: 0.17, relStr14d: 54.8, ivPctl: 27.0, ivHv: 1.02, impVol: 14.7, iv5d: 13.9, iv1m: 14.4, iv3m: 15.8, iv6m: 16.9, bbPct: 51.0, bbRank: 49.0, ttmSqueeze: 'On', adr14d: 61.0, optionsVol: 0, totalVol1m: 0, callVol: 0, putVol: 0 },
];

const tickerSeed: TickerCard[] = [
  { symbol: 'SPY', last: 513.24, chgPct: 0.42 },
  { symbol: 'AAPL', last: 189.81, chgPct: 0.71 },
  { symbol: 'QQQ', last: 441.82, chgPct: -0.21 },
  { symbol: 'TSLA', last: 172.31, chgPct: 1.81 },
  { symbol: 'NVDA', last: 880.44, chgPct: 2.26 },
  { symbol: 'SPX', last: 5208.43, chgPct: 0.17 },
  { symbol: 'VIX', last: 15.83, chgPct: -2.05 },
];

const formatCompact = (value: number) =>
  Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const heatColor = (value: number, min: number, max: number) => {
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));
  const alpha = 0.10 + ratio * 0.38;
  return `rgba(245, 158, 11, ${alpha.toFixed(3)})`;
};

export default function App() {
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [positionsExpanded, setPositionsExpanded] = useState(false);
  const [netLiq, setNetLiq] = useState<number | null>(null);
  const [bp, setBp] = useState<number | null>(null);
  const [watchlistRows, setWatchlistRows] = useState<WatchlistRow[]>(watchlistSeed);
  const [tickers, setTickers] = useState<TickerCard[]>(tickerSeed);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/balances');
        const data = await res.json();

        if (data.balances && data.balances.length > 0) {
          const row = data.balances[0];
          setNetLiq(row.net_liquidating_value ?? null);
          setBp(
            row.option_buying_power ??
              row.derivatives_buying_power ??
              row.buying_power ??
              row.cash_available_to_trade ??
              null
          );
        }
      } catch (e) {
        console.error('Failed to fetch balances:', e);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/market');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'RawFeed' && msg.data && msg.data.type === 'FEED_DATA') {
          const feed = msg.data.data;
          if (feed[0] === 'Quote') {
            const values = feed[1];
            const map: Record<string, { bid?: number; ask?: number }> = {};

            for (let i = 0; i < values.length; i += 5) {
              map[values[i]] = { bid: values[i + 1], ask: values[i + 2] };
            }

            const nextMid = (symbol: string, fallback: number) => {
              const q = map[symbol];
              if (!q || typeof q.bid !== 'number' || typeof q.ask !== 'number') return fallback;
              const mid = (q.bid + q.ask) / 2;
              return Number.isFinite(mid) ? Number(mid.toFixed(2)) : fallback;
            };

            setWatchlistRows((prev) =>
              prev.map((row) => ({ ...row, latest: nextMid(row.symbol, row.latest) }))
            );

            setTickers((prev) =>
              prev.map((row) => ({ ...row, last: nextMid(row.symbol, row.last) }))
            );
          }
        }
      } catch (e) {
        console.log('Quote parse error');
      }
    };

    return () => ws.close();
  }, []);

  const longs = 1155;
  const shorts = 7955;

  const kpiCards = useMemo(
    () => [
      { label: 'Net Liq', value: netLiq !== null ? `$${netLiq.toLocaleString()}` : '—', tone: '#22c55e' },
      { label: 'BP', value: bp !== null ? `$${bp.toLocaleString()}` : '—', tone: '#60a5fa' },
      {
        label: '25x',
        value:
          netLiq !== null
            ? `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : '—',
        tone: '#f59e0b',
      },
      { label: 'Longs', value: `$${longs.toLocaleString()}`, tone: '#d4d4d4' },
      { label: 'Shorts', value: `$${shorts.toLocaleString()}`, tone: '#d4d4d4' },
    ],
    [bp, netLiq]
  );

  const panel1Width = watchlistOpen ? 620 : 300;

  return (
    <div
      style={{
        background: '#050505',
        color: '#ffffff',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* PANEL 1 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: panel1Width,
          background: '#111111',
          borderRight: '1px solid #242424',
          zIndex: 1500,
          overflow: 'hidden',
          transition: 'width 180ms ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 46,
            borderBottom: '1px solid #242424',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 10px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setWatchlistOpen((prev) => !prev)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid #333',
              background: '#0b0b0b',
              color: '#ddd',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={watchlistOpen ? 'Collapse watchlist' : 'Expand watchlist'}
          >
            {watchlistOpen ? '«' : '»'}
          </button>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e5e5' }}>weeklys</div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {watchlistOpen ? (
            <div style={{ minWidth: 1120 }}>
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 5,
                  background: '#111111',
                  borderBottom: '1px solid #333',
                  display: 'grid',
                  gridTemplateColumns:
                    '88px 84px 84px 88px 76px 72px 78px 72px 72px 72px 72px 64px 76px 98px 84px 96px 108px 96px 96px',
                  fontSize: '10px',
                  color: '#9a9a9a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {[
                  'Symbol',
                  'Latest',
                  '%Change',
                  '14D Rel Str',
                  'IV Pctl',
                  'IV/HV',
                  'Imp Vol',
                  '5D IV',
                  '1M IV',
                  '3M IV',
                  '6M IV',
                  'BB%',
                  'BB Rank',
                  'TTM Squeeze',
                  '14D ADR',
                  'Options Vol',
                  '1M Total Vol',
                  'Call Vol',
                  'Put Vol',
                ].map((col) => (
                  <div key={col} style={{ padding: '8px 6px', borderRight: '1px solid #1d1d1d' }}>
                    {col}
                  </div>
                ))}
              </div>

              {watchlistRows.map((row) => {
                const termMin = Math.min(row.impVol, row.iv5d, row.iv1m, row.iv3m, row.iv6m);
                const termMax = Math.max(row.impVol, row.iv5d, row.iv1m, row.iv3m, row.iv6m);

                return (
                  <div
                    key={row.symbol}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '88px 84px 84px 88px 76px 72px 78px 72px 72px 72px 72px 64px 76px 98px 84px 96px 108px 96px 96px',
                      borderBottom: '1px solid #1f1f1f',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ padding: '8px 6px', fontWeight: 700 }}>{row.symbol}</div>
                    <div style={{ padding: '8px 6px' }}>{row.latest.toFixed(2)}</div>
                    <div
                      style={{
                        padding: '8px 6px',
                        color: row.pctChange >= 0 ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {row.pctChange >= 0 ? '+' : ''}
                      {row.pctChange.toFixed(2)}%
                    </div>
                    <div style={{ padding: '8px 6px' }}>{row.relStr14d.toFixed(1)}</div>
                    <div style={{ padding: '8px 6px', color: '#f59e0b' }}>{row.ivPctl.toFixed(0)}</div>
                    <div style={{ padding: '8px 6px' }}>{row.ivHv.toFixed(2)}</div>
                    <div style={{ padding: '8px 6px', background: heatColor(row.impVol, termMin, termMax) }}>{row.impVol.toFixed(1)}</div>
                    <div style={{ padding: '8px 6px', background: heatColor(row.iv5d, termMin, termMax) }}>{row.iv5d.toFixed(1)}</div>
                    <div style={{ padding: '8px 6px', background: heatColor(row.iv1m, termMin, termMax) }}>{row.iv1m.toFixed(1)}</div>
                    <div style={{ padding: '8px 6px', background: heatColor(row.iv3m, termMin, termMax) }}>{row.iv3m.toFixed(1)}</div>
                    <div style={{ padding: '8px 6px', background: heatColor(row.iv6m, termMin, termMax) }}>{row.iv6m.toFixed(1)}</div>
                    <div style={{ padding: '8px 6px' }}>{row.bbPct.toFixed(0)}</div>
                    <div style={{ padding: '8px 6px' }}>{row.bbRank.toFixed(0)}</div>
                    <div style={{ padding: '8px 6px' }}>{row.ttmSqueeze}</div>
                    <div style={{ padding: '8px 6px' }}>{row.adr14d.toFixed(1)}</div>
                    <div style={{ padding: '8px 6px' }}>{formatCompact(row.optionsVol)}</div>
                    <div style={{ padding: '8px 6px' }}>{formatCompact(row.totalVol1m)}</div>
                    <div style={{ padding: '8px 6px' }}>{formatCompact(row.callVol)}</div>
                    <div style={{ padding: '8px 6px' }}>{formatCompact(row.putVol)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {['Symbol', 'Last', '%Chg', 'IV Pctl'].map((label) => (
                <div
                  key={label}
                  style={{
                    padding: '8px 6px',
                    fontSize: '10px',
                    color: '#9a9a9a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #1f1f1f',
                    borderRight: '1px solid #1d1d1d',
                  }}
                >
                  {label}
                </div>
              ))}

              {watchlistRows.flatMap((row) => [
                <div key={`${row.symbol}-s`} style={{ padding: '8px 6px', fontSize: '11px', fontWeight: 700, borderBottom: '1px solid #1f1f1f' }}>{row.symbol}</div>,
                <div key={`${row.symbol}-l`} style={{ padding: '8px 6px', fontSize: '11px', borderBottom: '1px solid #1f1f1f' }}>{row.latest.toFixed(2)}</div>,
                <div key={`${row.symbol}-p`} style={{ padding: '8px 6px', fontSize: '11px', color: row.pctChange >= 0 ? '#22c55e' : '#ef4444', borderBottom: '1px solid #1f1f1f' }}>
                  {row.pctChange >= 0 ? '+' : ''}
                  {row.pctChange.toFixed(2)}%
                </div>,
                <div key={`${row.symbol}-i`} style={{ padding: '8px 6px', fontSize: '11px', color: '#f59e0b', borderBottom: '1px solid #1f1f1f' }}>{row.ivPctl.toFixed(0)}</div>,
              ])}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 8,
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 8,
          boxSizing: 'border-box',
          zIndex: 1,
        }}
      >
        {/* PANEL 2 */}
        <div
          style={{
            position: 'relative',
            minWidth: 0,
            minHeight: 0,
            background: '#090909',
            border: '1px solid #202020',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {/* INFO HUB TOP 50% */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: '#111111',
              borderBottom: '1px solid #242424',
              zIndex: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 10px',
                fontSize: '11px',
                color: '#8f8f8f',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Info Hub
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                whiteSpace: 'nowrap',
                padding: '0 10px 10px',
                width: 'max-content',
                animation: 'scrollCards 30s linear infinite',
              }}
            >
              {kpiCards.concat(kpiCards).map((card, i) => (
                <div
                  key={`${card.label}-${i}`}
                  style={{
                    width: 170,
                    height: 74,
                    background: '#0b0b0b',
                    border: '1px solid #262626',
                    borderRadius: 8,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#8f8f8f', textTransform: 'uppercase' }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: card.tone }}>{card.value}</div>
                  <div style={{ height: 18, border: '1px solid #1e1e1e', borderRadius: 4, background: '#080808' }} />
                </div>
              ))}

              {tickers.concat(tickers).map((card, i) => (
                <div
                  key={`${card.symbol}-${i}`}
                  style={{
                    width: 170,
                    height: 74,
                    background: '#0b0b0b',
                    border: '1px solid #262626',
                    borderRadius: 8,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ fontWeight: 700 }}>{card.symbol}</span>
                    <span style={{ color: card.chgPct >= 0 ? '#22c55e' : '#ef4444' }}>
                      {card.chgPct >= 0 ? '+' : ''}
                      {card.chgPct.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{card.last.toFixed(2)}</div>
                  <div
                    style={{
                      height: 18,
                      border: '1px solid #1e1e1e',
                      borderRadius: 4,
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#080808',
                    }}
                  >
                    <svg viewBox="0 0 120 18" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                      <polyline
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        points="0,13 10,11 20,12 30,9 40,10 50,8 60,7 70,8 80,5 90,6 100,4 110,5 120,3"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POSITIONS OVERLAY */}
          <div
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              bottom: 8,
              top: positionsExpanded ? '20%' : '50%',
              transition: 'top 180ms ease',
              zIndex: 5,
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#111111',
                border: '1px solid #242424',
                borderRadius: 10,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
              }}
            >
              <button
                onClick={() => setPositionsExpanded((prev) => !prev)}
                style={{
                  height: 28,
                  border: 0,
                  borderBottom: '1px solid #222',
                  background: '#171717',
                  color: '#8f8f8f',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {positionsExpanded ? 'Positions (click to collapse)' : 'Positions (click to expand)'}
              </button>

              <div style={{ flex: 1, minHeight: 0 }}>
                <PositionsPanel netLiq={netLiq} />
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3 */}
        <div
          style={{
            background: '#0b0b0b',
            border: '1px solid #202020',
            borderRadius: 10,
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              fontSize: '11px',
              color: '#8f8f8f',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Section 3
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollCards {{
          0% {{ transform: translateX(0); }}
          100% {{ transform: translateX(-50%); }}
        }}
      `}</style>
    </div>
  );
}

'@

Set-Content -Path $appFile -Value $appContent -Encoding UTF8

Write-Host ""
Write-Host "Applied 50/50 collapsed and 20/80 expanded layout to App.tsx" -ForegroundColor Green
Write-Host ""
Write-Host "Run next:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend; npm run build" -ForegroundColor White
