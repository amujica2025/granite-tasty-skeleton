import React, { useEffect, useMemo, useRef, useState } from "react";

type PanelState = {
  newPanel: boolean;
  watchlist: boolean;
  positions: boolean;
  scanners: boolean;
  newPanel2: boolean;
};

type GridArea = {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
};

type PositionRow = {
  id: number;
  symbol: string;
  expiry: string;
  strike: number;
  optionType: "C" | "P";
  qty: number;
  mark: number;
  markChange: number;
  tradePrice: number;
  openPnl: number;
  bpEffect: number;
  delta: number;
  theta: number;
  iv: number;
};

type CardKind = "market" | "underlying" | "structure" | "symbol";

type InfoHubCard = {
  id: string;
  kind: CardKind;
  title: string;
  subtitle: string;
  value: string;
  pnl: string;
  series: number[];
};

type AlertRule = {
  id: string;
  symbol: string;
  field: string;
  operator: string;
  value: string;
  desktop: boolean;
  pushover: boolean;
  status: "enabled" | "disabled";
};

type AlertEvent = {
  id: string;
  ts: string;
  title: string;
  detail: string;
};

type JournalEntry = {
  id: string;
  ts: string;
  title: string;
  body: string;
};

type EventRow = {
  id: string;
  ts: string;
  eventType: string;
  symbol: string;
  source: string;
  detail: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type Artifact = {
  id: string;
  title: string;
  subtitle: string;
  series: number[];
};

type Stroke = {
  id: string;
  points: Array<{ x: number; y: number }>;
};

const COL_WIDTH = 500;
const TOTAL_COLS = 10;
const TOTAL_ROWS = 6;
const ROW_HEIGHT = 155;
const SHEET_HEIGHT = TOTAL_ROWS * ROW_HEIGHT;

const basePanel: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
  border: "1px solid #121212",
  boxSizing: "border-box",
  position: "relative",
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

function makeSeries(seed: number): number[] {
  return Array.from({ length: 24 }, (_, idx) => {
    const wobble = Math.sin((idx + seed) / 3) * 8;
    const drift = idx * 0.8;
    return 50 + wobble + drift;
  });
}

function Sparkline({ series, height = 38 }: { series: number[]; height?: number }) {
  const width = 180;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" points={points} />
    </svg>
  );
}

function ChartCard({ card, compact }: { card: InfoHubCard; compact: boolean }) {
  return (
    <div className={`hub-card ${compact ? "compact" : "full"}`}>
      <div className="hub-card-top">
        <div>
          <div className="hub-card-title">{card.title}</div>
          <div className="hub-card-subtitle">{card.subtitle}</div>
        </div>
        <div className="hub-card-pill">{card.kind.toUpperCase()}</div>
      </div>
      <div className="hub-card-metrics">
        <div className="hub-card-value">{card.value}</div>
        <div className="hub-card-pnl">{card.pnl}</div>
      </div>
      <div className="hub-card-chart">
        <Sparkline series={card.series} height={compact ? 34 : 92} />
      </div>
    </div>
  );
}

function ArtifactCanvasModal({ open, artifact, artifacts, onClose, onSelectArtifact }: { open: boolean; artifact: Artifact | null; artifacts: Artifact[]; onClose: () => void; onSelectArtifact: (artifact: Artifact) => void; }) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [activeStrokeId, setActiveStrokeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setStrokes([]);
    setDrawing(false);
    setActiveStrokeId(null);
  }, [artifact?.id]);

  if (!open || !artifact) return null;

  const getRelativePoint = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * 1000,
      y: ((clientY - rect.top) / rect.height) * 540,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = getRelativePoint(e.clientX, e.clientY);
    const id = `stroke-${Date.now()}`;
    setDrawing(true);
    setActiveStrokeId(id);
    setStrokes((prev) => [...prev, { id, points: [pt] }]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing || !activeStrokeId) return;
    const pt = getRelativePoint(e.clientX, e.clientY);
    setStrokes((prev) => prev.map((stroke) => stroke.id === activeStrokeId ? { ...stroke, points: [...stroke.points, pt] } : stroke));
  };

  const handlePointerUp = () => {
    setDrawing(false);
    setActiveStrokeId(null);
  };

  return (
    <div className="modal-backdrop">
      <div className="artifact-modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">Artifact Canvas</div>
            <div className="modal-subtitle">{artifact.title} â€” {artifact.subtitle}</div>
          </div>
          <div className="modal-head-actions">
            <button className="ghost-btn" onClick={() => setStrokes([])}>Clear</button>
            <button className="close-btn" onClick={onClose}>Ã—</button>
          </div>
        </div>
        <div className="artifact-modal-body">
          <div className="artifact-thumb-rail">
            {artifacts.map((item) => (
              <button key={item.id} className={`artifact-thumb ${artifact.id === item.id ? "active" : ""}`} onClick={() => onSelectArtifact(item)}>
                <div className="artifact-thumb-title">{item.title}</div>
                <div className="artifact-thumb-mini"><Sparkline series={item.series} height={36} /></div>
              </button>
            ))}
          </div>
          <div className="artifact-main">
            <div className="artifact-chart-shell">
              <div className="artifact-chart-base"><Sparkline series={artifact.series} height={220} /></div>
              <svg ref={svgRef} className="artifact-overlay" viewBox="0 0 1000 540" preserveAspectRatio="none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                {strokes.map((stroke) => (
                  <polyline key={stroke.id} fill="none" stroke="#ffd84d" strokeWidth="4" points={stroke.points.map((pt) => `${pt.x},${pt.y}`).join(" ")} />
                ))}
              </svg>
            </div>
            <div className="artifact-note">This expanded artifact canvas is the shared reference point. Your annotations are visible here and intended to be used by the agent when discussing the artifact.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsModal({ open, onClose, alerts, setAlerts, alertEvents, setAlertEvents }: { open: boolean; onClose: () => void; alerts: AlertRule[]; setAlerts: React.Dispatch<React.SetStateAction<AlertRule[]>>; alertEvents: AlertEvent[]; setAlertEvents: React.Dispatch<React.SetStateAction<AlertEvent[]>>; }) {
  const [symbol, setSymbol] = useState("IBM");
  const [field, setField] = useState("last_price");
  const [operator, setOperator] = useState("<");
  const [value, setValue] = useState("230");

  if (!open) return null;

  const createAlert = () => {
    const rule: AlertRule = { id: `ALT-${Date.now()}`, symbol: symbol.toUpperCase(), field, operator, value, desktop: true, pushover: true, status: "enabled" };
    setAlerts((prev) => [rule, ...prev]);
    setAlertEvents((prev) => [{ id: `AE-${Date.now()}`, ts: new Date().toLocaleString(), title: "Alert created", detail: `${rule.symbol} ${rule.field} ${rule.operator} ${rule.value}` }, ...prev]);
  };

  return (
    <div className="modal-backdrop">
      <div className="panel-modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">Alerts Center</div>
            <div className="modal-subtitle">Desktop + Pushover default on; all alert events tracked</div>
          </div>
          <button className="close-btn" onClick={onClose}>Ã—</button>
        </div>
        <div className="modal-content">
          <div className="builder-strip">
            <span>Alert when</span>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            <select value={field} onChange={(e) => setField(e.target.value)}>{["last_price", "upper_bb_pct", "open_pnl", "net_liq", "buying_power"].map((f) => <option key={f} value={f}>{f}</option>)}</select>
            <select value={operator} onChange={(e) => setOperator(e.target.value)}>{["<", "<=", "=", ">=", ">", "crosses above", "crosses below"].map((op) => <option key={op} value={op}>{op}</option>)}</select>
            <input value={value} onChange={(e) => setValue(e.target.value)} />
            <button className="action-btn" onClick={createAlert}>Create</button>
          </div>
          <div className="modal-grid two">
            <div className="card-shell">
              <div className="section-title">Active Rules</div>
              <table className="data-table"><thead><tr><th>ID</th><th>Condition</th><th>Delivery</th></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.id}><td>{alert.id}</td><td>{alert.symbol} {alert.field} {alert.operator} {alert.value}</td><td>{alert.desktop ? "Desktop" : ""}{alert.desktop && alert.pushover ? " + " : ""}{alert.pushover ? "Pushover" : ""}</td></tr>)}</tbody></table>
            </div>
            <div className="card-shell">
              <div className="section-title">Alert History</div>
              <table className="data-table"><thead><tr><th>Time</th><th>Event</th><th>Detail</th></tr></thead><tbody>{alertEvents.map((evt) => <tr key={evt.id}><td>{evt.ts}</td><td>{evt.title}</td><td>{evt.detail}</td></tr>)}</tbody></table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalModal({ open, onClose, journalEntries, events }: { open: boolean; onClose: () => void; journalEntries: JournalEntry[]; events: EventRow[]; }) {
  const [tab, setTab] = useState<"journal" | "schema" | "events" | "chat">("journal");
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "m1", role: "assistant", text: "Ask me about positions, alerts, journal history, or the DB schema." }]);
  const [input, setInput] = useState("What do we track in the event store?");

  if (!open) return null;

  const send = () => {
    if (!input.trim()) return;
    const user: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: input.trim() };
    const answer: ChatMessage = { id: `a-${Date.now()}`, role: "assistant", text: input.toLowerCase().includes("event") ? "The core event store centers on JSONB payloads for fills, balances, positions, alerts, artifacts, and journal context. Read models then support fast lookup." : "Quick mode should answer directly from SQL/read models first, then expand with journal and artifact context when asked." };
    setMessages((prev) => [...prev, user, answer]);
    setInput("");
  };

  return (
    <div className="modal-backdrop">
      <div className="panel-modal large">
        <div className="modal-head">
          <div>
            <div className="modal-title">Journal + DB + AI</div>
            <div className="modal-subtitle">Journaling system, event log, schema v1, and chat interface</div>
          </div>
          <button className="close-btn" onClick={onClose}>Ã—</button>
        </div>
        <div className="modal-tabs">
          {[ ["journal", "Journal"], ["schema", "Schema"], ["events", "Events"], ["chat", "AI Chat"] ].map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key as typeof tab)}>{label}</button>)}
        </div>
        <div className="modal-content">
          {tab === "journal" && <div className="card-shell"><div className="section-title">Journal Entries</div><div className="journal-list">{journalEntries.map((entry) => <div key={entry.id} className="journal-item"><div className="journal-top"><div className="journal-title">{entry.title}</div><div className="journal-ts">{entry.ts}</div></div><div className="journal-body">{entry.body}</div></div>)}</div></div>}
          {tab === "schema" && <div className="modal-grid two"><div className="card-shell"><div className="section-title">Schema v1</div><ul className="schema-list"><li>events(event_id, event_ts, event_type, source, symbol, payload_json JSONB, tags_json JSONB)</li><li>journal_entries(journal_entry_id, created_ts, symbol, trade_id, title, body_md, metadata_json)</li><li>artifacts(artifact_id, created_ts, artifact_type, title, data_json, image_path)</li><li>alerts(alert_id, symbol, field_name, operator, target_value, desktop, pushover, status)</li><li>alert_events(alert_event_id, alert_id, fired_ts, event_type, matched_value, detail_json)</li><li>alertable_fields(field_name, label, data_type, source_table, source_scope, is_active)</li></ul></div><div className="card-shell"><div className="section-title">AI Query Flow</div><ol className="schema-list"><li>Route to SQL/read models first</li><li>Pull event bundles and journal context</li><li>Use RAG/LLM for quick answer + optional deep explanation</li><li>Launch artifacts from the same context when useful</li></ol></div></div>}
          {tab === "events" && <div className="card-shell"><div className="section-title">Event Log</div><table className="data-table"><thead><tr><th>Time</th><th>Type</th><th>Symbol</th><th>Source</th><th>Detail</th></tr></thead><tbody>{events.map((row) => <tr key={row.id}><td>{row.ts}</td><td>{row.eventType}</td><td>{row.symbol}</td><td>{row.source}</td><td>{row.detail}</td></tr>)}</tbody></table></div>}
          {tab === "chat" && <div className="chat-shell"><div className="chat-log">{messages.map((msg) => <div key={msg.id} className={`chat-bubble ${msg.role}`}>{msg.text}</div>)}</div><div className="chat-input-row"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the journal / DB / alerts agent..." /><button className="action-btn" onClick={send}>Send</button></div></div>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [expanded, setExpanded] = useState<PanelState>({ newPanel: false, watchlist: false, positions: false, scanners: false, newPanel2: false });
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [qtyOverride, setQtyOverride] = useState<Record<number, number>>({});
  const [netLiq] = useState<number>(71978);
  const [buyingPower] = useState<number>(16540);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(false);

  const [alerts, setAlerts] = useState<AlertRule[]>([
    { id: "ALT-1001", symbol: "IBM", field: "last_price", operator: "<", value: "230", desktop: true, pushover: true, status: "enabled" },
    { id: "ALT-1002", symbol: "TSLA", field: "upper_bb_pct", operator: ">", value: "105", desktop: true, pushover: true, status: "enabled" },
  ]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([
    { id: "AE-1", ts: "2026-04-18 09:41", title: "Alert fired", detail: "IBM last_price < 230 matched at 229.87" },
    { id: "AE-2", ts: "2026-04-18 11:18", title: "Alert fired", detail: "TSLA upper_bb_pct > 105 matched at 108.3" },
  ]);
  const [journalEntries] = useState<JournalEntry[]>([
    { id: "J-1", ts: "2026-04-18 09:43", title: "IBM alert review", body: "IBM broke 230, alert fired, no action taken. Rally stalled but did not trigger an entry." },
    { id: "J-2", ts: "2026-04-18 11:22", title: "TSLA BB extension", body: "TSLA pushed above 105% of upper BB. Candidate for fade alert and artifact review." },
  ]);
  const [eventRows] = useState<EventRow[]>([
    { id: "E-1", ts: "2026-04-18 09:41", eventType: "alert_fired", symbol: "IBM", source: "alerts", detail: "last_price < 230" },
    { id: "E-2", ts: "2026-04-18 10:02", eventType: "position_snapshot_received", symbol: "XYZ", source: "account_stream", detail: "5 legs updated" },
    { id: "E-3", ts: "2026-04-18 11:18", eventType: "alert_fired", symbol: "TSLA", source: "alerts", detail: "upper_bb_pct > 105" },
    { id: "E-4", ts: "2026-04-18 11:19", eventType: "artifact_generated", symbol: "TSLA", source: "journal", detail: "BB extension view" },
  ]);
  const [artifacts] = useState<Artifact[]>([
    { id: "AR-1", title: "TSLA BB Extension", subtitle: "Alert timeline + chart", series: makeSeries(1) },
    { id: "AR-2", title: "XYZ Position Lifecycle", subtitle: "Leg watch structure", series: makeSeries(4) },
    { id: "AR-3", title: "SPY Intraday Tape", subtitle: "Market watch context", series: makeSeries(7) },
  ]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(artifacts[0]);

  const positions: PositionRow[] = [
    { id: 1, symbol: "XYZ", expiry: "2026-05-15", strike: 100, optionType: "C", qty: -1, mark: 40.60, markChange: 0.35, tradePrice: 49.00, openPnl: 840, bpEffect: 1000, delta: -0.99, theta: 0.12, iv: 41.2 },
    { id: 2, symbol: "XYZ", expiry: "2026-05-15", strike: 110, optionType: "C", qty: 1, mark: 30.15, markChange: -0.22, tradePrice: 0.00, openPnl: -15, bpEffect: 0, delta: 0.94, theta: -0.09, iv: 38.8 },
    { id: 3, symbol: "XYZ", expiry: "2026-05-15", strike: 115, optionType: "C", qty: 1, mark: 25.80, markChange: 0.15, tradePrice: 4.10, openPnl: 2170, bpEffect: 0, delta: 0.88, theta: -0.11, iv: 39.5 },
    { id: 4, symbol: "XYZ", expiry: "2026-05-15", strike: 120, optionType: "C", qty: -2, mark: 21.10, markChange: 0.42, tradePrice: 2.50, openPnl: -3720, bpEffect: 0, delta: -1.42, theta: 0.24, iv: 40.9 },
    { id: 5, symbol: "XYZ", expiry: "2026-05-15", strike: 125, optionType: "C", qty: 1, mark: 17.40, markChange: 0.28, tradePrice: 0.90, openPnl: 1650, bpEffect: 0, delta: 0.63, theta: -0.07, iv: 42.1 },
  ];

  const marketCards: InfoHubCard[] = [
    { id: "M-1", kind: "market", title: "SPY", subtitle: "US index", value: "513.24", pnl: "+0.42%", series: makeSeries(1) },
    { id: "M-2", kind: "market", title: "QQQ", subtitle: "US index", value: "441.82", pnl: "-0.21%", series: makeSeries(2) },
    { id: "M-3", kind: "market", title: "TSLA", subtitle: "Big mover", value: "172.31", pnl: "+1.81%", series: makeSeries(3) },
  ];

  const [symbolCards, setSymbolCards] = useState<InfoHubCard[]>([
    { id: "S-XYZ", kind: "underlying", title: "XYZ", subtitle: "Open underlying", value: "123.40", pnl: "+0.88%", series: makeSeries(5) },
  ]);
  const [structureCards, setStructureCards] = useState<InfoHubCard[]>([
    { id: "STR-1", kind: "structure", title: "-1 120C / +1 125C", subtitle: "User-defined watch", value: "$370 to close", pnl: "+$180", series: makeSeries(8) },
  ]);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const layout = useMemo(() => getLayout(expanded), [expanded]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const centerField = () => {
      const centeredLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollLeft = centeredLeft;
    };
    centerField();
    const t = setTimeout(centerField, 40);
    window.addEventListener("resize", centerField);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", centerField);
    };
  }, [expanded]);

  const togglePanel = (panel: keyof PanelState) => {
    setExpanded((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const applyPreset = (preset: "default" | "preset2" | "preset3") => {
    if (preset === "default") {
      setExpanded({ newPanel: false, watchlist: false, positions: false, scanners: false, newPanel2: false });
    } else if (preset === "preset2") {
      setExpanded({ newPanel: true, watchlist: true, positions: false, scanners: true, newPanel2: true });
    } else {
      setExpanded({ newPanel: true, watchlist: false, positions: true, scanners: false, newPanel2: true });
    }
  };

  const getQty = (row: PositionRow) => qtyOverride[row.id] ?? row.qty;
  const toggleRow = (id: number) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const canMoveTowardZero = (row: PositionRow) => row.qty > 0 ? getQty(row) > 0 : getQty(row) < 0;
  const canMoveTowardOriginal = (row: PositionRow) => row.qty > 0 ? getQty(row) < row.qty : getQty(row) > row.qty;

  const adjustQty = (row: PositionRow, direction: "towardZero" | "towardOriginal") => {
    const original = row.qty;
    let current = getQty(row);
    if (direction === "towardZero") {
      if (original > 0 && current > 0) current -= 1;
      if (original < 0 && current < 0) current += 1;
    } else {
      if (original > 0 && current < original) current += 1;
      if (original < 0 && current > original) current -= 1;
    }
    setQtyOverride((prev) => ({ ...prev, [row.id]: current }));
  };

  const selectedIds = Object.keys(selected).map(Number).filter((id) => selected[id]);

  const totals = useMemo(() => {
    const rows = selectedIds.length ? positions.filter((p) => selected[p.id]) : positions;
    return rows.reduce((acc, row) => {
      const effQty = getQty(row);
      return {
        qty: acc.qty + effQty,
        mark: acc.mark + row.mark * effQty,
        openPnl: acc.openPnl + row.openPnl * (effQty / row.qty),
        bpEffect: acc.bpEffect + row.bpEffect * Math.abs(effQty / row.qty),
        delta: acc.delta + row.delta * (effQty / row.qty),
        theta: acc.theta + row.theta * (effQty / row.qty),
      };
    }, { qty: 0, mark: 0, openPnl: 0, bpEffect: 0, delta: 0, theta: 0 });
  }, [positions, qtyOverride, selected, selectedIds]);

  const watchRows = useMemo(() => [
    { symbol: "SPY", last: 513.24, change: "+0.42%", ivPct: 31 },
    { symbol: "QQQ", last: 441.82, change: "-0.21%", ivPct: 34 },
    { symbol: "TSLA", last: 172.31, change: "+1.81%", ivPct: 68 },
    { symbol: "NVDA", last: 880.44, change: "+2.26%", ivPct: 64 },
    { symbol: "IBM", last: 229.87, change: "-0.14%", ivPct: 26 },
  ], []);

  const allCards = useMemo(() => [...marketCards, ...symbolCards, ...structureCards], [marketCards, symbolCards, structureCards]);
  const positionsExpanded = expanded.positions;

  const addSelectedLegsToInfoHub = () => {
    const rows = positions.filter((p) => selected[p.id]);
    if (!rows.length) return;
    const title = rows.map((row) => `${getQty(row)} ${row.strike}${row.optionType}`).join(" / ");
    const value = rows.reduce((sum, row) => sum + row.mark * Math.abs(getQty(row)) * 100, 0);
    const pnl = rows.reduce((sum, row) => sum + row.openPnl * (Math.abs(getQty(row)) / Math.abs(row.qty)), 0);
    const card: InfoHubCard = { id: `STR-${Date.now()}`, kind: "structure", title, subtitle: "Selected legs watch", value: `$${value.toFixed(0)} to close`, pnl: `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`, series: makeSeries(Date.now() % 10) };
    setStructureCards((prev) => [card, ...prev]);
  };

  const addSymbolToInfoHub = (symbol: string) => {
    const card: InfoHubCard = { id: `SYM-${symbol}-${Date.now()}`, kind: "symbol", title: symbol, subtitle: "User-added symbol", value: "Watching", pnl: "Live", series: makeSeries(symbol.length + Date.now() % 10) };
    setSymbolCards((prev) => [card, ...prev]);
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">Granite Tasty Skeleton</div>
        <div className="toolbar-actions">
          <button className="top-btn" onClick={() => applyPreset("default")}>Default State</button>
          <button className="top-btn" onClick={() => applyPreset("preset2")}>Outer + Watchlist/Scanners</button>
          <button className="top-btn" onClick={() => applyPreset("preset3")}>Outer + Positions</button>
          <button className="top-btn accent" onClick={() => setJournalOpen(true)}>DB / JOURNAL / AI</button>
          <button className="top-btn accent" onClick={() => setAlertsOpen(true)}>ALERTS</button>
          <button className="top-btn accent" onClick={() => { setActiveArtifact(artifacts[0]); setArtifactOpen(true); }}>ARTIFACTS</button>
        </div>
      </div>
      <div className="viewport" ref={viewportRef}>
        <div className="grid-world" style={{ width: TOTAL_COLS * COL_WIDTH, height: SHEET_HEIGHT, gridTemplateColumns: `repeat(${TOTAL_COLS}, ${COL_WIDTH}px)`, gridTemplateRows: `repeat(${TOTAL_ROWS}, ${ROW_HEIGHT}px)` }}>
          <section className="panel magenta" style={{ ...basePanel, ...areaStyle(layout.newPanel) }}><div className="panel-head"><span>{expanded.newPanel ? "NEW PANEL - EXPANDED" : "NEW PANEL - COLLAPSED"}</span><button onClick={() => togglePanel("newPanel")}>{expanded.newPanel ? "âˆ’" : "+"}</button></div><div className="panel-fill" /></section>
          <section className="panel green" style={{ ...basePanel, ...areaStyle(layout.watchlist) }}><div className="panel-head"><span>{expanded.watchlist ? "WATCHLIST - EXPANDED" : "WATCHLIST - COLLAPSED"}</span><button onClick={() => togglePanel("watchlist")}>{expanded.watchlist ? "âˆ’" : "+"}</button></div><div className="watchlist-shell"><table className="data-table compact"><thead><tr><th>Symbol</th><th>Last</th><th>% Chg</th><th>IV %</th><th></th></tr></thead><tbody>{watchRows.map((row) => <tr key={row.symbol}><td>{row.symbol}</td><td>{row.last.toFixed(2)}</td><td>{row.change}</td><td>{row.ivPct}</td><td><button className="mini-btn" onClick={() => addSymbolToInfoHub(row.symbol)}>Add</button></td></tr>)}</tbody></table></div></section>
          <section className="panel red" style={{ ...basePanel, ...areaStyle(layout.infoHub) }}><div className="infohub-kpis"><div className="kpi-card"><div className="kpi-label">NLV</div><div className="kpi-value">${netLiq.toLocaleString()}</div></div><div className="kpi-card"><div className="kpi-label">NLV Ã— 25</div><div className="kpi-value">${(netLiq * 25).toLocaleString()}</div></div><div className="kpi-card"><div className="kpi-label">BP</div><div className="kpi-value">${buyingPower.toLocaleString()}</div></div></div><div className={`marquee-shell ${positionsExpanded ? "compact" : "wide"}`}><div className="marquee-track">{[...allCards, ...allCards].map((card, idx) => <ChartCard key={`${card.id}-${idx}`} card={card} compact={positionsExpanded} />)}</div></div></section>
          <section className="panel blue" style={{ ...basePanel, ...areaStyle(layout.positions) }}><div className="panel-head"><span>{expanded.positions ? "POSITIONS - EXPANDED" : "POSITIONS - COLLAPSED"}</span><button onClick={() => togglePanel("positions")}>{expanded.positions ? "âˆ’" : "+"}</button></div><div className="positions-toolbar"><button className="action-btn" onClick={addSelectedLegsToInfoHub}>Add Selected Legs to InfoHub</button><div className="positions-note">Raw legs only. No grouping. Qty overrides only move toward zero.</div></div><div className="positions-table-wrap"><table className="data-table positions-table"><thead><tr><th>Leg</th><th>Qty</th><th>Mark</th><th>Î” Mark</th><th>Trade Px</th><th>Open P/L</th><th>BP</th><th>Delta</th><th>Theta</th><th>IV</th><th>Qty Adj</th></tr></thead><tbody>{positions.map((row) => { const isSelected = !!selected[row.id]; const isModified = qtyOverride[row.id] !== undefined && qtyOverride[row.id] !== row.qty; const effectiveQty = getQty(row); return <tr key={row.id} className={`${isSelected ? "selected" : ""} ${isModified ? "modified" : ""}`} onClick={() => toggleRow(row.id)}><td>{row.symbol} {row.expiry} {row.strike}{row.optionType}</td><td>{effectiveQty}</td><td>{row.mark.toFixed(2)}</td><td>{row.markChange >= 0 ? "+" : ""}{row.markChange.toFixed(2)}</td><td>{row.tradePrice.toFixed(2)}</td><td>{row.openPnl >= 0 ? "+" : ""}${row.openPnl.toFixed(0)}</td><td>${row.bpEffect.toFixed(0)}</td><td>{row.delta.toFixed(2)}</td><td>{row.theta.toFixed(2)}</td><td>{row.iv.toFixed(1)}</td><td><div className="qty-adjust">{canMoveTowardZero(row) && <button className="mini-btn" onClick={(e) => { e.stopPropagation(); adjustQty(row, "towardZero"); }}>{row.qty > 0 ? "â†“" : "â†‘"}</button>}{canMoveTowardOriginal(row) && <button className="mini-btn" onClick={(e) => { e.stopPropagation(); adjustQty(row, "towardOriginal"); }}>{row.qty > 0 ? "â†‘" : "â†“"}</button>}</div></td></tr>; })}</tbody><tfoot><tr className="totals-row"><td>{selectedIds.length ? "SELECTED TOTALS" : "PORTFOLIO TOTALS"}</td><td>{totals.qty}</td><td>{totals.mark.toFixed(2)}</td><td>â€”</td><td>â€”</td><td>{totals.openPnl >= 0 ? "+" : ""}${totals.openPnl.toFixed(0)}</td><td>${totals.bpEffect.toFixed(0)}</td><td>{totals.delta.toFixed(2)}</td><td>{totals.theta.toFixed(2)}</td><td>â€”</td><td>â€”</td></tr></tfoot></table></div></section>
          <section className="panel yellow" style={{ ...basePanel, ...areaStyle(layout.scanners) }}><div className="panel-head"><span>{expanded.scanners ? "SCANNERS - EXPANDED" : "SCANNERS - COLLAPSED"}</span><button onClick={() => togglePanel("scanners")}>{expanded.scanners ? "âˆ’" : "+"}</button></div><div className="scanner-stack"><div className="scanner-box">ENTRY SCANNER</div><div className="scanner-box">VOL SURFACE</div><div className="scanner-box">ROLL SCANNER</div></div></section>
          <section className="panel cyan" style={{ ...basePanel, ...areaStyle(layout.newPanel2) }}><div className="panel-head"><span>{expanded.newPanel2 ? "NEW PANEL 2 - EXPANDED" : "NEW PANEL 2 - COLLAPSED"}</span><button onClick={() => togglePanel("newPanel2")}>{expanded.newPanel2 ? "âˆ’" : "+"}</button></div><div className="panel-fill" /></section>
        </div>
      </div>
      <AlertsModal open={alertsOpen} onClose={() => setAlertsOpen(false)} alerts={alerts} setAlerts={setAlerts} alertEvents={alertEvents} setAlertEvents={setAlertEvents} />
      <JournalModal open={journalOpen} onClose={() => setJournalOpen(false)} journalEntries={journalEntries} events={eventRows} />
      <ArtifactCanvasModal open={artifactOpen} artifact={activeArtifact} artifacts={artifacts} onClose={() => setArtifactOpen(false)} onSelectArtifact={setActiveArtifact} />
    </div>
  );
}
