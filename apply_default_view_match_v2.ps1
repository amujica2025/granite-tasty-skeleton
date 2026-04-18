param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$frontend = Join-Path $root "frontend"
$src = Join-Path $frontend "src"

if (-not (Test-Path $frontend)) {
    throw "Run this from the repo root that contains the frontend folder."
}

$backupRoot = Join-Path $root ("backup_default_view_match_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
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
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type PresetKey = "default" | "sides_bundle" | "outer_positions";

type WidthSet = {
  negB: number;
  negA: number;
  A: number;
  center: number;
  F: number;
  posA: number;
  posB: number;
};

const WORLD_SIDE_GUTTER = 520;
const SHEET_HEIGHT = "min(900px, calc(100vh - 64px))";

const PRESET_WIDTHS: Record<PresetKey, WidthSet> = {
  default: {
    negB: 220,
    negA: 390,
    A: 360,
    center: 1480,
    F: 340,
    posA: 390,
    posB: 220,
  },
  sides_bundle: {
    negB: 220,
    negA: 700,
    A: 620,
    center: 1320,
    F: 620,
    posA: 700,
    posB: 220,
  },
  outer_positions: {
    negB: 220,
    negA: 700,
    A: 360,
    center: 1720,
    F: 340,
    posA: 700,
    posB: 220,
  },
};

function fmt(n: number) {
  return n.toFixed(2);
}

function App() {
  const [preset, setPreset] = useState<PresetKey>("default");
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const widths = PRESET_WIDTHS[preset];

  const worldWidth = useMemo(
    () =>
      WORLD_SIDE_GUTTER +
      widths.negB +
      widths.negA +
      widths.A +
      widths.center +
      widths.F +
      widths.posA +
      widths.posB +
      WORLD_SIDE_GUTTER,
    [widths]
  );

  const defaultStart = WORLD_SIDE_GUTTER + widths.negB + widths.negA;
  const defaultWidth = widths.A + widths.center + widths.F + widths.posA;

  const centerDefaultView = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const left = Math.max(0, defaultStart + defaultWidth / 2 - viewport.clientWidth / 2);
    viewport.scrollTo({ left, behavior: "auto" });
  };

  useLayoutEffect(() => {
    const id = window.requestAnimationFrame(centerDefaultView);
    return () => window.cancelAnimationFrame(id);
  }, [preset, worldWidth, defaultStart, defaultWidth]);

  useEffect(() => {
    const onResize = () => centerDefaultView();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [preset, worldWidth, defaultStart, defaultWidth]);

  const controls: Array<{ key: PresetKey; label: string }> = [
    { key: "default", label: "Default" },
    { key: "sides_bundle", label: "Outer + Watchlist/Scanners" },
    { key: "outer_positions", label: "Outer + Positions" },
  ];

  return (
    <div className="gt-app-shell">
      <div className="gt-topbar">
        <div className="gt-brand">
          <strong>GRANITE TASTY</strong>
          <span>Locked default viewport with horizontal panning</span>
        </div>
        <div className="gt-preset-buttons">
          {controls.map((c) => (
            <button
              key={c.key}
              className={preset === c.key ? "gt-preset active" : "gt-preset"}
              onClick={() => setPreset(c.key)}
              type="button"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={viewportRef} className="gt-world-viewport">
        <div className="gt-world" style={{ width: `${worldWidth}px` }}>
          <div className="gt-sheet" style={{ height: SHEET_HEIGHT }}>
            <div
              className="gt-grid"
              style={{
                gridTemplateColumns: `${widths.negB}px ${widths.negA}px ${widths.A}px ${widths.center}px ${widths.F}px ${widths.posA}px ${widths.posB}px`,
              }}
            >
              <div className="gt-col-label" style={{ gridColumn: 1, gridRow: 1 }}>-B</div>
              <div className="gt-col-label" style={{ gridColumn: 2, gridRow: 1 }}>-A</div>
              <div className="gt-col-label" style={{ gridColumn: 3, gridRow: 1 }}>A</div>
              <div className="gt-col-label" style={{ gridColumn: 4, gridRow: 1 }}>B</div>
              <div className="gt-col-label overlay-c" style={{ gridColumn: 4, gridRow: 1 }}>C</div>
              <div className="gt-col-label overlay-d" style={{ gridColumn: 4, gridRow: 1 }}>D</div>
              <div className="gt-col-label overlay-e" style={{ gridColumn: 4, gridRow: 1 }}>E</div>
              <div className="gt-col-label" style={{ gridColumn: 5, gridRow: 1 }}>F</div>
              <div className="gt-col-label" style={{ gridColumn: 6, gridRow: 1 }}>+A</div>
              <div className="gt-col-label" style={{ gridColumn: 7, gridRow: 1 }}>+B</div>

              {[1,2,3,4,5,6].map((n) => (
                <React.Fragment key={n}>
                  <div className="gt-row-label left" style={{ gridColumn: 1, gridRow: n + 1 }}>{n}</div>
                  <div className="gt-row-label right" style={{ gridColumn: 7, gridRow: n + 1 }}>{n}</div>
                </React.Fragment>
              ))}

              <div className="gt-panel neg-b" style={{ gridColumn: 1, gridRow: "2 / span 6" }} />

              <div className="gt-panel outer-left" style={{ gridColumn: 2, gridRow: "2 / span 6" }}>
                <div className="gt-panel-title">New Panel</div>
                <div className="gt-panel-sub">Collapsed</div>
              </div>

              <div className="gt-panel watchlist" style={{ gridColumn: 3, gridRow: "2 / span 6" }}>
                <div className="gt-panel-title">Watchlist</div>
                <div className="gt-panel-sub">Collapsed</div>
                <div className="gt-watchlist-table">
                  <div className="head">Symbol</div>
                  <div className="head">Last</div>
                  <div className="head">% Chg</div>
                  <div className="head">IV Pctl</div>

                  {[
                    ["SPY", 710.52, -0.42, 31],
                    ["AAPL", 270.06, 0.17, 38],
                    ["QQQ", 648.93, -0.21, 46],
                    ["TSLA", 400.16, -1.81, 58],
                    ["NVDA", 201.33, -2.26, 64],
                    ["SPX", 5208.43, 0.17, 27],
                  ].map((row) => (
                    <React.Fragment key={row[0] as string}>
                      <div>{row[0]}</div>
                      <div>{fmt(row[1] as number)}</div>
                      <div>{(row[2] as number).toFixed(2)}%</div>
                      <div>{row[3]}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="gt-panel info-hub" style={{ gridColumn: 4, gridRow: "2 / span 3" }}>
                <div className="gt-info-title">Info Hub</div>
                <div className="gt-ticker-cards">
                  {[
                    ["SPY", "710.77", "-1.76%"],
                    ["AAPL", "270.07", "-0.17%"],
                    ["QQQ", "649.05", "-0.27%"],
                    ["TSLA", "400.35", "-1.81%"],
                    ["NVDA", "201.30", "-2.26%"],
                    ["SPX", "5208.43", "+0.17%"],
                    ["VIX", "15.83", "+2.10%"],
                  ].map(([s, p, c]) => (
                    <div key={s} className="gt-card">
                      <div className="gt-card-sym">{s}</div>
                      <div className="gt-card-price">{p}</div>
                      <div className="gt-card-change">{c}</div>
                    </div>
                  ))}
                </div>
                <div className="gt-kpi-row">
                  <div className="gt-kpi"><span>NET LIQ</span><strong>$2.54</strong></div>
                  <div className="gt-kpi"><span>BP</span><strong>$2.54</strong></div>
                  <div className="gt-kpi"><span>ZX</span><strong>$63.50</strong></div>
                  <div className="gt-kpi"><span>DEFAULT</span><strong>All Collapsed</strong></div>
                  <div className="gt-kpi"><span>PRESET</span><strong>{controls.find((c) => c.key === preset)?.label ?? "Default"}</strong></div>
                </div>
              </div>

              <div className="gt-panel positions" style={{ gridColumn: 4, gridRow: "5 / span 3" }}>
                <div className="gt-panel-title gt-dark-title">Positions Panel</div>
                <div className="gt-panel-sub gt-dark-sub">Collapsed</div>
                <div className="gt-position-window">
                  <div className="gt-position-head">
                    <span>Position</span><span>Qty</span><span>IV</span><span>Mkt</span><span>% Chg</span><span>Trade Px</span><span>Open P/L</span><span>Value</span><span>Limit</span><span>Effect</span>
                  </div>
                  {[
                    ["SPY 240926C00685000", "5", "35.48", "2.35", "-0.45", "1.20", "-25", "-875", "175", "121"],
                    ["AAPL 250117P00195000", "3", "19.80", "1.95", "+0.65", "1.15", "+195", "155", "96", "88"],
                    ["QQQ 240926P00654000", "-2", "27.55", "1.20", "-1.20", "0.75", "-240", "-178", "67", "53"],
                  ].map((row, idx) => (
                    <div className="gt-position-row" key={idx}>
                      {row.map((cell, i) => <span key={i}>{cell}</span>)}
                    </div>
                  ))}
                  <div className="gt-position-scrollbar">
                    <div className="gt-position-scrollthumb" />
                  </div>
                </div>
              </div>

              <div className="gt-panel scanners" style={{ gridColumn: 5, gridRow: "2 / span 6" }}>
                <div className="gt-panel-title">Scanners</div>
                <div className="gt-panel-sub">Collapsed</div>
                <div className="gt-scan-box">Entry Scanner</div>
                <div className="gt-scan-box">Roll Scanner</div>
                <div className="gt-scan-box">Vol Context</div>
              </div>

              <div className="gt-panel outer-right" style={{ gridColumn: 6, gridRow: "2 / span 6" }}>
                <div className="gt-panel-title">New Panel 2</div>
                <div className="gt-panel-sub">Collapsed</div>
              </div>

              <div className="gt-panel pos-b" style={{ gridColumn: 7, gridRow: "2 / span 6" }} />

              <div className="gt-default-bar-wrap" style={{ gridColumn: "1 / span 7", gridRow: 8 }}>
                <div className="gt-default-bar" style={{ marginLeft: `${widths.negB + widths.negA + widths.A * 0.4}px`, width: `${Math.max(520, widths.center + widths.F * 0.8)}px` }} />
                <div className="gt-default-bar-label">DEFAULT LOAD VIEW REPRESENTED BY THE GREEN BAR ABOVE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
'@

$indexCss = @'
:root {
  color-scheme: dark;
  font-family: Arial, Helvetica, sans-serif;
  background: #bfbfbf;
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
  overflow: hidden;
  background: #bfbfbf;
}

body {
  min-width: 0;
}

button {
  font: inherit;
}

.gt-app-shell {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #bfbfbf;
}

.gt-topbar {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 8px 0 10px;
  border-top: 1px solid #694b4b;
  border-bottom: 1px solid #8c7878;
  background: #dedede;
  color: #111;
  font-size: 10px;
}

.gt-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.gt-brand strong {
  font-size: 15px;
  letter-spacing: 0.02em;
}

.gt-brand span {
  color: #4d4d4d;
}

.gt-preset-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.gt-preset {
  border: 1px solid #444;
  background: #efefef;
  color: #111;
  border-radius: 3px;
  padding: 2px 7px;
  font-size: 9px;
  cursor: pointer;
}

.gt-preset.active {
  background: #111;
  color: #fff;
}

.gt-world-viewport {
  width: 100vw;
  height: calc(100vh - 32px);
  overflow-x: auto;
  overflow-y: hidden;
  background: #bfbfbf;
  scrollbar-width: auto;
}

.gt-world {
  min-height: 100%;
  display: flex;
  align-items: center;
  padding: 10px 0 8px;
}

.gt-sheet {
  width: 100%;
  min-height: 820px;
  display: flex;
  align-items: stretch;
}

.gt-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 28px repeat(6, 1fr) 58px;
  border-top: 1px solid #3f3f3f;
  border-left: 1px solid #3f3f3f;
  position: relative;
}

.gt-grid > * {
  border-right: 1px solid #8b8b8b;
  border-bottom: 1px solid #8b8b8b;
}

.gt-col-label,
.gt-row-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #111;
  background: rgba(255,255,255,0.05);
}

.gt-col-label {
  font-weight: 600;
  position: relative;
}

.gt-col-label.overlay-c {
  justify-content: center;
  position: absolute;
  inset: 0;
  width: 33.33%;
  margin-left: 33.33%;
  pointer-events: none;
  background: transparent;
}

.gt-col-label.overlay-d {
  justify-content: center;
  position: absolute;
  inset: 0;
  width: 33.33%;
  margin-left: 49.8%;
  pointer-events: none;
  background: transparent;
}

.gt-col-label.overlay-e {
  justify-content: center;
  position: absolute;
  inset: 0;
  width: 33.33%;
  margin-left: 66.4%;
  pointer-events: none;
  background: transparent;
}

.gt-row-label.left,
.gt-row-label.right {
  background: transparent;
  font-size: 12px;
}

.gt-panel {
  padding: 10px 12px;
  overflow: hidden;
}

.gt-panel-title {
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  text-align: center;
  margin-top: 4px;
  color: #111;
}

.gt-panel-sub {
  font-size: 19px;
  text-align: center;
  margin-top: 4px;
  color: #222;
}

.gt-dark-title {
  font-size: 28px;
}

.gt-dark-sub {
  font-size: 19px;
}

.gt-panel.neg-b,
.gt-panel.pos-b {
  background: transparent;
}

.gt-panel.outer-left {
  background: linear-gradient(180deg, #fd18fa 0%, #d60ad7 100%);
}

.gt-panel.watchlist {
  background: #1dff00;
}

.gt-panel.info-hub {
  background: #ff2618;
}

.gt-panel.positions {
  background: #4d84da;
  padding-top: 6px;
}

.gt-panel.scanners {
  background: #e1ca68;
}

.gt-panel.outer-right {
  background: #2fc8d3;
}

.gt-watchlist-table {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr 0.8fr;
  gap: 4px 8px;
  font-size: 12px;
  color: #0b0b0b;
}

.gt-watchlist-table .head {
  font-weight: 700;
}

.gt-info-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #111;
  margin: 4px 0 10px;
}

.gt-ticker-cards {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.gt-card,
.gt-kpi,
.gt-scan-box {
  background: rgba(255, 120, 90, 0.48);
  border: 1px solid rgba(160, 40, 24, 0.35);
}

.gt-card {
  min-height: 92px;
  padding: 12px 10px 8px;
}

.gt-card-sym {
  font-size: 12px;
  font-weight: 700;
}

.gt-card-price {
  font-size: 30px;
  margin-top: 4px;
  font-weight: 700;
}

.gt-card-change {
  font-size: 12px;
  margin-top: 4px;
}

.gt-kpi-row {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.gt-kpi {
  min-height: 68px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.gt-kpi span {
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 2px;
}

.gt-kpi strong {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.gt-position-window {
  margin-top: 10px;
  height: calc(100% - 54px);
  background: #030609;
  color: #d2e9ff;
  border: 1px solid #3761a8;
  padding: 8px 10px 2px;
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

.gt-position-row span:nth-child(7) {
  color: #ff8c63;
}

.gt-position-row span:nth-child(8) {
  color: #ff6b58;
}

.gt-position-row span:nth-child(9) {
  color: #93ff79;
}

.gt-position-row span:nth-child(10) {
  color: #8ecfff;
}

.gt-position-scrollbar {
  height: 12px;
  margin-top: 14px;
  background: #9f9f9f;
  position: relative;
}

.gt-position-scrollthumb {
  position: absolute;
  left: 0;
  top: 2px;
  height: 8px;
  width: 38%;
  background: #4f4f4f;
}

.gt-scan-box {
  margin-top: 22px;
  min-height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: rgba(245, 225, 149, 0.58);
}

.gt-default-bar-wrap {
  background: transparent;
  border-right: none !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4px 0 0;
}

.gt-default-bar {
  height: 10px;
  background: #2aaa41;
  border-radius: 0;
}

.gt-default-bar-label {
  text-align: center;
  font-size: 11px;
  color: #8baa4b;
  margin-top: 6px;
  letter-spacing: 0.01em;
}

@media (max-width: 1600px) {
  .gt-panel-title {
    font-size: 20px;
  }

  .gt-panel-sub {
    font-size: 16px;
  }

  .gt-card-price,
  .gt-kpi strong {
    font-size: 24px;
  }
}
'@

Set-Content -Path (Join-Path $src "App.tsx") -Value $appTsx -Encoding UTF8
Set-Content -Path (Join-Path $src "index.css") -Value $indexCss -Encoding UTF8

Write-Host ""
Write-Host "Applied default-view sizing fix."
Write-Host "Backups saved to: $backupRoot"
Write-Host ""
Write-Host "Next:"
Write-Host "  cd frontend"
Write-Host "  npm run build"
