$ErrorActionPreference = 'Stop'

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$projectRoot = Get-Location
$frontendSrc = Join-Path $projectRoot 'frontend\src'

if (-not (Test-Path $frontendSrc)) {
    throw "Could not find frontend\\src under $projectRoot. Run this from your repo root."
}

$backupDir = Join-Path $projectRoot ("backup_default_state_" + (Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$filesToBackup = @(
    'frontend\src\App.tsx',
    'frontend\src\main.tsx',
    'frontend\src\index.css'
)

foreach ($file in $filesToBackup) {
    $full = Join-Path $projectRoot $file
    if (Test-Path $full) {
        $dest = Join-Path $backupDir ($file -replace '[\\/:]', '__')
        Copy-Item $full $dest -Force
    }
}

$appTsx = @'
import { useEffect, useMemo, useState } from 'react';
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
  { symbol: 'SPY', latest: 513.24, pctChange: 0.42, ivPctl: 31 },
  { symbol: 'QQQ', latest: 441.82, pctChange: -0.21, ivPctl: 34 },
  { symbol: 'IWM', latest: 201.64, pctChange: 0.66, ivPctl: 43 },
  { symbol: 'TSLA', latest: 172.31, pctChange: 1.81, ivPctl: 68 },
  { symbol: 'NVDA', latest: 880.44, pctChange: 2.26, ivPctl: 64 },
  { symbol: 'SPX', latest: 5208.43, pctChange: 0.17, ivPctl: 27 },
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

const STORAGE_KEY = 'granite-layout-state';

function areaStyle(area: GridArea): React.CSSProperties {
  return {
    gridColumn: `${area.colStart} / ${area.colEnd}`,
    gridRow: `${area.rowStart} / ${area.rowEnd}`,
  };
}

function fmtMoney(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function App() {
  const [layoutState, setLayoutState] = useState<LayoutState>('default');
  const [netLiq, setNetLiq] = useState<number | null>(null);
  const [bp, setBp] = useState<number | null>(null);
  const [watchlistRows, setWatchlistRows] = useState<WatchlistRow[]>(watchlistSeed);
  const [tickers, setTickers] = useState<TickerCard[]>(tickerSeed);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as LayoutState | null;
    if (saved && (saved === 'default' || saved === 'sides_bundle' || saved === 'outer_plus_positions')) {
      setLayoutState(saved);
    } else {
      window.localStorage.setItem(STORAGE_KEY, 'default');
      setLayoutState('default');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, layoutState);
  }, [layoutState]);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/balances');
        if (!res.ok) {
          return;
        }
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
      } catch {
        // keep UI stable even if backend is down
      }
    };

    fetchBalances();
    const interval = window.setInterval(fetchBalances, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/market');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type !== 'RawFeed' || !msg.data || msg.data.type !== 'FEED_DATA') {
          return;
        }

        const feed = msg.data.data;
        if (!Array.isArray(feed) || feed[0] !== 'Quote') {
          return;
        }

        const values = feed[1];
        const map: Record<string, { bid: number; ask: number }> = {};

        for (let i = 0; i < values.length; i += 5) {
          map[values[i]] = { bid: values[i + 1], ask: values[i + 2] };
        }

        const nextMid = (symbol: string, fallback: number) => {
          const q = map[symbol];
          if (!q || typeof q.bid !== 'number' || typeof q.ask !== 'number') {
            return fallback;
          }
          const mid = (q.bid + q.ask) / 2;
          return Number.isFinite(mid) ? Number(mid.toFixed(2)) : fallback;
        };

        setWatchlistRows((prev) => prev.map((row) => ({ ...row, latest: nextMid(row.symbol, row.latest) })));
        setTickers((prev) => prev.map((row) => ({ ...row, last: nextMid(row.symbol, row.last) })));
      } catch {
        // ignore malformed websocket payloads
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const layout = layouts[layoutState];
  const watchlistExpanded = layoutState === 'sides_bundle';
  const scannersExpanded = layoutState === 'sides_bundle';

  const kpiCards = useMemo(
    () => [
      { label: 'Net Liq', value: fmtMoney(netLiq), tone: 'green' },
      { label: 'BP', value: fmtMoney(bp), tone: 'blue' },
      { label: '25x', value: netLiq !== null ? fmtMoney(netLiq * 25) : '—', tone: 'amber' },
      { label: 'Default', value: 'All Collapsed', tone: 'purple' },
      { label: 'Preset', value: layoutState.replaceAll('_', ' '), tone: 'slate' },
    ],
    [bp, layoutState, netLiq],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-block">
            <div className="eyebrow">Granite Tasty Skeleton</div>
            <div className="headline">Locked Default View</div>
          </div>
          <div className="preset-buttons">
            <button
              className={layoutState === 'default' ? 'preset-btn active' : 'preset-btn'}
              onClick={() => setLayoutState('default')}
            >
              Default
            </button>
            <button
              className={layoutState === 'sides_bundle' ? 'preset-btn active' : 'preset-btn'}
              onClick={() => setLayoutState('sides_bundle')}
            >
              New Panels + Watchlist/Scanners
            </button>
            <button
              className={layoutState === 'outer_plus_positions' ? 'preset-btn active' : 'preset-btn'}
              onClick={() => setLayoutState('outer_plus_positions')}
            >
              New Panels + Positions
            </button>
          </div>
        </div>

        <div className="topbar-right">
          <div className="balance-card">
            <span className="balance-label">Net Liq</span>
            <span className="balance-value">{fmtMoney(netLiq)}</span>
          </div>
          <div className="balance-card">
            <span className="balance-label">Buying Power</span>
            <span className="balance-value">{fmtMoney(bp)}</span>
          </div>
        </div>
      </header>

      <main className="workspace-frame">
        <div className="workspace-grid">
          <div className="column-label" style={{ gridColumn: '1 / 2', gridRow: '1 / 2' }}>-B</div>
          <div className="column-label" style={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}>-A</div>
          <div className="column-label" style={{ gridColumn: '3 / 4', gridRow: '1 / 2' }}>A</div>
          <div className="column-label" style={{ gridColumn: '4 / 5', gridRow: '1 / 2' }}>B</div>
          <div className="column-label" style={{ gridColumn: '5 / 6', gridRow: '1 / 2' }}>C</div>
          <div className="column-label" style={{ gridColumn: '6 / 7', gridRow: '1 / 2' }}>D</div>
          <div className="column-label" style={{ gridColumn: '7 / 8', gridRow: '1 / 2' }}>E</div>
          <div className="column-label" style={{ gridColumn: '8 / 9', gridRow: '1 / 2' }}>F</div>
          <div className="column-label" style={{ gridColumn: '9 / 10', gridRow: '1 / 2' }}>+A</div>
          <div className="column-label" style={{ gridColumn: '10 / 11', gridRow: '1 / 2' }}>+B</div>

          <div className="row-label" style={{ gridColumn: '11 / 12', gridRow: '1 / 2' }}>1</div>
          <div className="row-label" style={{ gridColumn: '11 / 12', gridRow: '2 / 3' }}>2</div>
          <div className="row-label" style={{ gridColumn: '11 / 12', gridRow: '3 / 4' }}>3</div>
          <div className="row-label" style={{ gridColumn: '11 / 12', gridRow: '4 / 5' }}>4</div>
          <div className="row-label" style={{ gridColumn: '11 / 12', gridRow: '5 / 6' }}>5</div>
          <div className="row-label" style={{ gridColumn: '11 / 12', gridRow: '6 / 7' }}>6</div>

          <section className="panel panel-empty" style={{ gridColumn: '1 / 2', gridRow: '1 / 7' }} />
          <section className="panel panel-empty" style={{ gridColumn: '10 / 11', gridRow: '1 / 7' }} />

          <section className="panel panel-magenta" style={areaStyle(layout.newPanel)}>
            <div className="panel-title">New Panel</div>
            <div className="panel-subtitle">{layoutState === 'default' ? 'Collapsed' : 'Expanded'}</div>
          </section>

          <section className="panel panel-green" style={areaStyle(layout.watchlist)}>
            <div className="panel-title">Watchlist</div>
            <div className="panel-subtitle">{watchlistExpanded ? 'Expanded' : 'Collapsed'}</div>
            <div className="watchlist-grid">
              {!watchlistExpanded ? (
                <>
                  <div className="watch-h">Symbol</div>
                  <div className="watch-h">Last</div>
                  <div className="watch-h">%Chg</div>
                  <div className="watch-h">IV Pctl</div>
                  {watchlistRows.flatMap((row) => [
                    <div key={`${row.symbol}-s`} className="watch-c">{row.symbol}</div>,
                    <div key={`${row.symbol}-l`} className="watch-c">{row.latest.toFixed(2)}</div>,
                    <div key={`${row.symbol}-p`} className={row.pctChange >= 0 ? 'watch-c up' : 'watch-c down'}>{fmtPct(row.pctChange)}</div>,
                    <div key={`${row.symbol}-iv`} className="watch-c">{row.ivPctl.toFixed(0)}</div>,
                  ])}
                </>
              ) : (
                <>
                  <div className="watch-h">Symbol</div>
                  <div className="watch-h">Last</div>
                  <div className="watch-h">%Chg</div>
                  <div className="watch-h">IV Pctl</div>
                  <div className="watch-h">State</div>
                  {watchlistRows.flatMap((row) => [
                    <div key={`${row.symbol}-s2`} className="watch-c">{row.symbol}</div>,
                    <div key={`${row.symbol}-l2`} className="watch-c">{row.latest.toFixed(2)}</div>,
                    <div key={`${row.symbol}-p2`} className={row.pctChange >= 0 ? 'watch-c up' : 'watch-c down'}>{fmtPct(row.pctChange)}</div>,
                    <div key={`${row.symbol}-iv2`} className="watch-c">{row.ivPctl.toFixed(0)}</div>,
                    <div key={`${row.symbol}-st2`} className="watch-c">Live</div>,
                  ])}
                </>
              )}
            </div>
          </section>

          <section className="panel panel-red" style={areaStyle(layout.infoHub)}>
            <div className="panel-title">Info Hub</div>
            <div className="ticker-strip">
              {tickers.map((ticker) => (
                <div key={ticker.symbol} className="ticker-card">
                  <div className="ticker-symbol">{ticker.symbol}</div>
                  <div className="ticker-last">{ticker.last.toFixed(2)}</div>
                  <div className={ticker.chgPct >= 0 ? 'ticker-change up' : 'ticker-change down'}>{fmtPct(ticker.chgPct)}</div>
                </div>
              ))}
            </div>
            <div className="kpi-strip">
              {kpiCards.map((card) => (
                <div key={card.label} className={`kpi-card tone-${card.tone}`}>
                  <div className="kpi-label">{card.label}</div>
                  <div className="kpi-value">{card.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel panel-blue" style={areaStyle(layout.positions)}>
            <div className="panel-title">Positions Panel</div>
            <div className="panel-subtitle">{layoutState === 'outer_plus_positions' ? 'Expanded' : 'Collapsed'}</div>
            <div className="positions-wrap">
              <PositionsPanel />
            </div>
          </section>

          <section className="panel panel-yellow" style={areaStyle(layout.scanners)}>
            <div className="panel-title">Scanners</div>
            <div className="panel-subtitle">{scannersExpanded ? 'Expanded' : 'Collapsed'}</div>
            <div className="scanner-stack">
              <div className="scanner-box">Entry Scanner</div>
              <div className="scanner-box">Roll Scanner</div>
              <div className="scanner-box">Vol Context</div>
            </div>
          </section>

          <section className="panel panel-cyan" style={areaStyle(layout.newPanel2)}>
            <div className="panel-title">New Panel 2</div>
            <div className="panel-subtitle">{layoutState === 'default' ? 'Collapsed' : 'Expanded'}</div>
          </section>
        </div>
      </main>

      <footer className="bottom-lockbar">
        <div className="lockbar-green" />
        <div className="lockbar-text">DEFAULT LOAD VIEW REPRESENTED BY THE GREEN BAR ABOVE</div>
      </footer>
    </div>
  );
}
'@

$mainTsx = @'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
'@

$indexCss = @'
:root {
  color-scheme: dark;
  --bg: #d8d8d8;
  --panel-border: #111111;
  --grid-line: rgba(0, 0, 0, 0.18);
  --text: #0e0e0e;
  --topbar-bg: #101113;
  --topbar-border: #24262b;
  --topbar-text: #e8e8e8;
  --button-bg: #191b20;
  --button-border: #31343b;
  --button-active: #2a8a3d;
  --button-active-border: #44be5e;
  --button-text: #f3f4f6;
  --panel-magenta: #ef00ef;
  --panel-green: #14ff00;
  --panel-red: #ff180e;
  --panel-blue: #4d86df;
  --panel-yellow: #eed06a;
  --panel-cyan: #1ed7da;
  --bar-green: #2e9b3f;
  --muted: #56606a;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  background: var(--bg);
  color: var(--text);
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 88px minmax(0, 1fr) 64px;
  background: var(--bg);
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 14px 18px;
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--topbar-border);
  color: var(--topbar-text);
}

.topbar-left {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: center;
}

.brand-block {
  min-width: 220px;
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9ea5b0;
}

.headline {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preset-btn {
  padding: 10px 14px;
  border: 1px solid var(--button-border);
  background: var(--button-bg);
  color: var(--button-text);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.preset-btn.active {
  background: var(--button-active);
  border-color: var(--button-active-border);
}

.topbar-right {
  display: flex;
  gap: 12px;
}

.balance-card {
  min-width: 168px;
  padding: 10px 12px;
  border: 1px solid var(--button-border);
  background: #17191d;
  border-radius: 8px;
  display: grid;
  gap: 6px;
}

.balance-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ea5b0;
}

.balance-value {
  font-size: 18px;
  font-weight: 700;
}

.workspace-frame {
  min-height: 0;
  padding: 12px 16px 8px;
}

.workspace-grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 64px;
  grid-template-rows: 28px repeat(6, minmax(0, 1fr));
  gap: 0;
  border: 2px solid rgba(0, 0, 0, 0.22);
  background:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
    var(--bg);
  background-size: 100% calc((100% - 28px) / 6), 10% 100%, auto;
  overflow: hidden;
}

.column-label,
.row-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #111;
  background: rgba(255, 255, 255, 0.16);
}

.panel {
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--panel-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-empty {
  background: transparent;
}

.panel-magenta { background: var(--panel-magenta); }
.panel-green { background: var(--panel-green); }
.panel-red { background: var(--panel-red); }
.panel-blue { background: var(--panel-blue); }
.panel-yellow { background: var(--panel-yellow); }
.panel-cyan { background: var(--panel-cyan); }

.panel-title {
  padding: 14px 12px 4px;
  text-align: center;
  font-size: clamp(16px, 1.05vw, 24px);
  font-weight: 700;
  color: #101010;
}

.panel-subtitle {
  padding: 0 12px 10px;
  text-align: center;
  font-size: clamp(14px, 0.9vw, 20px);
  color: rgba(0, 0, 0, 0.82);
}

.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin: 8px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(0, 0, 0, 0.28);
  overflow: auto;
}

.watch-h,
.watch-c {
  padding: 7px 8px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
}

.watch-h {
  font-weight: 700;
}

.watch-c.up,
.ticker-change.up {
  color: #126c22;
  font-weight: 700;
}

.watch-c.down,
.ticker-change.down {
  color: #8b1c1c;
  font-weight: 700;
}

.ticker-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  padding: 10px 12px 0;
}

.ticker-card {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.22);
  background: rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  display: grid;
  gap: 4px;
  text-align: center;
}

.ticker-symbol {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.ticker-last {
  font-size: 18px;
  font-weight: 700;
}

.ticker-change {
  font-size: 13px;
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  padding: 10px 12px 12px;
}

.kpi-card {
  border: 1px solid rgba(0, 0, 0, 0.22);
  border-radius: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.16);
  min-height: 76px;
}

.kpi-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.7);
}

.kpi-value {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.tone-green { box-shadow: inset 0 0 0 9999px rgba(34, 197, 94, 0.08); }
.tone-blue { box-shadow: inset 0 0 0 9999px rgba(59, 130, 246, 0.08); }
.tone-amber { box-shadow: inset 0 0 0 9999px rgba(245, 158, 11, 0.08); }
.tone-purple { box-shadow: inset 0 0 0 9999px rgba(168, 85, 247, 0.08); }
.tone-slate { box-shadow: inset 0 0 0 9999px rgba(71, 85, 105, 0.08); }

.positions-wrap {
  flex: 1;
  min-height: 0;
  margin: 8px;
  border: 1px solid rgba(0, 0, 0, 0.26);
  background: rgba(0, 0, 0, 0.82);
  overflow: auto;
}

.positions-wrap > * {
  min-width: 1100px;
}

.scanner-stack {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.scanner-box {
  min-height: 84px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
}

.bottom-lockbar {
  display: grid;
  grid-template-rows: 18px 1fr;
  align-items: start;
  padding: 0 16px 10px;
}

.lockbar-green {
  width: 60%;
  height: 12px;
  margin: 0 auto;
  background: var(--bar-green);
  border-radius: 1px;
}

.lockbar-text {
  padding-top: 8px;
  text-align: center;
  font-size: 14px;
  color: #7ca03a;
  letter-spacing: 0.03em;
}

@media (max-width: 1500px) {
  .topbar {
    grid-template-columns: 1fr;
  }

  .topbar-left {
    grid-template-columns: 1fr;
  }

  .topbar-right {
    flex-wrap: wrap;
  }
}
'@

Write-Utf8NoBomFile -Path (Join-Path $projectRoot 'frontend\src\App.tsx') -Content $appTsx
Write-Utf8NoBomFile -Path (Join-Path $projectRoot 'frontend\src\main.tsx') -Content $mainTsx
Write-Utf8NoBomFile -Path (Join-Path $projectRoot 'frontend\src\index.css') -Content $indexCss

Write-Host ''
Write-Host 'Default state lock patch applied.' -ForegroundColor Green
Write-Host "Backups saved to: $backupDir" -ForegroundColor Yellow
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '1) cd frontend'
Write-Host '2) npm run build'
Write-Host '3) restart the app'
