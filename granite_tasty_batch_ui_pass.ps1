# granite_tasty_batch_ui_pass.ps1
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
        $backup = "$path.bak_$timestamp"
        Copy-Item $path $backup -Force
        Write-Host "Backup created: $backup" -ForegroundColor Yellow
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

type BalanceSnapshot = {
  netLiq: number | null;
  bp: number | null;
};

type MarqueeItem = {
  symbol: string;
  last: number;
  chgPct: number;
};

const watchlistSeed: WatchlistRow[] = [
  {
    symbol: 'SPY',
    latest: 513.24,
    pctChange: 0.42,
    relStr14d: 57.1,
    ivPctl: 31.0,
    ivHv: 1.08,
    impVol: 15.4,
    iv5d: 14.6,
    iv1m: 15.2,
    iv3m: 16.4,
    iv6m: 17.1,
    bbPct: 62.0,
    bbRank: 58.0,
    ttmSqueeze: 'Off',
    adr14d: 7.2,
    optionsVol: 2450000,
    totalVol1m: 19400000,
    callVol: 1290000,
    putVol: 1160000,
  },
  {
    symbol: 'QQQ',
    latest: 441.82,
    pctChange: -0.21,
    relStr14d: 49.2,
    ivPctl: 34.0,
    ivHv: 1.11,
    impVol: 18.2,
    iv5d: 17.9,
    iv1m: 18.0,
    iv3m: 19.5,
    iv6m: 20.3,
    bbPct: 48.0,
    bbRank: 44.0,
    ttmSqueeze: 'On',
    adr14d: 8.8,
    optionsVol: 1840000,
    totalVol1m: 13800000,
    callVol: 910000,
    putVol: 930000,
  },
  {
    symbol: 'IWM',
    latest: 201.64,
    pctChange: 0.66,
    relStr14d: 61.2,
    ivPctl: 43.0,
    ivHv: 1.22,
    impVol: 22.4,
    iv5d: 21.8,
    iv1m: 22.2,
    iv3m: 24.0,
    iv6m: 25.6,
    bbPct: 68.0,
    bbRank: 65.0,
    ttmSqueeze: 'Off',
    adr14d: 4.9,
    optionsVol: 621000,
    totalVol1m: 4550000,
    callVol: 308000,
    putVol: 313000,
  },
  {
    symbol: 'TSLA',
    latest: 172.31,
    pctChange: 1.81,
    relStr14d: 72.4,
    ivPctl: 68.0,
    ivHv: 1.36,
    impVol: 48.5,
    iv5d: 45.0,
    iv1m: 46.8,
    iv3m: 50.9,
    iv6m: 55.1,
    bbPct: 77.0,
    bbRank: 74.0,
    ttmSqueeze: 'Off',
    adr14d: 9.1,
    optionsVol: 1310000,
    totalVol1m: 11300000,
    callVol: 690000,
    putVol: 620000,
  },
  {
    symbol: 'NVDA',
    latest: 880.44,
    pctChange: 2.26,
    relStr14d: 78.5,
    ivPctl: 64.0,
    ivHv: 1.19,
    impVol: 41.7,
    iv5d: 40.2,
    iv1m: 41.1,
    iv3m: 43.9,
    iv6m: 46.2,
    bbPct: 82.0,
    bbRank: 79.0,
    ttmSqueeze: 'Off',
    adr14d: 28.2,
    optionsVol: 2100000,
    totalVol1m: 16200000,
    callVol: 1180000,
    putVol: 920000,
  },
  {
    symbol: 'SPX',
    latest: 5208.43,
    pctChange: 0.17,
    relStr14d: 54.8,
    ivPctl: 27.0,
    ivHv: 1.02,
    impVol: 14.7,
    iv5d: 13.9,
    iv1m: 14.4,
    iv3m: 15.8,
    iv6m: 16.9,
    bbPct: 51.0,
    bbRank: 49.0,
    ttmSqueeze: 'On',
    adr14d: 61.0,
    optionsVol: 0,
    totalVol1m: 0,
    callVol: 0,
    putVol: 0,
  },
];

const topMarqueeSeed: MarqueeItem[] = [
  { symbol: 'SPY', last: 513.24, chgPct: 0.42 },
  { symbol: 'AAPL', last: 189.81, chgPct: 0.71 },
  { symbol: 'QQQ', last: 441.82, chgPct: -0.21 },
  { symbol: 'TSLA', last: 172.31, chgPct: 1.81 },
  { symbol: 'NVDA', last: 880.44, chgPct: 2.26 },
  { symbol: 'IWM', last: 201.64, chgPct: 0.66 },
  { symbol: 'DIA', last: 389.54, chgPct: -0.12 },
  { symbol: 'VIX', last: 15.83, chgPct: -2.05 },
];

const formatCompact = (value: number) =>
  Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const heatColor = (value: number, min: number, max: number) => {
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));
  const alpha = 0.10 + ratio * 0.38;
  return `rgba(245, 158, 11, ${alpha.toFixed(3)})`;
};

function App() {
  const [balances, setBalances] = useState<BalanceSnapshot>({ netLiq: null, bp: null });
  const [watchlistExpanded, setWatchlistExpanded] = useState(false);
  const [watchlistRows, setWatchlistRows] = useState<WatchlistRow[]>(watchlistSeed);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>(topMarqueeSeed);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/balances');
        const data = await res.json();

        if (data.balances && data.balances.length > 0) {
          const row = data.balances[0];
          setBalances({
            netLiq: row.net_liquidating_value ?? null,
            bp:
              row.option_buying_power ??
              row.derivatives_buying_power ??
              row.buying_power ??
              row.cash_available_to_trade ??
              null,
          });
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

    ws.onopen = () => console.log('✅ Market WS connected');

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
              map[symbol] = {
                bid: values[i + 1],
                ask: values[i + 2],
              };
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
              }),
            );

            setMarqueeItems((prev) =>
              prev.map((row) => {
                const quote = map[row.symbol];
                if (!quote) return row;
                const mid =
                  typeof quote.bid === 'number' && typeof quote.ask === 'number'
                    ? (quote.bid + quote.ask) / 2
                    : row.last;

                return {
                  ...row,
                  last: Number.isFinite(mid) ? Number(mid.toFixed(2)) : row.last,
                };
              }),
            );
          }
        }
      } catch (e) {
        console.log('❌ Quote parse error');
      }
    };

    ws.onclose = () => console.log('⚠️ Market WS closed');
    ws.onerror = () => console.log('❌ Market WS error');

    return () => ws.close();
  }, []);

  const totalLongOptionsBalance = useMemo(() => 1155 + 0 + 0, []);
  const totalShortOptionsBalance = useMemo(() => 6175 + 1780, []);

  const shellStyle: React.CSSProperties = {
    background: '#050505',
    color: '#ffffff',
    minHeight: '100vh',
    height: '100vh',
    padding: '8px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
    overflow: 'hidden',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `${watchlistExpanded ? '312px' : '76px'} 420px minmax(720px, 1fr) 420px`,
    gridTemplateRows: '118px minmax(0, 1fr)',
    gap: '8px',
    width: '100%',
    height: '100%',
  };

  const panelStyle: React.CSSProperties = {
    background: '#111111',
    border: '1px solid #242424',
    borderRadius: '10px',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#8f8f8f',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  };

  const topBoxStyle: React.CSSProperties = {
    ...panelStyle,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={shellStyle}>
      <div style={gridStyle}>
        {/* FAR LEFT WATCHLIST */}
        <div
          style={{
            ...panelStyle,
            gridColumn: '1 / 2',
            gridRow: '1 / 3',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid #242424',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <button
              onClick={() => setWatchlistExpanded((prev) => !prev)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #333',
                background: '#0b0b0b',
                color: '#d4d4d4',
                cursor: 'pointer',
              }}
              title={watchlistExpanded ? 'Collapse watchlist' : 'Expand watchlist'}
            >
              {watchlistExpanded ? '«' : '»'}
            </button>

            {watchlistExpanded && (
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#efefef' }}>
                weeklys
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {!watchlistExpanded ? (
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
              <div style={{ minWidth: '1120px' }}>
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
                      <div style={{ padding: '8px 6px', background: heatColor(row.impVol, termMin, termMax) }}>
                        {row.impVol.toFixed(1)}
                      </div>
                      <div style={{ padding: '8px 6px', background: heatColor(row.iv5d, termMin, termMax) }}>
                        {row.iv5d.toFixed(1)}
                      </div>
                      <div style={{ padding: '8px 6px', background: heatColor(row.iv1m, termMin, termMax) }}>
                        {row.iv1m.toFixed(1)}
                      </div>
                      <div style={{ padding: '8px 6px', background: heatColor(row.iv3m, termMin, termMax) }}>
                        {row.iv3m.toFixed(1)}
                      </div>
                      <div style={{ padding: '8px 6px', background: heatColor(row.iv6m, termMin, termMax) }}>
                        {row.iv6m.toFixed(1)}
                      </div>
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

        {/* KPI TRACKING */}
        <div style={{ ...topBoxStyle, gridColumn: '2 / 3', gridRow: '1 / 2' }}>
          <div style={sectionTitleStyle}>KPI / Rev Tracking</div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              flex: 1,
            }}
          >
            {[
              ['Net Liq', balances.netLiq !== null ? `$${balances.netLiq.toLocaleString()}` : '—', '#22c55e'],
              ['BP', balances.bp !== null ? `$${balances.bp.toLocaleString()}` : '—', '#60a5fa'],
              [
                '25x',
                balances.netLiq !== null
                  ? `$${(balances.netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : '—',
                '#f59e0b',
              ],
              ['Longs', `$${totalLongOptionsBalance.toLocaleString()}`, '#d4d4d4'],
              ['Shorts', `$${totalShortOptionsBalance.toLocaleString()}`, '#d4d4d4'],
              ['Selected BP', '$0', '#eab308'],
            ].map(([label, value, color]) => (
              <div
                key={label}
                style={{
                  background: '#090909',
                  border: '1px solid #232323',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '10px', color: '#8f8f8f', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MARQUEE / SNAPSHOT */}
        <div style={{ ...topBoxStyle, gridColumn: '3 / 4', gridRow: '1 / 2' }}>
          <div style={sectionTitleStyle}>Marquee Chart + Quote</div>

          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateRows: '30px 1fr',
              gap: '8px',
            }}
          >
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                border: '1px solid #232323',
                borderRadius: '8px',
                background: '#090909',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  gap: '24px',
                  paddingLeft: '18px',
                  animation: 'scrollTicker 26s linear infinite',
                }}
              >
                {marqueeItems.concat(marqueeItems).map((item, i) => (
                  <div key={`${item.symbol}-${i}`} style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 700, marginRight: '6px' }}>{item.symbol}</span>
                    <span style={{ marginRight: '6px' }}>{item.last.toFixed(2)}</span>
                    <span style={{ color: item.chgPct >= 0 ? '#22c55e' : '#ef4444' }}>
                      {item.chgPct >= 0 ? '+' : ''}
                      {item.chgPct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #232323',
                borderRadius: '8px',
                background:
                  'linear-gradient(180deg, rgba(12,12,12,1) 0%, rgba(7,7,7,1) 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '20px',
                  right: '20px',
                  top: '28px',
                  height: '1px',
                  background: 'rgba(245, 158, 11, 0.85)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '20px',
                  right: '20px',
                  bottom: '28px',
                  height: '1px',
                  background: 'rgba(245, 158, 11, 0.85)',
                }}
              />
              <svg viewBox="0 0 400 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  points="0,56 24,52 48,50 72,46 96,48 120,40 144,42 168,36 192,34 216,30 240,32 264,24 288,28 312,20 336,18 360,14 400,22"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* SMALL TOP TILES */}
        <div
          style={{
            gridColumn: '4 / 5',
            gridRow: '1 / 2',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '8px',
          }}
        >
          {['Mover 1', 'Mover 2', 'Index 1', 'Index 2'].map((label) => (
            <div key={label} style={{ ...panelStyle, padding: '10px' }}>
              <div style={sectionTitleStyle}>{label}</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>—</div>
            </div>
          ))}
        </div>

        {/* CENTER POSITIONS */}
        <div
          style={{
            gridColumn: '2 / 4',
            gridRow: '2 / 3',
            minWidth: 0,
            minHeight: 0,
            ...panelStyle,
          }}
        >
          <PositionsPanel netLiq={balances.netLiq} />
        </div>

        {/* FAR RIGHT */}
        <div
          style={{
            gridColumn: '4 / 5',
            gridRow: '2 / 3',
            display: 'grid',
            gridTemplateRows: '1fr 1fr',
            gap: '8px',
            minHeight: 0,
          }}
        >
          <div style={{ ...panelStyle, padding: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={sectionTitleStyle}>Vol Surface</div>
            <div
              style={{
                flex: 1,
                borderRadius: '8px',
                border: '1px solid #202020',
                background: '#080808',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00b7ff',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              VOL SURFACE
            </div>
          </div>

          <div style={{ ...panelStyle, padding: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={sectionTitleStyle}>Entry Scanner</div>
            <div
              style={{
                flex: 1,
                borderRadius: '8px',
                border: '1px solid #202020',
                background: '#080808',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff2244',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              ENTRY SCANNER
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default App;

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
      {
        id: '1',
        symbol: 'SPY 240620C550',
        qty: -5,
        iv: 18.4,
        mark: 12.35,
        markChng: -0.45,
        tradePrice: 12.8,
        high: 13.2,
        low: 12.1,
        plOpen: -225,
        cost: 6400,
        netLiq: -6175,
        bpEffect: 1250,
        intVal: 0,
        dte: 65,
        exDate: '2024-06-20',
        theta: -8.2,
        delta: 0.62,
        gamma: 0.012,
        sector: 'Equity',
        industry: 'Broad Market',
        subIndustry: 'ETF',
      },
      {
        id: '2',
        symbol: 'AAPL 240517P180',
        qty: 3,
        iv: 24.7,
        mark: 3.85,
        markChng: 0.65,
        tradePrice: 3.2,
        high: 4.1,
        low: 3.15,
        plOpen: 195,
        cost: 960,
        netLiq: 1155,
        bpEffect: -300,
        intVal: 0,
        dte: 31,
        exDate: '2024-05-17',
        theta: -4.1,
        delta: -0.38,
        gamma: 0.018,
        sector: 'Technology',
        industry: 'Consumer Electronics',
        subIndustry: 'Hardware',
      },
      {
        id: '3',
        symbol: 'QQQ 240628C460',
        qty: -2,
        iv: 21.3,
        mark: 8.9,
        markChng: -1.2,
        tradePrice: 10.1,
        high: 10.5,
        low: 8.7,
        plOpen: -240,
        cost: 2020,
        netLiq: -1780,
        bpEffect: 920,
        intVal: 0,
        dte: 73,
        exDate: '2024-06-28',
        theta: -6.8,
        delta: 0.55,
        gamma: 0.009,
        sector: 'Equity',
        industry: 'Broad Market',
        subIndustry: 'ETF',
      },
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
        borderRadius: '10px',
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
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '10px 6px',
                      color: pos.markChng >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {pos.markChng >= 0 ? '+' : ''}
                    {pos.markChng.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.tradePrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.high.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.low.toFixed(2)}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '10px 6px',
                      color: pos.plOpen >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {pos.plOpen >= 0 ? '+' : ''}
                    {pos.plOpen.toFixed(0)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.cost.toFixed(0)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 6px', fontWeight: 600 }}>
                    {pos.netLiq.toFixed(0)}
                  </td>
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
Write-Host "App.tsx and PositionsPanel.tsx updated." -ForegroundColor Green
Write-Host ""
Write-Host "Run next:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend; npm run build" -ForegroundColor White
Write-Host ""
Write-Host "Then if needed:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\backend; .\venv\Scripts\python main.py" -ForegroundColor White
