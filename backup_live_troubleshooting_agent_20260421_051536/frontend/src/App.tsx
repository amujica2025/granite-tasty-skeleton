import { useEffect, useMemo, useRef, useState } from 'react';
import PositionsPanel from './components/PositionsPanel';
import AlertsPanel from './components/alerts/AlertsPanel';
import ScannerPanel from './components/scanner/ScannerPanel';
import WatchlistPanel from './components/watchlist/WatchlistPanel';
import JournalPopup from './components/journal/JournalPopup';
import ArtifactModal from './components/artifact/ArtifactModal';
import { useArtifactStore } from './components/artifact/useArtifactStore';

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

type InfoHubCard = {
  card_id: string;
  title: string;
  subtitle: string;
  value: string;
  secondary_value: string;
  priority: 'low' | 'medium' | 'high';
  series: number[];
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

const formatSignedPct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const createSpark = (base: number) => [base * 0.99, base * 1.01, base];
const getPriorityRank = (priority: InfoHubCard['priority']) =>
  priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;

export default function App() {
  const [netLiq, setNetLiq] = useState<number | null>(null);
  const [bp, setBp] = useState<number | null>(null);
  const [watchlistRows, setWatchlistRows] = useState<WatchlistRow[]>(watchlistSeed);
  const [expanded, setExpanded] = useState<PanelState>({
    newPanel: false,
    watchlist: false,
    positions: false,
    scanners: false,
    newPanel2: false,
  });
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const artifactStore = useArtifactStore();

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
              null,
          );
        }
      } catch (error) {
        console.error('Failed to fetch balances:', error);
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
        if (msg.type !== 'RawFeed' || !msg.data || msg.data.type !== 'FEED_DATA') return;
        const feed = msg.data.data;
        if (feed[0] !== 'Quote') return;

        const values = Array.isArray(feed[1]) ? feed[1] : [];
        const map: Record<string, { bid: number; ask: number }> = {};
        for (let i = 0; i < values.length; i += 5) {
          map[values[i]] = {
            bid: values[i + 1],
            ask: values[i + 2],
          };
        }

        setWatchlistRows((prev) =>
          prev.map((row) => {
            const quote = map[row.symbol];
            if (!quote || typeof quote.bid !== 'number' || typeof quote.ask !== 'number') {
              return row;
            }
            const mid = Number(((quote.bid + quote.ask) / 2).toFixed(2));
            return Number.isFinite(mid) ? { ...row, latest: mid } : row;
          }),
        );
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
      el.scrollLeft = Math.max(0, (worldWidth - viewWidth) / 2);
    };

    centerDefaultField();
    const timeoutId = setTimeout(centerDefaultField, 50);
    window.addEventListener('resize', centerDefaultField);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', centerDefaultField);
    };
  }, [expanded]);

  const applyPreset = (preset: 'default' | 'preset2' | 'preset3') => {
    if (preset === 'default') {
      setExpanded({ newPanel: false, watchlist: false, positions: false, scanners: false, newPanel2: false });
      return;
    }
    if (preset === 'preset2') {
      setExpanded({ newPanel: true, watchlist: true, positions: false, scanners: true, newPanel2: true });
      return;
    }
    setExpanded({ newPanel: true, watchlist: false, positions: true, scanners: false, newPanel2: true });
  };

  const togglePanel = (panel: keyof PanelState) => {
    setExpanded((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const infoHubCards = useMemo<InfoHubCard[]>(() => {
    const cards: InfoHubCard[] = [
      {
        card_id: 'kpi_netliq',
        title: 'Net Liq',
        subtitle: 'System KPI',
        value: netLiq !== null ? `$${netLiq.toLocaleString()}` : '—',
        secondary_value: 'Live',
        priority: 'medium',
        series: netLiq !== null ? createSpark(netLiq) : [],
      },
      {
        card_id: 'kpi_bp',
        title: 'BP',
        subtitle: 'System KPI',
        value: bp !== null ? `$${bp.toLocaleString()}` : '—',
        secondary_value: 'Live',
        priority: 'medium',
        series: bp !== null ? createSpark(bp) : [],
      },
      {
        card_id: 'kpi_25x',
        title: '25x Limit',
        subtitle: 'Derived',
        value: netLiq !== null ? `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—',
        secondary_value: 'Rule',
        priority: 'low',
        series: netLiq !== null ? createSpark(netLiq * 25) : [],
      },
    ];

    watchlistRows.slice(0, 4).forEach((row) => {
      cards.push({
        card_id: `symbol_${row.symbol}`,
        title: row.symbol,
        subtitle: 'Live Quote',
        value: `$${row.latest.toFixed(2)}`,
        secondary_value: formatSignedPct(row.pctChange),
        priority: Math.abs(row.pctChange) >= 1 ? 'high' : 'low',
        series: createSpark(row.latest),
      });
    });

    return cards.sort((a, b) => {
      const priorityDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
      return priorityDiff !== 0 ? priorityDiff : a.title.localeCompare(b.title);
    });
  }, [bp, netLiq, watchlistRows]);

  const infoHubSpan = layout.infoHub.colEnd - layout.infoHub.colStart;
  const visibleInfoHubCards = infoHubCards.slice(0, expanded.positions ? Math.max(3, infoHubSpan) : Math.max(4, infoHubSpan + 1));

  return (
    <>
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
              onClick={() => setIsJournalOpen(true)}
              style={{ border: '1px solid #2a2a2a', background: '#080808', color: '#ddd', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
            >
              Journal
            </button>
            <button
              onClick={() => artifactStore.openArtifact({ symbol: 'SPY', source: { type: 'synthetic' } })}
              style={{ border: '1px solid #2a2a2a', background: '#080808', color: '#ddd', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
            >
              Artifact Test
            </button>
            <button
              onClick={() => applyPreset('default')}
              style={{ border: '1px solid #2a2a2a', background: !expanded.newPanel && !expanded.watchlist && !expanded.positions && !expanded.scanners && !expanded.newPanel2 ? '#1f1f1f' : '#080808', color: '#ddd', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
            >
              Default State
            </button>
            <button
              onClick={() => applyPreset('preset2')}
              style={{ border: '1px solid #2a2a2a', background: expanded.newPanel && expanded.watchlist && expanded.scanners && expanded.newPanel2 && !expanded.positions ? '#1f1f1f' : '#080808', color: '#ddd', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
            >
              Outer + Watchlist/Scanners
            </button>
            <button
              onClick={() => applyPreset('preset3')}
              style={{ border: '1px solid #2a2a2a', background: expanded.newPanel && expanded.positions && expanded.newPanel2 && !expanded.watchlist && !expanded.scanners ? '#1f1f1f' : '#080808', color: '#ddd', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
            >
              Outer + Positions
            </button>
          </div>
        </div>

        <div ref={viewportRef} style={{ height: 'calc(100vh - 34px)', overflowX: 'auto', overflowY: 'hidden', background: '#0a0a0a' }}>
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
            <div style={{ ...basePanel, ...areaStyle(layout.newPanel), background: '#fd18fa', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-head">
                <span>{expanded.newPanel ? 'ALERT CENTER - EXPANDED' : 'ALERT CENTER - COLLAPSED'}</span>
                <button onClick={() => togglePanel('newPanel')}>{expanded.newPanel ? '−' : '+'}</button>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <AlertsPanel
                  quoteRows={watchlistRows.map((row) => ({ symbol: row.symbol, latest: row.latest, pctChange: row.pctChange }))}
                />
              </div>
            </div>

            <div style={{ ...basePanel, ...areaStyle(layout.watchlist), background: '#15e80f', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-head">
                <span>{expanded.watchlist ? 'WATCHLIST - EXPANDED' : 'WATCHLIST - COLLAPSED'}</span>
                <button onClick={() => togglePanel('watchlist')}>{expanded.watchlist ? '−' : '+'}</button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <WatchlistPanel onLaunchArtifact={(payload: { symbol: string }) => artifactStore.openArtifact({ symbol: payload.symbol, source: { type: 'synthetic' } })} />
              </div>
            </div>

            <div style={{ ...basePanel, ...areaStyle(layout.infoHub), background: '#ff2618', display: 'flex', flexDirection: 'column', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, color: '#111' }}>
                <div style={{ fontWeight: 700, fontSize: 24 }}>INFO HUB</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{visibleInfoHubCards.length} cards</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(visibleInfoHubCards.length || 1, expanded.positions ? Math.max(1, infoHubSpan) : Math.max(2, infoHubSpan))}, minmax(0, 1fr))`, gap: 8, flex: 1, alignContent: 'start' }}>
                {visibleInfoHubCards.map((card) => (
                  <div key={card.card_id} style={{ background: 'rgba(255,255,255,0.14)', borderLeft: card.priority === 'high' ? '3px solid rgba(127, 29, 29, 0.8)' : card.priority === 'medium' ? '3px solid rgba(120, 53, 15, 0.7)' : '3px solid rgba(17, 24, 39, 0.35)', padding: expanded.positions ? '8px 10px' : '10px 12px', minHeight: expanded.positions ? 72 : 96, display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: expanded.positions ? 11 : 12, fontWeight: 700, color: '#111' }}>{card.title}</div>
                      <div style={{ fontSize: 10, color: '#111', opacity: 0.82 }}>{card.subtitle}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: expanded.positions ? 22 : 28, fontWeight: 700, color: '#111', lineHeight: 1 }}>{card.value}</div>
                      {!expanded.positions && card.series.length > 0 ? (
                        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 26 }}>
                          {card.series.map((point, index) => {
                            const base = Math.max(...card.series, 1);
                            const height = Math.max(4, Math.round((point / base) * 24));
                            return <div key={`${card.card_id}_${index}`} style={{ width: 6, height, background: 'rgba(17,17,17,0.6)' }} />;
                          })}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: card.secondary_value.startsWith('+') ? '#0f5132' : card.secondary_value.startsWith('-') ? '#7f1d1d' : '#111', marginTop: 6 }}>{card.secondary_value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...basePanel, ...areaStyle(layout.positions), background: '#4d84da', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-head">
                <span>{expanded.positions ? 'POSITIONS - EXPANDED' : 'POSITIONS - COLLAPSED'}</span>
                <button onClick={() => togglePanel('positions')}>{expanded.positions ? '−' : '+'}</button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <PositionsPanel />
              </div>
            </div>

            <div style={{ ...basePanel, ...areaStyle(layout.scanners), background: '#e1ca68', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-head">
                <span>{expanded.scanners ? 'SCANNERS - EXPANDED' : 'SCANNERS - COLLAPSED'}</span>
                <button onClick={() => togglePanel('scanners')}>{expanded.scanners ? '−' : '+'}</button>
              </div>
              <div className="panel-stack" style={{ minHeight: 0 }}>
                <div className="stack-box" style={{ alignItems: 'stretch', justifyContent: 'stretch', padding: 0 }}>
                  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                    <ScannerPanel />
                  </div>
                </div>
                <div className="stack-box">VOL SURFACE</div>
                <div className="stack-box">ROLL SCANNER</div>
              </div>
            </div>

            <div style={{ ...basePanel, ...areaStyle(layout.newPanel2), background: '#2fc8d3', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-head">
                <span>{expanded.newPanel2 ? 'NEW PANEL 2 - EXPANDED' : 'NEW PANEL 2 - COLLAPSED'}</span>
                <button onClick={() => togglePanel('newPanel2')}>{expanded.newPanel2 ? '−' : '+'}</button>
              </div>
              <div className="panel-fill" style={{ padding: 10, color: '#082f33', fontSize: 11, display: 'grid', alignContent: 'start', gap: 6 }}>
                <div style={{ fontWeight: 700 }}>SYSTEM COUNTS</div>
                <div>Watchlist rows: {watchlistRows.length}</div>
                <div>Scanner mode: Live panel mounted</div>
                <div>Journal popup: {isJournalOpen ? 'Open' : 'Closed'}</div>
                <div>Artifact modal: {artifactStore.open ? 'Open' : 'Closed'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <JournalPopup open={isJournalOpen} onClose={() => setIsJournalOpen(false)} prefill={null} />
      <ArtifactModal open={artifactStore.open} payload={artifactStore.payload} onClose={artifactStore.closeArtifact} />
    </>
  );
}
