$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $repoRoot 'frontend'))) {
    throw "Run this installer from the repo root, or place it in the repo root first. Missing frontend folder."
}

$frontendSrc = Join-Path $repoRoot 'frontend\src'
$appFile = Join-Path $frontendSrc 'App.tsx'
$cssFile = Join-Path $frontendSrc 'index.css'

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = Join-Path $repoRoot ("backup_viewport_fix_" + $timestamp)
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Copy-Item $appFile (Join-Path $backupDir 'App.tsx.bak') -Force
Copy-Item $cssFile (Join-Path $backupDir 'index.css.bak') -Force

$appContent = @'
import { useEffect, useMemo, useRef, useState } from 'react';
import PositionsPanel from './components/PositionsPanel';

type LayoutState = 'default' | 'sides_bundle' | 'outer_plus_positions';

type RegionKey = 'newPanel' | 'watchlist' | 'infoHub' | 'positions' | 'scanners' | 'newPanel2';

type SpanMap = Record<RegionKey, number>;

type TickerCard = {
  symbol: string;
  last: number;
  chgPct: number;
};

const PRESETS: Record<LayoutState, { label: string; spans: SpanMap }> = {
  default: {
    label: 'Default',
    spans: {
      newPanel: 1,
      watchlist: 1,
      infoHub: 4,
      positions: 4,
      scanners: 1,
      newPanel2: 1,
    },
  },
  sides_bundle: {
    label: 'Outer + Watchlist/Scanners',
    spans: {
      newPanel: 2,
      watchlist: 2,
      infoHub: 2,
      positions: 2,
      scanners: 2,
      newPanel2: 2,
    },
  },
  outer_plus_positions: {
    label: 'Outer + Positions',
    spans: {
      newPanel: 2,
      watchlist: 1,
      infoHub: 4,
      positions: 4,
      scanners: 1,
      newPanel2: 2,
    },
  },
};

const tickerSeed: TickerCard[] = [
  { symbol: 'SPY', last: 710.52, chgPct: -1.47 },
  { symbol: 'AAPL', last: 270.06, chgPct: 0.71 },
  { symbol: 'QQQ', last: 648.93, chgPct: -0.27 },
  { symbol: 'TSLA', last: 400.16, chgPct: -1.81 },
  { symbol: 'NVDA', last: 201.33, chgPct: -2.26 },
  { symbol: 'SPX', last: 5208.43, chgPct: 0.17 },
  { symbol: 'VIX', last: 15.83, chgPct: 2.10 },
];

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function panelGridColumn(start: number, span: number) {
  return `${start} / ${start + span}`;
}

export default function App() {
  const [layoutState, setLayoutState] = useState<LayoutState>('default');
  const [netLiq, setNetLiq] = useState<number | null>(null);
  const [bp, setBp] = useState<number | null>(null);
  const [tickers, setTickers] = useState<TickerCard[]>(tickerSeed);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/balances');
        const data = await res.json();
        if (data.balances && data.balances.length > 0) {
          const row = data.balances[0];
          setNetLiq(Number(row.net_liquidating_value ?? null));
          setBp(
            Number(
              row.option_buying_power ??
                row.derivatives_buying_power ??
                row.buying_power ??
                row.cash_available_to_trade ??
                null,
            ),
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
            setTickers((prev) =>
              prev.map((row) => {
                const q = map[row.symbol];
                if (!q || typeof q.bid !== 'number' || typeof q.ask !== 'number') return row;
                const mid = (q.bid + q.ask) / 2;
                return Number.isFinite(mid) ? { ...row, last: Number(mid.toFixed(2)) } : row;
              }),
            );
          }
        }
      } catch {
        console.log('Quote parse error');
      }
    };
    return () => ws.close();
  }, []);

  const spans = PRESETS[layoutState].spans;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const centerDefaultField = () => {
      const worldWidth = el.scrollWidth;
      const viewWidth = el.clientWidth;
      const centeredLeft = Math.max(0, (worldWidth - viewWidth) / 2);
      el.scrollTo({ left: centeredLeft, behavior: 'auto' });
    };

    centerDefaultField();
    const t = setTimeout(centerDefaultField, 60);
    window.addEventListener('resize', centerDefaultField);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', centerDefaultField);
    };
  }, [layoutState]);

  const positionsTop = layoutState === 'outer_plus_positions' ? 2 : 4;
  const infoHubBottom = layoutState === 'outer_plus_positions' ? 2 : 4;

  const cards = useMemo(
    () => [
      { label: 'NET LIQ', value: netLiq !== null ? `$${netLiq.toFixed(2)}` : '—' },
      { label: 'BP', value: bp !== null ? `$${bp.toFixed(2)}` : '—' },
      { label: '25X', value: netLiq !== null ? `$${(netLiq * 25).toFixed(2)}` : '—' },
      { label: 'DEFAULT', value: 'All Collapsed' },
      { label: 'PRESET', value: PRESETS[layoutState].label },
    ],
    [bp, layoutState, netLiq],
  );

  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-left">
          <div className="brand">GRANITE TASTY</div>
          <div className="topbar-sub">Locked default viewport with horizontal panning</div>
        </div>
        <div className="topbar-right">
          <button
            className={layoutState === 'default' ? 'preset active' : 'preset'}
            onClick={() => setLayoutState('default')}
          >
            Default
          </button>
          <button
            className={layoutState === 'sides_bundle' ? 'preset active' : 'preset'}
            onClick={() => setLayoutState('sides_bundle')}
          >
            Outer + Watchlist/Scanners
          </button>
          <button
            className={layoutState === 'outer_plus_positions' ? 'preset active' : 'preset'}
            onClick={() => setLayoutState('outer_plus_positions')}
          >
            Outer + Positions
          </button>
        </div>
      </div>

      <div className="viewport" ref={viewportRef}>
        <div className="world">
          <div className="axis axis-top">
            <div className="axis-cell">-B</div>
            <div className="axis-cell">-A</div>
            <div className="axis-cell">A</div>
            <div className="axis-cell">B</div>
            <div className="axis-cell">C</div>
            <div className="axis-cell">D</div>
            <div className="axis-cell">E</div>
            <div className="axis-cell">F</div>
            <div className="axis-cell">+A</div>
            <div className="axis-cell">+B</div>
          </div>

          <div className="stage">
            <div className="y-axis left">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={`l-${n}`}>{n}</div>
              ))}
            </div>

            <div className="grid-world">
              <div className="gutter gutter-left" />
              <div className="gutter gutter-right" />

              <section
                className="panel magenta"
                style={{ gridColumn: panelGridColumn(2, spans.newPanel), gridRow: '1 / 7' }}
              >
                <div className="panel-title">New Panel</div>
                <div className="panel-sub">{spans.newPanel === 1 ? 'Collapsed' : 'Expanded'}</div>
              </section>

              <section
                className="panel green"
                style={{ gridColumn: panelGridColumn(2 + spans.newPanel, spans.watchlist), gridRow: '1 / 7' }}
              >
                <div className="panel-title">Watchlist</div>
                <div className="panel-sub">{spans.watchlist === 1 ? 'Collapsed' : 'Expanded'}</div>
                {spans.watchlist === 1 ? (
                  <div className="watchlist-mini">
                    <div className="watchlist-head">
                      <span>Symbol</span>
                      <span>Last</span>
                      <span>% Chg</span>
                      <span>IV Pctl</span>
                    </div>
                    {tickers.slice(0, 6).map((row, idx) => (
                      <div className="watchlist-row" key={`${row.symbol}-${idx}`}>
                        <span>{row.symbol}</span>
                        <span>{row.last.toFixed(2)}</span>
                        <span className={row.chgPct >= 0 ? 'up' : 'down'}>{fmtPct(row.chgPct)}</span>
                        <span>{Math.max(20, 31 + idx * 7)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="panel-placeholder">Expanded watchlist working field</div>
                )}
              </section>

              <section
                className="panel red"
                style={{
                  gridColumn: panelGridColumn(2 + spans.newPanel + spans.watchlist, spans.infoHub),
                  gridRow: `1 / ${infoHubBottom}`,
                }}
              >
                <div className="panel-title">Info Hub</div>
                <div className="ticker-row">
                  {tickers.map((card) => (
                    <div className="ticker-card" key={card.symbol}>
                      <div className="ticker-symbol">{card.symbol}</div>
                      <div className="ticker-last">{card.last.toFixed(2)}</div>
                      <div className={card.chgPct >= 0 ? 'ticker-chg up' : 'ticker-chg down'}>
                        {fmtPct(card.chgPct)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="kpi-row">
                  {cards.map((card) => (
                    <div className="kpi-card" key={card.label}>
                      <div className="kpi-label">{card.label}</div>
                      <div className="kpi-value">{card.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section
                className="panel blue"
                style={{
                  gridColumn: panelGridColumn(2 + spans.newPanel + spans.watchlist, spans.positions),
                  gridRow: `${positionsTop} / 7`,
                }}
              >
                <div className="panel-title">Positions Panel</div>
                <div className="panel-sub">{layoutState === 'outer_plus_positions' ? 'Expanded' : 'Collapsed'}</div>
                <div className="positions-wrap">
                  <PositionsPanel />
                </div>
              </section>

              <section
                className="panel sand"
                style={{
                  gridColumn: panelGridColumn(2 + spans.newPanel + spans.watchlist + spans.infoHub, spans.scanners),
                  gridRow: '1 / 7',
                }}
              >
                <div className="panel-title">Scanners</div>
                <div className="panel-sub">{spans.scanners === 1 ? 'Collapsed' : 'Expanded'}</div>
                <div className="scanner-stack">
                  <div className="scanner-pill">Entry Scanner</div>
                  <div className="scanner-pill">Roll Scanner</div>
                  <div className="scanner-pill">Vol Context</div>
                </div>
              </section>

              <section
                className="panel cyan"
                style={{
                  gridColumn: panelGridColumn(2 + spans.newPanel + spans.watchlist + spans.infoHub + spans.scanners, spans.newPanel2),
                  gridRow: '1 / 7',
                }}
              >
                <div className="panel-title">New Panel 2</div>
                <div className="panel-sub">{spans.newPanel2 === 1 ? 'Collapsed' : 'Expanded'}</div>
              </section>
            </div>

            <div className="y-axis right">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={`r-${n}`}>{n}</div>
              ))}
            </div>
          </div>

          <div className="greenbar-wrap">
            <div className="greenbar" />
          </div>
          <div className="greenbar-caption">DEFAULT LOAD VIEW REPRESENTED BY THE GREEN BAR ABOVE</div>
        </div>
      </div>
    </div>
  );
}
'@

$cssContent = @'
:root {
  color-scheme: dark;
  font-family: Arial, Helvetica, sans-serif;
  background: #cfcfcf;
  color: #111;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  width: 100%;
  height: 100%;
}

body {
  overflow: hidden;
  background: #cfcfcf;
}

button,
input,
select,
textarea {
  font: inherit;
}

.shell {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr);
  background: #cfcfcf;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 16px;
  border-bottom: 1px solid #a0a0a0;
  background: #d7d7d7;
}

.topbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.brand {
  font-weight: 700;
  letter-spacing: 0.04em;
}

.topbar-sub {
  font-size: 12px;
  color: #4a4a4a;
}

.topbar-right {
  display: flex;
  gap: 8px;
}

.preset {
  border: 1px solid #777;
  background: #ececec;
  color: #111;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.preset.active {
  background: #111;
  color: #fff;
}

.viewport {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100vw;
  height: 100%;
  scroll-behavior: smooth;
}

.world {
  min-width: 2200px;
  width: max(2200px, 170vw);
  height: 100%;
  padding: 14px 6px 16px;
}

.axis {
  display: grid;
  grid-template-columns: 100px repeat(8, 200px) 100px;
  align-items: center;
  width: 1800px;
  margin: 0 auto;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
}

.axis-cell {
  height: 22px;
}

.stage {
  width: 1800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 34px 1fr 34px;
  gap: 0;
}

.y-axis {
  display: grid;
  grid-template-rows: repeat(6, 1fr);
  height: 560px;
  align-items: center;
  justify-items: center;
  font-size: 13px;
  font-weight: 700;
}

.grid-world {
  position: relative;
  display: grid;
  grid-template-columns: 100px repeat(8, 200px) 100px;
  grid-template-rows: repeat(6, 1fr);
  height: 560px;
  border: 1px solid #1b1b1b;
  background:
    linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px);
  background-size: 180px calc(100% / 6), 100% calc(100% / 6);
  background-color: #cfcfcf;
}

.gutter {
  background: rgba(255,255,255,0.18);
}

.gutter-left {
  grid-column: 1 / 2;
  grid-row: 1 / 7;
}

.gutter-right {
  grid-column: 10 / 11;
  grid-row: 1 / 7;
}

.panel {
  border: 1px solid rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  overflow: hidden;
}

.magenta { background: linear-gradient(180deg, #ff24ef 0%, #d300cf 100%); }
.green { background: #18ff00; }
.red { background: #ff250d; }
.blue { background: #4d84dc; }
.sand { background: #e8cf6d; }
.cyan { background: #24d7dc; }

.panel-title {
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}

.panel-sub {
  font-size: 12px;
  margin-top: 2px;
  text-align: center;
}

.panel-placeholder {
  margin-top: auto;
  margin-bottom: auto;
  font-size: 13px;
  opacity: 0.75;
}

.watchlist-mini {
  width: 100%;
  margin-top: 10px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(0,0,0,0.15);
}

.watchlist-head,
.watchlist-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 0.9fr;
  gap: 6px;
  padding: 4px 6px;
  font-size: 10px;
}

.watchlist-head {
  font-weight: 700;
  border-bottom: 1px solid rgba(0,0,0,0.18);
}

.watchlist-row {
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.up { color: #054f12; }
.down { color: #7d0909; }

.ticker-row {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin: 10px 0;
}

.ticker-card,
.kpi-card {
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(0,0,0,0.12);
  padding: 8px;
  min-width: 0;
}

.ticker-symbol,
.kpi-label {
  font-size: 10px;
  font-weight: 700;
}

.ticker-last,
.kpi-value {
  font-size: 20px;
  font-weight: 700;
  margin-top: 2px;
}

.ticker-chg {
  font-size: 11px;
}

.kpi-row {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.positions-wrap {
  width: 100%;
  height: 100%;
  margin-top: 10px;
  background: rgba(0,0,0,0.72);
  border: 1px solid rgba(0,0,0,0.3);
  overflow: auto;
}

.positions-wrap > * {
  width: 100%;
  height: 100%;
}

.scanner-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.scanner-pill {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(0,0,0,0.14);
  padding: 16px 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.greenbar-wrap {
  width: 1800px;
  margin: 6px auto 0;
  display: flex;
  justify-content: center;
}

.greenbar {
  width: 1220px;
  height: 6px;
  background: #2ca342;
}

.greenbar-caption {
  width: 1800px;
  margin: 8px auto 0;
  text-align: center;
  color: #8da85d;
  font-size: 11px;
  letter-spacing: 0.02em;
}

/* Existing PositionsPanel fallback cleanup */
.positions-wrap table {
  width: 100%;
  border-collapse: collapse;
}

.positions-wrap th,
.positions-wrap td {
  white-space: nowrap;
}
'@

Set-Content -Path $appFile -Value $appContent -Encoding utf8
Set-Content -Path $cssFile -Value $cssContent -Encoding utf8

Write-Host ""
Write-Host "Backup saved to: $backupDir" -ForegroundColor Cyan
Write-Host "Patched:" -ForegroundColor Green
Write-Host "  frontend/src/App.tsx"
Write-Host "  frontend/src/index.css"
Write-Host ""
Write-Host "Now run:" -ForegroundColor Yellow
Write-Host "  cd frontend"
Write-Host "  npm run build"
