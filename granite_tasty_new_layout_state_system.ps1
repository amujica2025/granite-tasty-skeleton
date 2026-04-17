$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$appFile = Join-Path $projectRoot "frontend\src\App.tsx"
$panelFile = Join-Path $projectRoot "frontend\src\components\PositionsPanel.tsx"

function Backup-File($path) {
    if (Test-Path $path) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        Copy-Item $path "$path.bak_$timestamp" -Force
    }
}

Backup-File $appFile
Backup-File $panelFile

# ---------- WRITE APP.TSX ----------
$appContent = @'
import { useEffect, useMemo, useState } from 'react';
import PositionsPanel from './components/PositionsPanel';

type LayoutState = 'default' | 'sides_bundle' | 'outer_plus_positions';

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

type GridArea = {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
};

type LayoutMap = {
  newPanel: GridArea;
  watchlist: GridArea;
  infoHub: GridArea;
  positions: GridArea;
  scanners: GridArea;
  newPanel2: GridArea;
};

const layouts: Record<LayoutState, LayoutMap> = {
  default: {
    newPanel: { colStart: 2, colEnd: 3, rowStart: 1, rowEnd: 7 },
    watchlist: { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 7 },
    infoHub: { colStart: 4, colEnd: 8, rowStart: 1, rowEnd: 4 },
    positions: { colStart: 4, colEnd: 8, rowStart: 4, rowEnd: 7 },
    scanners: { colStart: 8, colEnd: 9, rowStart: 1, rowEnd: 7 },
    newPanel2: { colStart: 9, colEnd: 10, rowStart: 1, rowEnd: 7 },
  },
  sides_bundle: {
    newPanel: { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 7 },
    watchlist: { colStart: 3, colEnd: 5, rowStart: 1, rowEnd: 7 },
    infoHub: { colStart: 5, colEnd: 7, rowStart: 1, rowEnd: 4 },
    positions: { colStart: 5, colEnd: 7, rowStart: 4, rowEnd: 7 },
    scanners: { colStart: 7, colEnd: 9, rowStart: 1, rowEnd: 7 },
    newPanel2: { colStart: 9, colEnd: 11, rowStart: 1, rowEnd: 7 },
  },
  outer_plus_positions: {
    newPanel: { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 7 },
    watchlist: { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 7 },
    infoHub: { colStart: 4, colEnd: 8, rowStart: 1, rowEnd: 2 },
    positions: { colStart: 4, colEnd: 8, rowStart: 2, rowEnd: 7 },
    scanners: { colStart: 8, colEnd: 9, rowStart: 1, rowEnd: 7 },
    newPanel2: { colStart: 9, colEnd: 11, rowStart: 1, rowEnd: 7 },
  },
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

const basePanel: React.CSSProperties = {
  background: '#060606',
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
  border: '1px solid #141414',
  boxSizing: 'border-box',
};

function areaStyle(area: GridArea): React.CSSProperties {
  return {
    gridColumn: `${area.colStart} / ${area.colEnd}`,
    gridRow: `${area.rowStart} / ${area.rowEnd}`,
  };
}

const formatCompact = (value: number) =>
  Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const heatColor = (value: number, min: number, max: number) => {
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));
  const alpha = 0.10 + ratio * 0.30;
  return `rgba(245, 158, 11, ${alpha.toFixed(3)})`;
};

export default function App() {
  const [layoutState, setLayoutState] = useState<LayoutState>('default');
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
      } catch {
        console.log('Quote parse error');
      }
    };

    return () => ws.close();
  }, []);

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
      { label: 'Longs', value: '$1,155', tone: '#d4d4d4' },
      { label: 'Shorts', value: '$7,955', tone: '#d4d4d4' },
    ],
    [bp, netLiq]
  );

  const layout = layouts[layoutState];
  const watchlistExpanded = layoutState === 'sides_bundle';
  const scannersExpanded = layoutState === 'sides_bundle';

  return (
    <div
      style={{
        background: '#000000',
        color: '#ffffff',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 2000,
            display: 'flex',
            gap: 4,
          }}
        >
          <button
            onClick={() => setLayoutState('default')}
            style={{
              border: '1px solid #2a2a2a',
              background: layoutState === 'default' ? '#1f1f1f' : '#080808',
              color: '#ddd',
              padding: '4px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Default State
          </button>
          <button
            onClick={() => setLayoutState('sides_bundle')}
            style={{
              border: '1px solid #2a2a2a',
              background: layoutState === 'sides_bundle' ? '#1f1f1f' : '#080808',
              color: '#ddd',
              padding: '4px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Outer + Watchlists/Scanners
          </button>
          <button
            onClick={() => setLayoutState('outer_plus_positions')}
            style={{
              border: '1px solid #2a2a2a',
              background: layoutState === 'outer_plus_positions' ? '#1f1f1f' : '#080808',
              color: '#ddd',
              padding: '4px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Outer + Positions
          </button>
        </div>

        <div style={{ ...basePanel, ...areaStyle(layout.newPanel) }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff50f7', fontWeight: 700, textAlign: 'center', padding: 8 }}>
            {layoutState === 'default' ? 'NEW PANEL - COLLAPSED' : 'NEW PANEL - EXPANDED'}
          </div>
        </div>

        <div style={{ ...basePanel, ...areaStyle(layout.watchlist) }}>
          <div style={{ height: 26, borderBottom: '1px solid #141414', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 11, fontWeight: 700, color: '#e5e5e5' }}>
            weeklys
          </div>
          <div style={{ height: 'calc(100% - 26px)', overflow: 'auto' }}>
            {!watchlistExpanded ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {['SYMBOL', 'LAST', '%CHG', 'IV PCTL'].map((label) => (
                  <div key={label} style={{ padding: '6px 5px', fontSize: 9, color: '#8a8a8a', borderBottom: '1px solid #111', borderRight: '1px solid #101010' }}>
                    {label}
                  </div>
                ))}
                {watchlistRows.flatMap((row) => [
                  <div key={`${row.symbol}-s`} style={{ padding: '6px 5px', fontSize: 10, fontWeight: 700, borderBottom: '1px solid #101010' }}>{row.symbol}</div>,
                  <div key={`${row.symbol}-l`} style={{ padding: '6px 5px', fontSize: 10, borderBottom: '1px solid #101010' }}>{row.latest.toFixed(2)}</div>,
                  <div key={`${row.symbol}-p`} style={{ padding: '6px 5px', fontSize: 10, color: row.pctChange >= 0 ? '#22c55e' : '#ef4444', borderBottom: '1px solid #101010' }}>
                    {row.pctChange >= 0 ? '+' : ''}{row.pctChange.toFixed(2)}%
                  </div>,
                  <div key={`${row.symbol}-i`} style={{ padding: '6px 5px', fontSize: 10, color: '#f59e0b', borderBottom: '1px solid #101010' }}>{row.ivPctl.toFixed(0)}</div>,
                ])}
              </div>
            ) : (
              <div style={{ minWidth: 980 }}>
                <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#070707', borderBottom: '1px solid #171717', display: 'grid', gridTemplateColumns: '88px 84px 84px 88px 76px 72px 78px 72px 72px 72px 72px 64px 76px 98px 84px 96px 108px 96px 96px', fontSize: 9, color: '#8a8a8a' }}>
                  {['Symbol', 'Latest', '%Change', '14D Rel Str', 'IV Pctl', 'IV/HV', 'Imp Vol', '5D IV', '1M IV', '3M IV', '6M IV', 'BB%', 'BB Rank', 'TTM Squeeze', '14D ADR', 'Options Vol', '1M Total Vol', 'Call Vol', 'Put Vol'].map((col) => (
                    <div key={col} style={{ padding: '6px 5px', borderRight: '1px solid #101010' }}>{col}</div>
                  ))}
                </div>
                {watchlistRows.map((row) => {
                  const termMin = Math.min(row.impVol, row.iv5d, row.iv1m, row.iv3m, row.iv6m);
                  const termMax = Math.max(row.impVol, row.iv5d, row.iv1m, row.iv3m, row.iv6m);
                  return (
                    <div key={row.symbol} style={{ display: 'grid', gridTemplateColumns: '88px 84px 84px 88px 76px 72px 78px 72px 72px 72px 72px 64px 76px 98px 84px 96px 108px 96px 96px', borderBottom: '1px solid #101010', fontSize: 10 }}>
                      <div style={{ padding: '6px 5px', fontWeight: 700 }}>{row.symbol}</div>
                      <div style={{ padding: '6px 5px' }}>{row.latest.toFixed(2)}</div>
                      <div style={{ padding: '6px 5px', color: row.pctChange >= 0 ? '#22c55e' : '#ef4444' }}>{row.pctChange >= 0 ? '+' : ''}{row.pctChange.toFixed(2)}%</div>
                      <div style={{ padding: '6px 5px' }}>{row.relStr14d.toFixed(1)}</div>
                      <div style={{ padding: '6px 5px', color: '#f59e0b' }}>{row.ivPctl.toFixed(0)}</div>
                      <div style={{ padding: '6px 5px' }}>{row.ivHv.toFixed(2)}</div>
                      <div style={{ padding: '6px 5px', background: heatColor(row.impVol, termMin, termMax) }}>{row.impVol.toFixed(1)}</div>
                      <div style={{ padding: '6px 5px', background: heatColor(row.iv5d, termMin, termMax) }}>{row.iv5d.toFixed(1)}</div>
                      <div style={{ padding: '6px 5px', background: heatColor(row.iv1m, termMin, termMax) }}>{row.iv1m.toFixed(1)}</div>
                      <div style={{ padding: '6px 5px', background: heatColor(row.iv3m, termMin, termMax) }}>{row.iv3m.toFixed(1)}</div>
                      <div style={{ padding: '6px 5px', background: heatColor(row.iv6m, termMin, termMax) }}>{row.iv6m.toFixed(1)}</div>
                      <div style={{ padding: '6px 5px' }}>{row.bbPct.toFixed(0)}</div>
                      <div style={{ padding: '6px 5px' }}>{row.bbRank.toFixed(0)}</div>
                      <div style={{ padding: '6px 5px' }}>{row.ttmSqueeze}</div>
                      <div style={{ padding: '6px 5px' }}>{row.adr14d.toFixed(1)}</div>
                      <div style={{ padding: '6px 5px' }}>{formatCompact(row.optionsVol)}</div>
                      <div style={{ padding: '6px 5px' }}>{formatCompact(row.totalVol1m)}</div>
                      <div style={{ padding: '6px 5px' }}>{formatCompact(row.callVol)}</div>
                      <div style={{ padding: '6px 5px' }}>{formatCompact(row.putVol)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ ...basePanel, ...areaStyle(layout.infoHub) }}>
          <div style={{ height: 22, borderBottom: '1px solid #141414', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#7d7d7d', letterSpacing: '0.08em' }}>
            INFO HUB
          </div>
          <div style={{ height: 'calc(100% - 22px)', overflow: 'hidden', padding: '4px 6px' }}>
            <div style={{ display: 'inline-flex', gap: 8, width: 'max-content', animation: 'scrollCards 28s linear infinite' }}>
              {kpiCards.concat(kpiCards).map((card, i) => (
                <div key={`${card.label}-${i}`} style={{ width: 120, minWidth: 120, height: 40, background: '#050505', border: '1px solid #171717', padding: '4px 6px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 8, color: '#7e7e7e' }}>{card.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: card.tone }}>{card.value}</div>
                </div>
              ))}
              {tickers.concat(tickers).map((card, i) => (
                <div key={`${card.symbol}-${i}`} style={{ width: 120, minWidth: 120, height: 40, background: '#050505', border: '1px solid #171717', padding: '4px 6px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8 }}>
                    <span style={{ fontWeight: 700 }}>{card.symbol}</span>
                    <span style={{ color: card.chgPct >= 0 ? '#22c55e' : '#ef4444' }}>{card.chgPct >= 0 ? '+' : ''}{card.chgPct.toFixed(2)}%</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{card.last.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...basePanel, ...areaStyle(layout.positions) }}>
          <PositionsPanel />
        </div>

        <div style={{ ...basePanel, ...areaStyle(layout.scanners) }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5c45a', fontSize: 16, fontWeight: 700, letterSpacing: '0.06em' }}>
            {scannersExpanded ? 'SCANNERS - EXPANDED' : 'SCANNERS - COLLAPSED'}
          </div>
        </div>

        <div style={{ ...basePanel, ...areaStyle(layout.newPanel2) }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#41e8f4', fontWeight: 700, textAlign: 'center', padding: 8 }}>
            {layoutState === 'default' ? 'NEW PANEL 2 - COLLAPSED' : 'NEW PANEL 2 - EXPANDED'}
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

# ---------- WRITE POSITIONSPANEL.TSX ----------
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

export default function PositionsPanel() {
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

  return (
    <div
      ref={panelRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#040404',
        overflow: 'auto',
        fontSize: '0.78em',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1500px' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#090909', zIndex: 10 }}>
          <tr style={{ borderBottom: '1px solid #1b1b1b' }}>
            <th style={{ textAlign: 'left', padding: '6px 5px' }}>Position</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>IV</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Mark</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Mark Chng $</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Trade Price</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>High</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Low</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>P/L Open $</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Cost</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Net Liq</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>BP Effect</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>IntVal</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>DTE</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Ex Date</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Theta (Θ)</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Delta (Δ)</th>
            <th style={{ textAlign: 'right', padding: '6px 5px' }}>Gamma (Γ)</th>
            <th style={{ textAlign: 'left', padding: '6px 5px' }}>Sector</th>
            <th style={{ textAlign: 'left', padding: '6px 5px' }}>Industry</th>
            <th style={{ textAlign: 'left', padding: '6px 5px' }}>Sub-Ind</th>
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
                  borderBottom: '1px solid #111',
                  background: isModified ? 'rgba(250, 204, 21, 0.08)' : 'transparent',
                  outline: isSelected ? '1px solid #ffffff' : 'none',
                  outlineOffset: '-1px',
                }}
              >
                <td style={{ padding: '8px 5px', fontWeight: 500 }}>{pos.symbol}</td>
                <td
                  onMouseEnter={() => setHoveredQtyId(pos.id)}
                  onMouseLeave={() => setHoveredQtyId((prev) => (prev === pos.id ? null : prev))}
                  style={{ textAlign: 'right', padding: '8px 5px', position: 'relative' }}
                >
                  <span style={{ color: isModified ? '#eab308' : '#ffffff' }}>{displayQty}</span>
                  {showQtyControls && (
                    <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTempQty(pos.id, pos.qty, 'up');
                        }}
                        style={{ color: '#cfcfcf', background: '#1b1b1b', border: '1px solid #444', borderRadius: '2px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, padding: '1px 3px' }}
                      >
                        ▲
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTempQty(pos.id, pos.qty, 'down');
                        }}
                        style={{ color: '#cfcfcf', background: '#1b1b1b', border: '1px solid #444', borderRadius: '2px', cursor: 'pointer', fontSize: '9px', lineHeight: 1, padding: '1px 3px' }}
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.iv.toFixed(1)}%</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.mark.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px', color: pos.markChng >= 0 ? '#22c55e' : '#ef4444' }}>{pos.markChng >= 0 ? '+' : ''}{pos.markChng.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.tradePrice.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.high.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.low.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px', color: pos.plOpen >= 0 ? '#22c55e' : '#ef4444' }}>{pos.plOpen >= 0 ? '+' : ''}{pos.plOpen.toFixed(0)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.cost.toFixed(0)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px', fontWeight: 600 }}>{pos.netLiq.toFixed(0)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.bpEffect.toFixed(0)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.intVal.toFixed(0)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.dte}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.exDate}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.theta.toFixed(1)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.delta.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>{pos.gamma.toFixed(3)}</td>
                <td style={{ padding: '8px 5px' }}>{pos.sector}</td>
                <td style={{ padding: '8px 5px' }}>{pos.industry}</td>
                <td style={{ padding: '8px 5px' }}>{pos.subIndustry}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

'@

Set-Content -Path $appFile -Value $appContent -Encoding UTF8
Set-Content -Path $panelFile -Value $panelContent -Encoding UTF8

Write-Host ""
Write-Host "New layout system applied successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next:"
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend; npm run build"