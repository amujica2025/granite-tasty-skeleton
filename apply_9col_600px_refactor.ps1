param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$frontend = Join-Path $root "frontend"
$src = Join-Path $frontend "src"

if (-not (Test-Path $frontend)) {
    throw "Run this from the repo root that contains the frontend folder."
}

$backupRoot = Join-Path $root ("backup_9col_refactor_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

foreach ($rel in @("frontend\src\App.tsx", "frontend\src\index.css")) {
    $full = Join-Path $root $rel
    if (Test-Path $full) {
        $dest = Join-Path $backupRoot $rel
        New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
        Copy-Item $full $dest -Force
    }
}

$appTsx = @'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type LayoutState = "default" | "sides_bundle" | "outer_plus_positions";

type Area = {
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
};

type LayoutConfig = {
  viewStartCol: number;
  viewEndCol: number;
  newPanel: Area;
  watchlist: Area;
  infoHub: Area;
  positions: Area;
  scanners: Area;
  newPanel2: Area;
};

const COL_WIDTH = 600;
const TOTAL_COLS = 9;
const SHEET_HEIGHT = 940;

const layouts: Record<LayoutState, LayoutConfig> = {
  default: {
    viewStartCol: 2,
    viewEndCol: 9,
    newPanel: { colStart: 2, colSpan: 1, rowStart: 2, rowSpan: 6 },
    watchlist: { colStart: 3, colSpan: 1, rowStart: 2, rowSpan: 6 },
    infoHub: { colStart: 4, colSpan: 3, rowStart: 2, rowSpan: 3 },
    positions: { colStart: 4, colSpan: 3, rowStart: 5, rowSpan: 3 },
    scanners: { colStart: 7, colSpan: 1, rowStart: 2, rowSpan: 6 },
    newPanel2: { colStart: 8, colSpan: 1, rowStart: 2, rowSpan: 6 },
  },
  sides_bundle: {
    viewStartCol: 1,
    viewEndCol: 10,
    newPanel: { colStart: 1, colSpan: 2, rowStart: 2, rowSpan: 6 },
    watchlist: { colStart: 3, colSpan: 2, rowStart: 2, rowSpan: 6 },
    infoHub: { colStart: 5, colSpan: 1, rowStart: 2, rowSpan: 3 },
    positions: { colStart: 5, colSpan: 1, rowStart: 5, rowSpan: 3 },
    scanners: { colStart: 6, colSpan: 2, rowStart: 2, rowSpan: 6 },
    newPanel2: { colStart: 8, colSpan: 2, rowStart: 2, rowSpan: 6 },
  },
  outer_plus_positions: {
    viewStartCol: 1,
    viewEndCol: 10,
    newPanel: { colStart: 1, colSpan: 2, rowStart: 2, rowSpan: 6 },
    watchlist: { colStart: 3, colSpan: 1, rowStart: 2, rowSpan: 6 },
    infoHub: { colStart: 4, colSpan: 3, rowStart: 2, rowSpan: 2 },
    positions: { colStart: 4, colSpan: 3, rowStart: 4, rowSpan: 4 },
    scanners: { colStart: 7, colSpan: 1, rowStart: 2, rowSpan: 6 },
    newPanel2: { colStart: 8, colSpan: 2, rowStart: 2, rowSpan: 6 },
  },
};

const tickers = [
  { symbol: "SPY", last: 710.77, chg: -1.76 },
  { symbol: "AAPL", last: 270.07, chg: -0.17 },
  { symbol: "QQQ", last: 649.05, chg: -0.27 },
  { symbol: "TSLA", last: 400.35, chg: -1.81 },
  { symbol: "NVDA", last: 201.30, chg: -2.26 },
  { symbol: "SPX", last: 5208.43, chg: 0.17 },
];

const watchlistRows = [
  ["SPY", 710.52, -0.42, 31],
  ["AAPL", 270.06, 0.17, 38],
  ["QQQ", 648.93, -0.21, 46],
  ["TSLA", 400.16, -1.81, 58],
  ["NVDA", 201.33, -2.26, 64],
  ["SPX", 5208.43, 0.17, 27],
];

const positionRows = [
  ["SPY 240926C00685000", "5", "35.48", "2.35", "-0.45", "1.20", "-25", "-875", "175", "121"],
  ["AAPL 250117P00195000", "3", "19.80", "1.95", "+0.65", "1.15", "+195", "155", "96", "88"],
  ["QQQ 240926P00654000", "-2", "27.55", "1.20", "-1.20", "0.75", "-240", "-178", "67", "53"],
];

function areaStyle(area: Area) {
  return {
    gridColumn: `${area.colStart} / span ${area.colSpan}`,
    gridRow: `${area.rowStart} / span ${area.rowSpan}`,
  };
}

function fmt2(value: number) {
  return value.toFixed(2);
}

export default function App() {
  const [layoutState, setLayoutState] = useState<LayoutState>("default");
  const [netLiq, setNetLiq] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const layout = layouts[layoutState];
  const worldWidth = TOTAL_COLS * COL_WIDTH;

  const activeView = useMemo(() => {
    const startX = (layout.viewStartCol - 1) * COL_WIDTH;
    const viewWidth = (layout.viewEndCol - layout.viewStartCol) * COL_WIDTH;
    return { startX, viewWidth };
  }, [layout]);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/balances");
        const data = await res.json();
        if (data?.balances?.length) {
          setNetLiq(data.balances[0].net_liquidating_value ?? null);
        }
      } catch {
        setNetLiq(null);
      }
    };
    fetchBalances();
    const interval = window.setInterval(fetchBalances, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const centerViewportOnActiveView = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const left = Math.max(0, activeView.startX + activeView.viewWidth / 2 - viewport.clientWidth / 2);
    viewport.scrollTo({ left, behavior: "auto" });
  };

  useLayoutEffect(() => {
    const id = window.requestAnimationFrame(centerViewportOnActiveView);
    return () => window.cancelAnimationFrame(id);
  }, [layoutState, activeView.startX, activeView.viewWidth]);

  useEffect(() => {
    window.addEventListener("resize", centerViewportOnActiveView);
    return () => window.removeEventListener("resize", centerViewportOnActiveView);
  }, [layoutState, activeView.startX, activeView.viewWidth]);

  return (
    <div className="gt-shell">
      <div className="gt-topbar">
        <div className="gt-title">
          <strong>Granite Tasty Skeleton</strong>
          <span>9-column / 600px refactor</span>
        </div>

        <div className="gt-controls">
          <button className={layoutState === "default" ? "active" : ""} onClick={() => setLayoutState("default")}>Default</button>
          <button className={layoutState === "sides_bundle" ? "active" : ""} onClick={() => setLayoutState("sides_bundle")}>Outer + Watchlist/Scanners</button>
          <button className={layoutState === "outer_plus_positions" ? "active" : ""} onClick={() => setLayoutState("outer_plus_positions")}>Outer + Positions</button>
        </div>
      </div>

      <div ref={viewportRef} className="gt-viewport">
        <div className="gt-world" style={{ width: `${worldWidth}px`, height: `${SHEET_HEIGHT}px` }}>
          <div className="gt-grid">
            {Array.from({ length: TOTAL_COLS }, (_, i) => (
              <div key={i} className="gt-col-label" style={{ gridColumn: i + 1, gridRow: 1 }}>
                {i + 1}
              </div>
            ))}

            {Array.from({ length: 6 }, (_, i) => (
              <div key={`left-${i}`} className="gt-row-label left" style={{ gridColumn: 1, gridRow: i + 2 }}>
                {i + 1}
              </div>
            ))}

            <div className="gt-panel gt-empty" style={{ gridColumn: 1, gridRow: "2 / span 6" }} />
            <div className="gt-panel gt-empty" style={{ gridColumn: 9, gridRow: "2 / span 6" }} />

            <div className="gt-panel gt-magenta" style={areaStyle(layout.newPanel)}>
              <div className="gt-panel-title">New Panel</div>
              <div className="gt-panel-sub">{layoutState === "default" ? "Collapsed" : "Expanded"}</div>
            </div>

            <div className="gt-panel gt-green" style={areaStyle(layout.watchlist)}>
              <div className="gt-panel-title">Watchlist</div>
              <div className="gt-panel-sub">{layoutState === "sides_bundle" ? "Expanded" : "Collapsed"}</div>
              <div className="gt-watchlist-grid">
                <div className="head">Symbol</div>
                <div className="head">Last</div>
                <div className="head">% Chg</div>
                <div className="head">IV Pctl</div>
                {watchlistRows.flatMap((row) => [
                  <div key={`${row[0]}-s`}>{row[0]}</div>,
                  <div key={`${row[0]}-l`}>{fmt2(row[1] as number)}</div>,
                  <div key={`${row[0]}-c`} className={(row[2] as number) >= 0 ? "pos" : "neg"}>
                    {(row[2] as number) >= 0 ? "+" : ""}{fmt2(row[2] as number)}%
                  </div>,
                  <div key={`${row[0]}-i`}>{row[3]}</div>,
                ])}
              </div>
            </div>

            <div className="gt-panel gt-red" style={areaStyle(layout.infoHub)}>
              <div className="gt-hub-title">Info Hub</div>
              <div className="gt-cards">
                {tickers.map((t) => (
                  <div key={t.symbol} className="gt-card">
                    <div className="sym">{t.symbol}</div>
                    <div className="last">{fmt2(t.last)}</div>
                    <div className={t.chg >= 0 ? "pos" : "neg"}>{t.chg >= 0 ? "+" : ""}{fmt2(t.chg)}%</div>
                  </div>
                ))}
              </div>
              <div className="gt-kpis">
                <div className="gt-kpi"><span>Net Liq</span><strong>{netLiq === null ? "—" : `$${netLiq.toLocaleString()}`}</strong></div>
                <div className="gt-kpi"><span>25x</span><strong>{netLiq === null ? "—" : `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</strong></div>
                <div className="gt-kpi"><span>Mode</span><strong>{layoutState}</strong></div>
              </div>
            </div>

            <div className="gt-panel gt-blue" style={areaStyle(layout.positions)}>
              <div className="gt-panel-title">Positions Panel</div>
              <div className="gt-panel-sub">{layoutState === "outer_plus_positions" ? "Expanded" : "Collapsed"}</div>
              <div className="gt-positions-window">
                <div className="gt-position-head">
                  <span>Position</span><span>Qty</span><span>IV</span><span>Mkt</span><span>%</span><span>Trade</span><span>Open P/L</span><span>Value</span><span>Limit</span><span>Effect</span>
                </div>
                {positionRows.map((row, idx) => (
                  <div className="gt-position-row" key={idx}>
                    {row.map((cell, i) => <span key={i}>{cell}</span>)}
                  </div>
                ))}
              </div>
            </div>

            <div className="gt-panel gt-yellow" style={areaStyle(layout.scanners)}>
              <div className="gt-panel-title">Scanners</div>
              <div className="gt-panel-sub">{layoutState === "sides_bundle" ? "Expanded" : "Collapsed"}</div>
              <div className="gt-box">Entry Scanner</div>
              <div className="gt-box">Roll Scanner</div>
              <div className="gt-box">Vol Context</div>
            </div>

            <div className="gt-panel gt-cyan" style={areaStyle(layout.newPanel2)}>
              <div className="gt-panel-title">New Panel 2</div>
              <div className="gt-panel-sub">{layoutState === "default" ? "Collapsed" : "Expanded"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'@

$indexCss = @'
:root {
  color-scheme: dark;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #bfbfbf;
}

.gt-shell {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #bfbfbf;
}

.gt-topbar {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px;
  background: #d7d7d7;
  border-bottom: 1px solid #8c8c8c;
  color: #111;
}

.gt-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.gt-title strong {
  font-size: 15px;
}

.gt-title span {
  font-size: 11px;
  color: #4a4a4a;
}

.gt-controls {
  display: flex;
  gap: 6px;
}

.gt-controls button {
  border: 1px solid #4a4a4a;
  background: #f1f1f1;
  color: #111;
  border-radius: 4px;
  font-size: 10px;
  padding: 3px 8px;
  cursor: pointer;
}

.gt-controls button.active {
  background: #111;
  color: #fff;
}

.gt-viewport {
  width: 100vw;
  height: calc(100vh - 36px);
  overflow-x: auto;
  overflow-y: hidden;
  background: #bfbfbf;
}

.gt-world {
  padding: 0;
  margin: 0 auto;
}

.gt-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(9, 600px);
  grid-template-rows: 24px repeat(6, 150px) 16px;
  border-top: 1px solid #575757;
  border-left: 1px solid #575757;
}

.gt-grid > * {
  border-right: 1px solid #8e8e8e;
  border-bottom: 1px solid #8e8e8e;
}

.gt-col-label, .gt-row-label {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font-size: 12px;
  background: rgba(255,255,255,0.08);
}

.gt-row-label.left {
  justify-content: flex-start;
  padding-left: 8px;
}

.gt-panel {
  overflow: hidden;
  padding: 10px 12px;
}

.gt-empty {
  background: transparent;
}

.gt-magenta { background: linear-gradient(180deg, #fd18fa 0%, #d60ad7 100%); }
.gt-green { background: #1dff00; }
.gt-red { background: #ff2618; }
.gt-blue { background: #4d84da; }
.gt-yellow { background: #e1ca68; }
.gt-cyan { background: #2fc8d3; }

.gt-panel-title {
  text-align: center;
  color: #111;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-top: 4px;
}

.gt-panel-sub {
  text-align: center;
  color: #222;
  font-size: 19px;
  margin-top: 4px;
}

.gt-watchlist-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr 0.8fr;
  gap: 5px 8px;
  color: #0b0b0b;
  font-size: 12px;
}

.gt-watchlist-grid .head {
  font-weight: 700;
}

.gt-hub-title {
  text-align: center;
  color: #111;
  font-size: 34px;
  font-weight: 700;
  margin: 2px 0 10px;
}

.gt-cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.gt-card {
  min-height: 94px;
  background: rgba(255, 120, 90, 0.48);
  border: 1px solid rgba(160, 40, 24, 0.35);
  padding: 10px;
}

.gt-card .sym {
  font-size: 12px;
  font-weight: 700;
  color: #111;
}

.gt-card .last {
  font-size: 28px;
  font-weight: 700;
  color: #111;
}

.gt-kpis {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.gt-kpi {
  min-height: 70px;
  background: rgba(255, 120, 90, 0.48);
  border: 1px solid rgba(160, 40, 24, 0.35);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.gt-kpi span {
  font-size: 11px;
  font-weight: 700;
  color: #111;
}

.gt-kpi strong {
  font-size: 26px;
  color: #111;
}

.gt-positions-window {
  margin-top: 10px;
  height: calc(100% - 54px);
  background: #030609;
  color: #d2e9ff;
  border: 1px solid #3761a8;
  padding: 8px 10px;
  overflow: hidden;
}

.gt-position-head,
.gt-position-row {
  display: grid;
  grid-template-columns: 2.7fr 0.5fr 0.7fr 0.7fr 0.7fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr;
  gap: 8px;
  font-size: 10px;
}

.gt-position-head {
  color: #93b9ff;
  padding-bottom: 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid #173968;
}

.gt-position-row {
  padding: 7px 0;
  color: #9fc1f1;
  border-bottom: 1px solid rgba(40, 81, 140, 0.28);
}

.gt-box {
  margin-top: 22px;
  min-height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #3b3212;
  background: rgba(245, 225, 149, 0.58);
  border: 1px solid rgba(100, 86, 34, 0.25);
}

.pos { color: #167f37; }
.neg { color: #a52d2d; }
'@

Set-Content -Path (Join-Path $src "App.tsx") -Value $appTsx -Encoding UTF8
Set-Content -Path (Join-Path $src "index.css") -Value $indexCss -Encoding UTF8

Write-Host ""
Write-Host "Applied 9-column / 600px span refactor."
Write-Host "Backups saved to: $backupRoot"
Write-Host ""
Write-Host "Next:"
Write-Host "  cd frontend"
Write-Host "  npm run build"
