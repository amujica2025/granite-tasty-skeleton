import { useEffect, useMemo, useRef, useState } from 'react';
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

type GridArea = {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
};

type PanelState = {
  newPanel: boolean;
  watchlist: boolean;
  positions: boolean;
  scanners: boolean;
  newPanel2: boolean;
};

const COL_WIDTH = 500;
const TOTAL_COLS = 10;
const TOTAL_ROWS = 6;
const ROW_HEIGHT = 155;
const SHEET_HEIGHT = TOTAL_ROWS * ROW_HEIGHT;

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
  position: 'relative',
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
  const alpha = 0.1 + ratio * 0.3;
  return `rgba(245, 158, 11, ${alpha.toFixed(3)})`;
};

function getLayout(expanded: PanelState) {
  const newPanelArea: GridArea = expanded.newPanel
    ? { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 7 }
    : { colStart: 2, colEnd: 3, rowStart: 1, rowEnd: 7 };

  const watchlistArea: GridArea = expanded.watchlist
    ? { colStart: 3, colEnd: 5, rowStart: 1, rowEnd: 7 }
    : { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 7 };

  const scannersArea: GridArea = expanded.scanners
    ? { colStart: 7, colEnd: 9, rowStart: 1, rowEnd: 7 }
    : { colStart: 8, colEnd: 9, rowStart: 1, rowEnd: 7 };

  const newPanel2Area: GridArea = expanded.newPanel2
    ? { colStart: 9, colEnd: 11, rowStart: 1, rowEnd: 7 }
    : { colStart: 9, colEnd: 10, rowStart: 1, rowEnd: 7 };

  const centerStart = watchlistArea.colEnd;
  const centerEnd = scannersArea.colStart;

  const infoHubArea: GridArea = expanded.positions
    ? { colStart: centerStart, colEnd: centerEnd, rowStart: 1, rowEnd: 2 }
    : { colStart: centerStart, colEnd: centerEnd, rowStart: 1, rowEnd: 3 };

  const positionsArea: GridArea = expanded.positions
    ? { colStart: centerStart, colEnd: centerEnd, rowStart: 2, rowEnd: 7 }
    : { colStart: centerStart, colEnd: centerEnd, rowStart: 3, rowEnd: 7 };

  return {
    newPanel: newPanelArea,
    watchlist: watchlistArea,
    infoHub: infoHubArea,
    positions: positionsArea,
    scanners: scannersArea,
    newPanel2: newPanel2Area,
  };
}

export default function App() {
  const [netLiq, setNetLiq] = useState<number | null>(null);
  const [bp, setBp] = useState<number | null>(null);
  const [watchlistRows, setWatchlistRows] = useState<WatchlistRow[]>(watchlistSeed);
  const [tickers, setTickers] = useState<TickerCard[]>(tickerSeed);
  const [expanded, setExpanded] = useState<PanelState>({
    newPanel: false,
    watchlist: false,
    positions: false,
    scanners: false,
    newPanel2: false,
  });

  const viewportRef = useRef<HTMLDivElement | null>(null);

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
            const map: Record<string, { bid: number; ask: number }> = {};

            for (let i = 0; i < values.length; i += 5) {
              map[values[i]] = {
                bid: values[i + 1],
                ask: values[i + 2],
              };
            }

            const nextMid = (symbol: string, fallback: number) => {
              const q = map[symbol];
              if (!q || typeof q.bid !== 'number' || typeof q.ask !== 'number') return fallback;
              const mid = (q.bid + q.ask) / 2;
              return Number.isFinite(mid) ? Number(mid.toFixed(2)) : fallback;
            };

            setWatchlistRows((prev) =>
              prev.map((row) => ({
                ...row,
                latest: nextMid(row.symbol, row.latest),
              }))
            );

            setTickers((prev) =>
              prev.map((row) => ({
                ...row,
                last: nextMid(row.symbol, row.last),
              }))
            );
          }
        }
      } catch {
        console.log('Quote parse error');
      }
    };

    return () => ws.close();
  }, []);

  const layout = useMemo(() => getLayout(expanded), [expanded]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const centerDefaultField = () => {
      const worldWidth = el.scrollWidth;
      const viewWidth = el.clientWidth;
      const centeredLeft = Math.max(0, (worldWidth - viewWidth) / 2);
      el.scrollLeft = centeredLeft;
    };

    centerDefaultField();
    const t = setTimeout(centerDefaultField, 50);
    window.addEventListener('resize', centerDefaultField);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', centerDefaultField);
    };
  }, [expanded]);

  const applyPreset = (preset: 'default' | 'preset2' | 'preset3') => {
    if (preset === 'default') {
      setExpanded({
        newPanel: false,
        watchlist: false,
        positions: false,
        scanners: false,
        newPanel2: false,
      });
      return;
    }

    if (preset === 'preset2') {
      setExpanded({
        newPanel: true,
        watchlist: true,
        positions: false,
        scanners: true,
        newPanel2: true,
      });
      return;
    }

    setExpanded({
      newPanel: true,
      watchlist: false,
      positions: true,
      scanners: false,
      newPanel2: true,
    });
  };

  const togglePanel = (panel: keyof PanelState) => {
    setExpanded((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const watchlistExpanded = expanded.watchlist;
  const kpiCards = [
    { label: 'Net Liq', value: netLiq !== null ? `$${netLiq.toLocaleString()}` : 'â€”', tone: '#22c55e' },
    { label: 'BP', value: bp !== null ? `$${bp.toLocaleString()}` : 'â€”', tone: '#60a5fa' },
    {
      label: '25x',
      value: netLiq !== null
        ? `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : 'â€”',
      tone: '#f59e0b',
    },
    { label: 'Longs', value: '$1,155', tone: '#d4d4d4' },
    { label: 'Shorts', value: '$7,955', tone: '#d4d4d4' },
  ];

  return (
    <div
      style={{
        background: '#000',
        color: '#fff',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          background: '#0b0b0b',
          borderBottom: '1px solid #1d1d1d',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: '0.05em', color: '#ddd' }}>Granite Tasty Skeleton</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => applyPreset('default')}
            style={{
              border: '1px solid #2a2a2a',
              background: !expanded.newPanel && !expanded.watchlist && !expanded.positions && !expanded.scanners && !expanded.newPanel2 ? '#1f1f1f' : '#080808',
              color: '#ddd',
              padding: '4px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Default State
          </button>
          <button
            onClick={() => applyPreset('preset2')}
            style={{
              border: '1px solid #2a2a2a',
              background: expanded.newPanel && expanded.watchlist && expanded.scanners && expanded.newPanel2 && !expanded.positions ? '#1f1f1f' : '#080808',
              color: '#ddd',
              padding: '4px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Outer + Watchlist/Scanners
          </button>
          <button
            onClick={() => applyPreset('preset3')}
            style={{
              border: '1px solid #2a2a2a',
              background: expanded.newPanel && expanded.positions && expanded.newPanel2 && !expanded.watchlist && !expanded.scanners ? '#1f1f1f' : '#080808',
              color: '#ddd',
              padding: '4px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Outer + Positions
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        style={{
          height: 'calc(100vh - 34px)',
          overflowX: 'auto',
          overflowY: 'hidden',
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            width: TOTAL_COLS * COL_WIDTH,
            height: SHEET_HEIGHT,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: `repeat(${TOTAL_COLS}, ${COL_WIDTH}px)`,
            gridTemplateRows: `repeat(${TOTAL_ROWS}, ${ROW_HEIGHT}px)`,
            background: '#050505',
          }}
        >
          <div
            style={{
              ...basePanel,
              ...areaStyle(layout.newPanel),
              background: '#fd18fa',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="panel-head">
              <span>{expanded.newPanel ? 'NEW PANEL - EXPANDED' : 'NEW PANEL - COLLAPSED'}</span>
              <button onClick={() => togglePanel('newPanel')}>{expanded.newPanel ? 'âˆ’' : '+'}</button>
            </div>
            <div className="panel-fill" />
          </div>

          <div
            style={{
              ...basePanel,
              ...areaStyle(layout.watchlist),
              background: '#15e80f',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="panel-head">
              <span>{watchlistExpanded ? 'WATCHLIST - EXPANDED' : 'WATCHLIST - COLLAPSED'}</span>
              <button onClick={() => togglePanel('watchlist')}>{watchlistExpanded ? 'âˆ’' : '+'}</button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
              {!watchlistExpanded ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    fontSize: 11,
                    gap: 0,
                    color: '#0c0c0c',
                  }}
                >
                  {['SYMBOL', 'LAST', '%CHG', 'IV PCTL'].map((label) => (
                    <div key={label} style={{ fontWeight: 700, padding: '4px 2px', borderBottom: '1px solid #101010' }}>
                      {label}
                    </div>
                  ))}

                  {watchlistRows.flatMap((row) => [
                    <div key={`${row.symbol}-s`} style={{ padding: '4px 2px', borderBottom: '1px solid #101010' }}>{row.symbol}</div>,
                    <div key={`${row.symbol}-l`} style={{ padding: '4px 2px', borderBottom: '1px solid #101010' }}>{row.latest.toFixed(2)}</div>,
                    <div key={`${row.symbol}-p`} style={{ padding: '4px 2px', color: row.pctChange >= 0 ? '#166534' : '#991b1b', borderBottom: '1px solid #101010' }}>
                      {row.pctChange >= 0 ? '+' : ''}{row.pctChange.toFixed(2)}%
                    </div>,
                    <div key={`${row.symbol}-i`} style={{ padding: '4px 2px', borderBottom: '1px solid #101010' }}>{row.ivPctl.toFixed(0)}</div>,
                  ])}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(19, minmax(86px, 1fr))',
                    fontSize: 10,
                    gap: 0,
                    color: '#0c0c0c',
                  }}
                >
                  {['Symbol', 'Latest', '%Change', '14D Rel Str', 'IV Pctl', 'IV/HV', 'Imp Vol', '5D IV', '1M IV', '3M IV', '6M IV', 'BB%', 'BB Rank', 'TTM Squeeze', '14D ADR', 'Options Vol', '1M Total Vol', 'Call Vol', 'Put Vol'].map((col) => (
                    <div key={col} style={{ fontWeight: 700, padding: '4px 6px', borderBottom: '1px solid #101010', whiteSpace: 'nowrap' }}>
                      {col}
                    </div>
                  ))}

                  {watchlistRows.map((row) => {
                    const termMin = Math.min(row.impVol, row.iv5d, row.iv1m, row.iv3m, row.iv6m);
                    const termMax = Math.max(row.impVol, row.iv5d, row.iv1m, row.iv3m, row.iv6m);
                    return (
                      <>
                        <div key={`${row.symbol}-0`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.symbol}</div>
                        <div key={`${row.symbol}-1`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.latest.toFixed(2)}</div>
                        <div key={`${row.symbol}-2`} style={{ padding: '4px 6px', color: row.pctChange >= 0 ? '#166534' : '#991b1b', borderBottom: '1px solid #101010' }}>
                          {row.pctChange >= 0 ? '+' : ''}{row.pctChange.toFixed(2)}%
                        </div>
                        <div key={`${row.symbol}-3`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.relStr14d.toFixed(1)}</div>
                        <div key={`${row.symbol}-4`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.ivPctl.toFixed(0)}</div>
                        <div key={`${row.symbol}-5`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.ivHv.toFixed(2)}</div>
                        {[row.impVol, row.iv5d, row.iv1m, row.iv3m, row.iv6m].map((value, idx) => (
                          <div
                            key={`${row.symbol}-term-${idx}`}
                            style={{
                              padding: '4px 6px',
                              borderBottom: '1px solid #101010',
                              background: heatColor(value, termMin, termMax),
                            }}
                          >
                            {value.toFixed(1)}
                          </div>
                        ))}
                        <div key={`${row.symbol}-11`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.bbPct.toFixed(0)}</div>
                        <div key={`${row.symbol}-12`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.bbRank.toFixed(0)}</div>
                        <div key={`${row.symbol}-13`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.ttmSqueeze}</div>
                        <div key={`${row.symbol}-14`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{row.adr14d.toFixed(1)}</div>
                        <div key={`${row.symbol}-15`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{formatCompact(row.optionsVol)}</div>
                        <div key={`${row.symbol}-16`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{formatCompact(row.totalVol1m)}</div>
                        <div key={`${row.symbol}-17`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{formatCompact(row.callVol)}</div>
                        <div key={`${row.symbol}-18`} style={{ padding: '4px 6px', borderBottom: '1px solid #101010' }}>{formatCompact(row.putVol)}</div>
                      </>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              ...basePanel,
              ...areaStyle(layout.infoHub),
              background: '#ff2618',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
            }}
          >
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 26, color: '#111', marginBottom: 10 }}>
              INFO HUB
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(1, layout.infoHub.colEnd - layout.infoHub.colStart)}, minmax(0, 1fr))`,
                gap: 8,
                marginBottom: 10,
              }}
            >
              {tickers.slice(0, Math.min(tickers.length, Math.max(3, layout.infoHub.colEnd - layout.infoHub.colStart + 1))).map((row) => (
                <div key={row.symbol} style={{ background: 'rgba(255,255,255,0.14)', padding: '8px 10px', minHeight: 72 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>{row.symbol}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{row.last.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: row.chgPct >= 0 ? '#0f5132' : '#7f1d1d' }}>
                    {row.chgPct >= 0 ? '+' : ''}{row.chgPct.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(kpiCards.length, Math.max(3, layout.infoHub.colEnd - layout.infoHub.colStart))}, minmax(0, 1fr))`,
                gap: 8,
                flex: 1,
              }}
            >
              {kpiCards.slice(0, Math.min(kpiCards.length, Math.max(3, layout.infoHub.colEnd - layout.infoHub.colStart))).map((card) => (
                <div key={card.label} style={{ background: 'rgba(255,255,255,0.14)', padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: '#111', fontWeight: 700 }}>{card.label}</div>
                  <div style={{ fontSize: 24, color: card.tone, fontWeight: 700 }}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              ...basePanel,
              ...areaStyle(layout.positions),
              background: '#4d84da',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="panel-head">
              <span>{expanded.positions ? 'POSITIONS - EXPANDED' : 'POSITIONS - COLLAPSED'}</span>
              <button onClick={() => togglePanel('positions')}>{expanded.positions ? 'âˆ’' : '+'}</button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <PositionsPanel />
            </div>
          </div>

          <div
            style={{
              ...basePanel,
              ...areaStyle(layout.scanners),
              background: '#e1ca68',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="panel-head">
              <span>{expanded.scanners ? 'SCANNERS - EXPANDED' : 'SCANNERS - COLLAPSED'}</span>
              <button onClick={() => togglePanel('scanners')}>{expanded.scanners ? 'âˆ’' : '+'}</button>
            </div>
            <div className="panel-stack">
              <div className="stack-box">ENTRY SCANNER</div>
              <div className="stack-box">VOL SURFACE</div>
              <div className="stack-box">ROLL SCANNER</div>
            </div>
          </div>

          <div
            style={{
              ...basePanel,
              ...areaStyle(layout.newPanel2),
              background: '#2fc8d3',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="panel-head">
              <span>{expanded.newPanel2 ? 'NEW PANEL 2 - EXPANDED' : 'NEW PANEL 2 - COLLAPSED'}</span>
              <button onClick={() => togglePanel('newPanel2')}>{expanded.newPanel2 ? 'âˆ’' : '+'}</button>
            </div>
            <div className="panel-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
