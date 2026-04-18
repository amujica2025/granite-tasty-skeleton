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
