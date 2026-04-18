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

const COL_WIDTH = 500;
const TOTAL_COLS = 10;
const SHEET_HEIGHT = 930;

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
                <div className="gt-kpi"><span>Net Liq</span><strong>{netLiq === null ? "â€”" : `$${netLiq.toLocaleString()}`}</strong></div>
                <div className="gt-kpi"><span>25x</span><strong>{netLiq === null ? "â€”" : `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</strong></div>
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

