# granite_tasty_infohub_positions_overlay_build.ps1
$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$appFile = Join-Path $projectRoot "frontend\src\App.tsx"
$panelFile = Join-Path $projectRoot "frontend\src\components\PositionsPanel.tsx"

if (-not (Test-Path $projectRoot)) {
    throw "Project root not found: $projectRoot"
}

function Backup-File($path) {
    if (Test-Path $path) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        Copy-Item $path "$path.bak_$timestamp" -Force
    }
}

Backup-File $appFile
Backup-File $panelFile

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

type MarqueeTicker = {
  kind: 'ticker';
  symbol: string;
  last: number;
  chgPct: number;
};

type MarqueeKpi = {
  kind: 'kpi';
  label: string;
  value: string;
  tone?: string;
};

type MarqueeCard = MarqueeTicker | MarqueeKpi;

const watchlistSeed: WatchlistRow[] = [
  { symbol: 'SPY', latest: 513.24, pctChange: 0.42, relStr14d: 57.1, ivPctl: 31.0, ivHv: 1.08, impVol: 15.4, iv5d: 14.6, iv1m: 15.2, iv3m: 16.4, iv6m: 17.1, bbPct: 62.0, bbRank: 58.0, ttmSqueeze: 'Off', adr14d: 7.2, optionsVol: 2450000, totalVol1m: 19400000, callVol: 1290000, putVol: 1160000 },
  { symbol: 'QQQ', latest: 441.82, pctChange: -0.21, relStr14d: 49.2, ivPctl: 34.0, ivHv: 1.11, impVol: 18.2, iv5d: 17.9, iv1m: 18.0, iv3m: 19.5, iv6m: 20.3, bbPct: 48.0, bbRank: 44.0, ttmSqueeze: 'On', adr14d: 8.8, optionsVol: 1840000, totalVol1m: 13800000, callVol: 910000, putVol: 930000 },
  { symbol: 'IWM', latest: 201.64, pctChange: 0.66, relStr14d: 61.2, ivPctl: 43.0, ivHv: 1.22, impVol: 22.4, iv5d: 21.8, iv1m: 22.2, iv3m: 24.0, iv6m: 25.6, bbPct: 68.0, bbRank: 65.0, ttmSqueeze: 'Off', adr14d: 4.9, optionsVol: 621000, totalVol1m: 4550000, callVol: 308000, putVol: 313000 },
  { symbol: 'TSLA', latest: 172.31, pctChange: 1.81, relStr14d: 72.4, ivPctl: 68.0, ivHv: 1.36, impVol: 48.5, iv5d: 45.0, iv1m: 46.8, iv3m: 50.9, iv6m: 55.1, bbPct: 77.0, bbRank: 74.0, ttmSqueeze: 'Off', adr14d: 9.1, optionsVol: 1310000, totalVol1m: 11300000, callVol: 690000, putVol: 620000 },
  { symbol: 'NVDA', latest: 880.44, pctChange: 2.26, relStr14d: 78.5, ivPctl: 64.0, ivHv: 1.19, impVol: 41.7, iv5d: 40.2, iv1m: 41.1, iv3m: 43.9, iv6m: 46.2, bbPct: 82.0, bbRank: 79.0, ttmSqueeze: 'Off', adr14d: 28.2, optionsVol: 2100000, totalVol1m: 16200000, callVol: 1180000, putVol: 920000 },
  { symbol: 'SPX', latest: 5208.43, pctChange: 0.17, relStr14d: 54.8, ivPctl: 27.0, ivHv: 1.02, impVol: 14.7, iv5d: 13.9, iv1m: 14.4, iv3m: 15.8, iv6m: 16.9, bbPct: 51.0, bbRank: 49.0, ttmSqueeze: 'On', adr14d: 61.0, optionsVol: 0, totalVol1m: 0, callVol: 0, putVol: 0 },
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
              const symbol = values[i];
              map[symbol] = { bid: values[i + 1], ask: values[i + 2] };
            }

            setWatchlistRows((prev) =>
              prev.map((row) => {
                const quote = map[row.symbol];
                if (!quote) return row;

                const mid =
                  typeof quote.bid === 'number' && typeof quote.ask === 'number'
                    ? (quote.bid + quote.ask) / 2
                    : row.latest;

                return {
                  ...row,
                  latest: Number.isFinite(mid) ? Number(mid.toFixed(2)) : row.latest,
                };
              })
            );
          }
        }
      } catch (e) {
        console.log('Quote parse error');
      }
    };

    return () => ws.close();
  }, []);

  const totalLongOptionsBalance = 1155;
  const totalShortOptionsBalance = 7955;

  const marqueeCards: MarqueeCard[] = useMemo(
    () => [
      { kind: 'kpi', label: 'Net Liq', value: netLiq !== null ? `$${netLiq.toLocaleString()}` : '—', tone: '#22c55e' },
      { kind: 'kpi', label: 'BP', value: bp !== null ? `$${bp.toLocaleString()}` : '—', tone: '#60a5fa' },
      {
        kind: 'kpi',
        label: '25x',
        value: netLiq !== null ? `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—',
        tone: '#f59e0b',
      },
      { kind: 'kpi', label: 'Longs', value: `$${totalLongOptionsBalance.toLocaleString()}`, tone: '#d4d4d4' },
      { kind: 'kpi', label: 'Shorts', value: `$${totalShortOptionsBalance.toLocaleString()}`, tone: '#d4d4d4' },
      { kind: 'ticker', symbol: 'SPY', last: 513.24, chgPct: 0.42 },
      { kind: 'ticker', symbol: 'AAPL', last: 189.81, chgPct: 0.71 },
      { kind: 'ticker', symbol: 'QQQ', last: 441.82, chgPct: -0.21 },
      { kind: 'ticker', symbol: 'TSLA', last: 172.31, chgPct: 1.81 },
      { kind: 'ticker', symbol: 'NVDA', last: 880.44, chgPct: 2.26 },
      { kind: 'ticker', symbol: 'SPX', last: 5208.43, chgPct: 0.17 },
      { kind: 'ticker', symbol: 'VIX', last: 15.83, chgPct: -2.05 },
    ],
    [bp, netLiq]
  );

  return (
    <div
      style={{
        background: '#050505',
        color: '#fff',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* WATCHLIST TOGGLE */}
      <button
        onClick={() => setWatchlistOpen((prev) => !prev)}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 2000,
          width: 30,
          height: 30,
          borderRadius: 6,
          border: '1px solid #333',
          background: '#0b0b0b',
          color: '#ddd',
          cursor: 'pointer',
        }}
        title={watchlistOpen ? 'Collapse watchlist' : 'Expand watchlist'}
      >
        {watchlistOpen ? '«' : '»'}
      </button>

      {/* LEFT WATCHLIST OVERLAY */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: watchlistOpen ? 320 : 76,
          transition: 'width 180ms ease',
          background: '#111111',
          borderRight: '1px solid #242424',
          zIndex: 1500,
          overflow: 'hidden',
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
            paddingLeft: 44,
            fontSize: 12,
            fontWeight: 700,
            color: '#e5e5e5',
          }}
        >
          {watchlistOpen ? 'weeklys' : 'WL'}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {!watchlistOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {watchlistRows.map((row) => (
                <div
                  key={row.symbol}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid #1f1f1f',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '4px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>{row.symbol}</div>
                  <div style={{ fontSize: '11px', color: '#d4d4d4' }}>{row.latest.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: row.pctChange >= 0 ? '#22c55e' : '#ef4444' }}>
                    {row.pctChange >= 0 ? '+' : ''}
                    {row.pctChange.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#f59e0b' }}>{row.ivPctl.toFixed(0)}</div>
                </div>
              ))}
            </div>
          ) : (
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
                    <div style={{ padding: '8px 6px', color: row.pctChange >= 0 ? '#22c55e' : '#ef4444' }}>
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
          )}
        </div>
      </div>

      {/* MAIN SECTIONS */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: 8,
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 8,
          boxSizing: 'border-box',
        }}
      >
        {/* SECTION 2 */}
        <div
          style={{
            position: 'relative',
            minWidth: 0,
            minHeight: 0,
            background: '#080808',
            border: '1px solid #202020',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {/* INFO HUB UNDERLAY */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 118,
              borderTop: '1px solid #242424',
              background: '#111111',
              zIndex: 1,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '8px 10px', fontSize: '11px', color: '#8f8f8f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Info Hub
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                whiteSpace: 'nowrap',
                padding: '0 10px 10px',
                animation: 'scrollCards 30s linear infinite',
                width: 'max-content',
              }}
            >
              {marqueeCards.concat(marqueeCards).map((card, i) =>
                card.kind === 'ticker' ? (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ fontWeight: 700 }}>{card.symbol}</span>
                      <span style={{ color: card.chgPct >= 0 ? '#22c55e' : '#ef4444' }}>
                        {card.chgPct >= 0 ? '+' : ''}
                        {card.chgPct.toFixed(2)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{card.last.toFixed(2)}</div>
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
                ) : (
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
                    <div style={{ fontSize: 11, color: '#8f8f8f', textTransform: 'uppercase' }}>{card.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: card.tone || '#d4d4d4' }}>{card.value}</div>
                    <div
                      style={{
                        height: 18,
                        border: '1px solid #1e1e1e',
                        borderRadius: 4,
                        background: '#080808',
                      }}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* POSITIONS OVERLAY */}
          <div
            onClick={() => setPositionsExpanded((prev) => !prev)}
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              bottom: 8,
              height: positionsExpanded ? 'calc(100% - 16px)' : 300,
              transition: 'height 180ms ease',
              zIndex: 5,
              cursor: 'pointer',
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
              <div
                style={{
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #222',
                  background: '#171717',
                  fontSize: 11,
                  color: '#8f8f8f',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                {positionsExpanded ? 'Positions (click to collapse)' : 'Positions (click to expand)'}
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                style={{ flex: 1, minHeight: 0 }}
              >
                <PositionsPanel netLiq={netLiq} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
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
          <div style={{ padding: '10px 12px', fontSize: '11px', color: '#8f8f8f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Section 3
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollCards {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

'@

$panelContent = @'
import { useEffect, useRef, useState } from 'react';

interface Position {
  id: string;
  symbol: string;
  qty: number;
  iv: number;
  mark: number;
  markChng: number;
  tradePrice: number;
  high: number;
  low: number;
  plOpen: number;
  cost: number;
  netLiq: number;
  bpEffect: number;
  intVal: number;
  dte: number;
  exDate: string;
  theta: number;
  delta: number;
  gamma: number;
  sector: string;
  industry: string;
  subIndustry: string;
}

interface PositionsPanelProps {
  netLiq?: number | null;
}

export default function PositionsPanel({ netLiq = null }: PositionsPanelProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tempQtys, setTempQtys] = useState<Record<string, number>>({});
  const [hoveredQtyId, setHoveredQtyId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) {
        setSelectedIds(new Set());
        setTempQtys({});
        setHoveredQtyId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const mockPositions: Position[] = [
      { id: '1', symbol: 'SPY 240620C550', qty: -5, iv: 18.4, mark: 12.35, markChng: -0.45, tradePrice: 12.8, high: 13.2, low: 12.1, plOpen: -225, cost: 6400, netLiq: -6175, bpEffect: 1250, intVal: 0, dte: 65, exDate: '2024-06-20', theta: -8.2, delta: 0.62, gamma: 0.012, sector: 'Equity', industry: 'Broad Market', subIndustry: 'ETF' },
      { id: '2', symbol: 'AAPL 240517P180', qty: 3, iv: 24.7, mark: 3.85, markChng: 0.65, tradePrice: 3.2, high: 4.1, low: 3.15, plOpen: 195, cost: 960, netLiq: 1155, bpEffect: -300, intVal: 0, dte: 31, exDate: '2024-05-17', theta: -4.1, delta: -0.38, gamma: 0.018, sector: 'Technology', industry: 'Consumer Electronics', subIndustry: 'Hardware' },
      { id: '3', symbol: 'QQQ 240628C460', qty: -2, iv: 21.3, mark: 8.9, markChng: -1.2, tradePrice: 10.1, high: 10.5, low: 8.7, plOpen: -240, cost: 2020, netLiq: -1780, bpEffect: 920, intVal: 0, dte: 73, exDate: '2024-06-28', theta: -6.8, delta: 0.55, gamma: 0.009, sector: 'Equity', industry: 'Broad Market', subIndustry: 'ETF' },
    ];
    setPositions(mockPositions);
  }, []);

  const toggleRow = (id: string, e: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (e.ctrlKey || e.metaKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }

      setTempQtys((prevQtys) => {
        const filtered: Record<string, number> = {};
        Object.entries(prevQtys).forEach(([key, value]) => {
          if (next.has(key)) filtered[key] = value;
        });
        return filtered;
      });

      return next;
    });
  };

  const updateTempQty = (id: string, actualQty: number, dir: 'up' | 'down') => {
    setTempQtys((prev) => {
      const current = prev[id] !== undefined ? prev[id] : actualQty;
      const nextQty = dir === 'up' ? current + 1 : current - 1;
      const next = { ...prev };

      if (nextQty === actualQty) delete next[id];
      else next[id] = nextQty;

      return next;
    });
  };

  const selectedPositions = positions.filter((p) => selectedIds.has(p.id));
  const bpEffect = selectedPositions.reduce((sum, p) => sum + (p.bpEffect || 0), 0);

  return (
    <div
      ref={panelRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#111111',
        overflow: 'hidden',
        fontSize: '0.82em',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          background: '#171717',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          fontSize: '0.92em',
          flexShrink: 0,
        }}
      >
        <div>
          Net Liq:{' '}
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            ${netLiq !== null ? netLiq.toLocaleString() : '—'}
          </span>
        </div>
        <div>
          BP Effect: <span style={{ color: '#eab308' }}>${bpEffect.toFixed(0)}</span>
        </div>
        <div style={{ marginLeft: 'auto', color: '#888' }}>
          25x NLV: ${netLiq !== null ? (netLiq * 25).toLocaleString() : '—'}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1600px' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#111111', zIndex: 10 }}>
            <tr style={{ borderBottom: '1px solid #3a3a3a' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>Position</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>IV</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Mark</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Mark Chng $</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Trade Price</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>High</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Low</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>P/L Open $</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Cost</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Net Liq</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>BP Effect</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>IntVal</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>DTE</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Ex Date</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Theta (Θ)</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Delta (Δ)</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Gamma (Γ)</th>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>Sector</th>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>Industry</th>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>Sub-Ind</th>
            </tr>
          </thead>

          <tbody>
            {positions.map((pos) => {
              const isSelected = selectedIds.has(pos.id);
              const displayQty = tempQtys[pos.id] !== undefined ? tempQtys[pos.id] : pos.qty;
              const isModified = tempQtys[pos.id] !== undefined;
              const showQtyControls = hoveredQtyId === pos.id && isSelected;

              return (
                <tr
                  key={pos.id}
                  onClick={(e) => toggleRow(pos.id, e)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #222',
                    background: isModified ? 'rgba(250, 204, 21, 0.08)' : 'transparent',
                    outline: isSelected ? '1px solid #ffffff' : 'none',
                    outlineOffset: '-1px',
                  }}
                >
                  <td style={{ padding: '10px 6px', fontWeight: 500 }}>{pos.symbol}</td>

                  <td
                    onMouseEnter={() => setHoveredQtyId(pos.id)}
                    onMouseLeave={() => setHoveredQtyId((prev) => (prev === pos.id ? null : prev))}
                    style={{ textAlign: 'right', padding: '10px 6px', position: 'relative' }}
                  >
                    <span style={{ color: isModified ? '#eab308' : '#ffffff' }}>{displayQty}</span>

                    {showQtyControls && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '4px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTempQty(pos.id, pos.qty, 'up');
                          }}
                          style={{
                            color: '#cfcfcf',
                            background: '#1b1b1b',
                            border: '1px solid #444',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '9px',
                            lineHeight: 1,
                            padding: '1px 3px',
                          }}
                        >
                          ▲
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTempQty(pos.id, pos.qty, 'down');
                          }}
                          style={{
                            color: '#cfcfcf',
                            background: '#1b1b1b',
                            border: '1px solid #444',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '9px',
                            lineHeight: 1,
                            padding: '1px 3px',
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </td>

                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.iv.toFixed(1)}%</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.mark.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', color: pos.markChng >= 0 ? '#22c55e' : '#ef4444' }}>
                    {pos.markChng >= 0 ? '+' : ''}
                    {pos.markChng.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.tradePrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.high.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.low.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', color: pos.plOpen >= 0 ? '#22c55e' : '#ef4444' }}>
                    {pos.plOpen >= 0 ? '+' : ''}
                    {pos.plOpen.toFixed(0)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.cost.toFixed(0)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', fontWeight: 600 }}>{pos.netLiq.toFixed(0)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.bpEffect.toFixed(0)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.intVal.toFixed(0)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.dte}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.exDate}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.theta.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.delta.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.gamma.toFixed(3)}</td>
                  <td style={{ padding: '10px 6px' }}>{pos.sector}</td>
                  <td style={{ padding: '10px 6px' }}>{pos.industry}</td>
                  <td style={{ padding: '10px 6px' }}>{pos.subIndustry}</td>
                </tr>
              );
            })}

            <tr>
              <td style={{ padding: '10px 6px', fontWeight: 700 }}>Totals:</td>
              <td colSpan={9} />
              <td style={{ textAlign: 'right', padding: '10px 6px', color: '#22c55e', fontWeight: 700 }}>
                {netLiq !== null ? `$${netLiq.toLocaleString()}` : '—'}
              </td>
              <td style={{ textAlign: 'right', padding: '10px 6px', color: '#eab308', fontWeight: 700 }}>
                ${bpEffect.toFixed(0)}
              </td>
              <td colSpan={9} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

'@

Set-Content -Path $appFile -Value $appContent -Encoding UTF8
Set-Content -Path $panelFile -Value $panelContent -Encoding UTF8

Write-Host ""
Write-Host "Applied info hub + positions overlay build." -ForegroundColor Green
Write-Host ""
Write-Host "Run next:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend; npm run build" -ForegroundColor White
Write-Host ""
Write-Host "Then if needed:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\backend; .\venv\Scripts\python main.py" -ForegroundColor White
