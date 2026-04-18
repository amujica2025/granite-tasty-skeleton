import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import PositionsPanel from './components/PositionsPanel';

type LayoutState = 'default' | 'sides_bundle' | 'outer_plus_positions';

type WatchlistRow = {
  symbol: string;
  latest: number;
  pctChange: number;
  ivPctl: number;
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
  { symbol: 'SPY', latest: 710.52, pctChange: -0.42, ivPctl: 31 },
  { symbol: 'QQQ', latest: 649.93, pctChange: -0.21, ivPctl: 34 },
  { symbol: 'IWM', latest: 201.64, pctChange: -0.66, ivPctl: 43 },
  { symbol: 'TSLA', latest: 400.16, pctChange: -1.81, ivPctl: 68 },
  { symbol: 'NVDA', latest: 201.33, pctChange: -2.26, ivPctl: 64 },
  { symbol: 'SPX', latest: 5208.43, pctChange: 0.17, ivPctl: 27 },
];

const tickerSeed: TickerCard[] = [
  { symbol: 'SPY', last: 710.52, chgPct: -1.67 },
  { symbol: 'AAPL', last: 270.06, chgPct: -0.17 },
  { symbol: 'QQQ', last: 648.93, chgPct: -0.27 },
  { symbol: 'TSLA', last: 400.16, chgPct: -1.81 },
  { symbol: 'NVDA', last: 201.33, chgPct: -2.26 },
  { symbol: 'SPX', last: 5208.43, chgPct: 0.17 },
  { symbol: 'VIX', last: 15.83, chgPct: 2.10 },
];

const worldColumns = ['-B', '-A', 'A', 'B', 'C', 'D', 'E', 'F', '+A', '+B'];
const worldRows = ['1', '2', '3', '4', '5', '6'];
const areaStyle = (area: GridArea): CSSProperties => ({
  gridColumn: `${area.colStart} / ${area.colEnd}`,
  gridRow: `${area.rowStart} / ${area.rowEnd}`,
});

export default function App() {
  const [layoutState, setLayoutState] = useState<LayoutState>('default');
  const [netLiq, setNetLiq] = useState<number | null>(null);
  const [bp, setBp] = useState<number | null>(null);
  const [watchlistRows, setWatchlistRows] = useState<WatchlistRow[]>(watchlistSeed);
  const [tickers, setTickers] = useState<TickerCard[]>(tickerSeed);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/balances');
        const data = await res.json();
        if (data?.balances?.length > 0) {
          const row = data.balances[0];
          setNetLiq(row.net_liquidating_value ?? null);
          setBp(
            row.option_buying_power ??
              row.derivatives_buying_power ??
              row.buying_power ??
              row.cash_available_to_trade ??
              null,
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
        if (msg.type === 'RawFeed' && msg.data?.type === 'FEED_DATA') {
          const feed = msg.data.data;
          if (feed[0] === 'Quote') {
            const values = feed[1];
            const map: Record<string, { bid: number; ask: number }> = {};
            for (let i = 0; i < values.length; i += 5) {
              map[values[i]] = { bid: values[i + 1], ask: values[i + 2] };
            }
            const nextMid = (symbol: string, fallback: number) => {
              const q = map[symbol];
              if (!q || typeof q.bid !== 'number' || typeof q.ask !== 'number') return fallback;
              const mid = (q.bid + q.ask) / 2;
              return Number.isFinite(mid) ? Number(mid.toFixed(2)) : fallback;
            };
            setWatchlistRows((prev) => prev.map((row) => ({ ...row, latest: nextMid(row.symbol, row.latest) })));
            setTickers((prev) => prev.map((row) => ({ ...row, last: nextMid(row.symbol, row.last) })));
          }
        }
      } catch {
        console.log('Quote parse error');
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const centerDefaultField = () => {
      const worldWidth = el.scrollWidth;
      const viewWidth = el.clientWidth;
      const centeredLeft = Math.max(0, (worldWidth - viewWidth) / 2);
      el.scrollLeft = centeredLeft;
      el.scrollTop = 0;
    };

    centerDefaultField();
    const t = setTimeout(centerDefaultField, 60);
    window.addEventListener('resize', centerDefaultField);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', centerDefaultField);
    };
  }, []);

  const layout = layouts[layoutState];
  const watchlistExpanded = layoutState === 'sides_bundle';

  const kpiCards = useMemo(
    () => [
      { label: 'NET LIQ', value: netLiq !== null ? `$${netLiq.toLocaleString()}` : 'â€”' },
      { label: 'BP', value: bp !== null ? `$${bp.toLocaleString()}` : 'â€”' },
      { label: '25X', value: netLiq !== null ? `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'â€”' },
      { label: 'PRESET', value: layoutState === 'default' ? 'All Collapsed' : layoutState === 'sides_bundle' ? 'Sides Bundle' : 'Outer + Positions' },
      { label: 'VIEW', value: layoutState },
    ],
    [bp, layoutState, netLiq],
  );

  const shell: CSSProperties = {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#cfcfcf',
    color: '#0b0b0b',
  };

  const topBar: CSSProperties = {
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    borderBottom: '1px solid #7f6c6c',
    background: '#d7d7d7',
    flexShrink: 0,
    fontSize: 12,
  };

  const buttonStyle = (active: boolean): CSSProperties => ({
    border: '1px solid #1a1a1a',
    background: active ? '#101010' : '#f2f2f2',
    color: active ? '#ffffff' : '#000000',
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  });

  const viewport: CSSProperties = {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
  };

  const world: CSSProperties = {
    width: 4720,
    minWidth: 4720,
    height: 1520,
    position: 'relative',
    padding: '32px 100px 72px 100px',
  };

  const canvasWrap: CSSProperties = {
    position: 'relative',
    width: 4360,
    height: 1320,
    margin: '0 auto',
  };

  const grid: CSSProperties = {
    position: 'absolute',
    left: 300,
    top: 110,
    width: 3760,
    height: 1120,
    display: 'grid',
    gridTemplateColumns: '260px 520px 520px 300px 520px 520px 520px 420px 520px 260px',
    gridTemplateRows: 'repeat(6, 186px)',
    border: '2px solid #2d2d2d',
    background: '#d9d9d9',
  };

  const labelTopBase: CSSProperties = {
    position: 'absolute',
    top: 82,
    fontSize: 18,
    fontWeight: 700,
    color: '#111',
  };

  const labelLeftBase: CSSProperties = {
    position: 'absolute',
    left: 264,
    fontSize: 18,
    fontWeight: 700,
    color: '#111',
  };

  const panelBase: CSSProperties = {
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    border: '1px solid rgba(0,0,0,0.18)',
    overflow: 'hidden',
  };

  const title: CSSProperties = {
    fontSize: 34,
    fontWeight: 800,
    lineHeight: 1.05,
    textAlign: 'center',
  };

  const subtitle: CSSProperties = {
    fontSize: 24,
    marginTop: 8,
    textAlign: 'center',
  };

  return (
    <div style={shell}>
      <div style={topBar}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <strong style={{ fontSize: 18, letterSpacing: 0.5 }}>GRANITE TASTY</strong>
          <span style={{ fontSize: 12, color: '#555' }}>Locked default viewport with horizontal panning</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={buttonStyle(layoutState === 'default')} onClick={() => setLayoutState('default')}>Default</button>
          <button style={buttonStyle(layoutState === 'sides_bundle')} onClick={() => setLayoutState('sides_bundle')}>Outer + Watchlist/Scanners</button>
          <button style={buttonStyle(layoutState === 'outer_plus_positions')} onClick={() => setLayoutState('outer_plus_positions')}>Outer + Positions</button>
        </div>
      </div>

      <div ref={viewportRef} style={viewport}>
        <div style={world}>
          <div style={canvasWrap}>
            {worldColumns.map((col, index) => {
              const widths = [260, 520, 520, 300, 520, 520, 520, 420, 520, 260];
              const x = widths.slice(0, index).reduce((sum, w) => sum + w, 0);
              return (
                <div key={col} style={{ ...labelTopBase, left: 300 + x + widths[index] / 2 - 10 }}>
                  {col}
                </div>
              );
            })}

            {worldRows.map((row, index) => {
              const y = 110 + index * 186 + 86;
              return (
                <>
                  <div key={`l-${row}`} style={{ ...labelLeftBase, top: y }}>{row}</div>
                  <div key={`r-${row}`} style={{ position: 'absolute', right: 264, top: y, fontSize: 18, fontWeight: 700 }}>{row}</div>
                </>
              );
            })}

            <div style={grid}>
              <div style={{ ...panelBase, ...areaStyle(layout.newPanel), background: 'linear-gradient(180deg, #ff00ff 0%, #cf3ad8 100%)', padding: '28px 18px' }}>
                <div style={title}>New Panel</div>
                <div style={subtitle}>{layoutState === 'default' ? 'Collapsed' : 'Expanded'}</div>
              </div>

              <div style={{ ...panelBase, ...areaStyle(layout.watchlist), background: '#18ff00', padding: 16, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 30, fontWeight: 800, textAlign: 'center' }}>Watchlist</div>
                <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 12 }}>{watchlistExpanded ? 'Expanded' : 'Collapsed'}</div>
                {!watchlistExpanded ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', fontSize: 15, gap: 6 }}>
                    {['Symbol', 'Last', '% Chg', 'IV Pctl'].map((label) => (
                      <div key={label} style={{ fontWeight: 700 }}>{label}</div>
                    ))}
                    {watchlistRows.flatMap((row) => [
                      <div key={`${row.symbol}-s`}>{row.symbol}</div>,
                      <div key={`${row.symbol}-l`}>{row.latest.toFixed(2)}</div>,
                      <div key={`${row.symbol}-p`} style={{ color: row.pctChange >= 0 ? '#065f46' : '#991b1b' }}>{row.pctChange.toFixed(2)}%</div>,
                      <div key={`${row.symbol}-i`}>{row.ivPctl.toFixed(0)}</div>,
                    ])}
                  </div>
                ) : (
                  <div style={{ fontSize: 16, lineHeight: 1.45, overflow: 'auto', paddingRight: 8 }}>
                    {watchlistRows.map((row) => (
                      <div key={row.symbol} style={{ display: 'grid', gridTemplateColumns: '110px 100px 100px 100px', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.14)' }}>
                        <strong>{row.symbol}</strong>
                        <span>{row.latest.toFixed(2)}</span>
                        <span>{row.pctChange.toFixed(2)}%</span>
                        <span>{row.ivPctl.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ ...panelBase, ...areaStyle(layout.infoHub), background: '#ff2b17', padding: 18, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 34, fontWeight: 800, textAlign: 'center', marginBottom: 14 }}>Info Hub</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 14, marginBottom: 14 }}>
                  {tickers.map((card) => (
                    <div key={card.symbol} style={{ background: 'rgba(255,255,255,0.12)', padding: 16, minHeight: 104 }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{card.symbol}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>{card.last.toFixed(2)}</div>
                      <div style={{ fontSize: 18, color: card.chgPct >= 0 ? '#052e16' : '#7f1d1d' }}>{card.chgPct.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
                  {kpiCards.map((card) => (
                    <div key={card.label} style={{ background: 'rgba(255,255,255,0.12)', padding: 16, minHeight: 88 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{card.label}</div>
                      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{card.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...panelBase, ...areaStyle(layout.positions), background: '#4f88df', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 34, fontWeight: 800, textAlign: 'center', paddingTop: 10 }}>Positions Panel</div>
                <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}>{layoutState === 'outer_plus_positions' ? 'Expanded' : 'Collapsed'}</div>
                <div style={{ flex: 1, margin: '8px 10px 10px', background: '#030303', border: '1px solid rgba(255,255,255,0.12)', overflow: 'auto' }}>
                  <PositionsPanel />
                </div>
              </div>

              <div style={{ ...panelBase, ...areaStyle(layout.scanners), background: '#e6cf6d', padding: 12, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 30, fontWeight: 800, textAlign: 'center' }}>Scanners</div>
                <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 14 }}>{layoutState === 'sides_bundle' ? 'Expanded' : 'Collapsed'}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {['Entry Scanner', 'Roll Scanner', 'Vol Context'].map((label) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.18)', padding: '22px 12px', textAlign: 'center', fontSize: 18, fontWeight: 700 }}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...panelBase, ...areaStyle(layout.newPanel2), background: '#2ecdd6', padding: '28px 18px' }}>
                <div style={title}>New Panel 2</div>
                <div style={subtitle}>{layoutState === 'default' ? 'Collapsed' : 'Expanded'}</div>
              </div>
            </div>

            <div style={{ position: 'absolute', left: 660, top: 1244, width: 2280, height: 12, background: '#31b44b' }} />
            <div style={{ position: 'absolute', left: 1600, top: 1264, fontSize: 14, color: '#8ba96b' }}>
              DEFAULT LOAD VIEW REPRESENTED BY THE GREEN BAR ABOVE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
