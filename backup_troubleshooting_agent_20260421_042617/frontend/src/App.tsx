import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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

type AlertRuleOperator = '<' | '<=' | '=' | '>=' | '>' | 'crosses_above' | 'crosses_below';

type AlertRule = {
  alert_id: string;
  name: string;
  symbol: string;
  field_name: string;
  operator: AlertRuleOperator;
  target_value: string;
  desktop: boolean;
  pushover: boolean;
  is_enabled: boolean;
  created_by: 'user' | 'agent';
};

type WatchObject = {
  watch_id: string;
  watch_type: 'symbol' | 'structure';
  label: string;
  underlying: string;
  source: 'user' | 'positions' | 'scanner';
  payload: Record<string, unknown>;
  is_active: boolean;
};

type AlertEvent = {
  alert_event_id: string;
  alert_id: string;
  event_type: 'created' | 'enabled' | 'disabled' | 'triggered' | 'dismissed';
  event_ts: string;
  symbol: string;
  payload: Record<string, unknown>;
};

type InfoHubCard = {
  card_id: string;
  card_type: 'kpi' | 'symbol' | 'underlying' | 'structure' | 'alert' | 'system';
  title: string;
  subtitle: string;
  value: string;
  secondary_value: string;
  priority: 'low' | 'medium' | 'high';
  source: 'alerts' | 'positions' | 'scanner' | 'journal' | 'system';
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

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  background: '#111',
  color: '#e5e7eb',
  border: '1px solid #2a2a2a',
  padding: '6px 8px',
  fontSize: 11,
  outline: 'none',
};

const tinyActionButtonStyle: React.CSSProperties = {
  border: '1px solid #1f1f1f',
  background: '#0e0e0e',
  color: '#cfcfcf',
  padding: '2px 6px',
  fontSize: 10,
  cursor: 'pointer',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

function areaStyle(area: GridArea): React.CSSProperties {
  return {
    gridColumn: `${area.colStart} / ${area.colEnd}`,
    gridRow: `${area.rowStart} / ${area.rowEnd}`,
  };
}

const formatCompact = (value: number) =>
  Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const heatColor = (value: number, min: number, max: number) => {
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));
  const alpha = 0.1 + ratio * 0.3;
  return `rgba(245, 158, 11, ${alpha.toFixed(3)})`;
};

const formatSignedPct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const formatPrice = (value: number) => `$${value.toFixed(2)}`;
const normalizeSymbol = (value: string) => value.trim().toUpperCase();
const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getPriorityRank = (priority: InfoHubCard['priority']) => {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  return 1;
};

const getFieldLabel = (fieldName: string) => {
  switch (fieldName) {
    case 'last_price':
      return 'Last';
    case 'pct_change':
      return '% Chg';
    case 'iv_pctl':
      return 'IV Pctl';
    case 'imp_vol':
      return 'Imp Vol';
    default:
      return fieldName;
  }
};

const getOperatorLabel = (operator: AlertRuleOperator) => {
  switch (operator) {
    case 'crosses_above':
      return 'Crosses Above';
    case 'crosses_below':
      return 'Crosses Below';
    default:
      return operator;
  }
};

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

const getNumericFieldValue = (row: WatchlistRow, fieldName: string): number | null => {
  switch (fieldName) {
    case 'last_price':
      return row.latest;
    case 'pct_change':
      return row.pctChange;
    case 'iv_pctl':
      return row.ivPctl;
    case 'imp_vol':
      return row.impVol;
    default:
      return null;
  }
};

const evaluateSimpleOperator = (currentValue: number, operator: AlertRuleOperator, targetValue: number) => {
  switch (operator) {
    case '<':
      return currentValue < targetValue;
    case '<=':
      return currentValue <= targetValue;
    case '=':
      return currentValue === targetValue;
    case '>=':
      return currentValue >= targetValue;
    case '>':
      return currentValue > targetValue;
    default:
      return false;
  }
};

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

  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      alert_id: createId('alert'),
      name: 'SPY Last >= 515',
      symbol: 'SPY',
      field_name: 'last_price',
      operator: '>=',
      target_value: '515',
      desktop: true,
      pushover: true,
      is_enabled: true,
      created_by: 'user',
    },
  ]);
  const [alertHistory, setAlertHistory] = useState<AlertEvent[]>([]);
  const [watchObjects, setWatchObjects] = useState<WatchObject[]>([]);
  const [pinnedInfoHubKeys, setPinnedInfoHubKeys] = useState<string[]>([]);

  const [builderSymbol, setBuilderSymbol] = useState('SPY');
  const [builderField, setBuilderField] = useState('last_price');
  const [builderOperator, setBuilderOperator] = useState<AlertRuleOperator>('>=');
  const [builderTargetValue, setBuilderTargetValue] = useState('515');

  const [newWatchSymbol, setNewWatchSymbol] = useState('');
  const [newStructureLabel, setNewStructureLabel] = useState('');
  const [newStructureUnderlying, setNewStructureUnderlying] = useState('');

  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const fieldPreviousValuesRef = useRef<Record<string, number>>({});
  const alertSatisfiedRef = useRef<Record<string, boolean>>({});

  const artifactStore = useArtifactStore();

  const openArtifactTestHook = () => {
    artifactStore.openArtifact({
      symbol: 'SPY',
      source: { type: 'synthetic' },
    });
  };

  const launchArtifactFromWatchlist = (payload: { symbol: string }) => {
    artifactStore.openArtifact({
      symbol: payload.symbol,
      source: { type: 'synthetic' },
    });
  };

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
              null
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

        if (msg.type === 'RawFeed' && msg.data && msg.data.type === 'FEED_DATA') {
          const feed = msg.data.data;

          if (feed[0] === 'Quote') {
            const values = feed[1];
            const map: Record<string, { bid: number; ask: number }> = {};

            for (let i = 0; i < values.length; i += 5) {
              map[values[i]] = {
                bid: values[i + 1],
                ask: values[i + 2],
              };
            }

            const nextMid = (symbol: string, fallback: number) => {
              const q = map[symbol];
              if (!q || typeof q.bid !== 'number' || typeof q.ask !== 'number') return fallback;
              const mid = (q.bid + q.ask) / 2;
              return Number.isFinite(mid) ? Number(mid.toFixed(2)) : fallback;
            };

            setWatchlistRows((prev) =>
              prev.map((row) => ({
                ...row,
                latest: nextMid(row.symbol, row.latest),
              }))
            );
          }
        }
      } catch {
        console.log('Quote parse error');
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const nextEvents: AlertEvent[] = [];

    alertRules.forEach((rule) => {
      if (!rule.is_enabled) {
        alertSatisfiedRef.current[rule.alert_id] = false;
        return;
      }

      const row = watchlistRows.find((item) => item.symbol === rule.symbol);
      if (!row) {
        alertSatisfiedRef.current[rule.alert_id] = false;
        return;
      }

      const currentValue = getNumericFieldValue(row, rule.field_name);
      const targetValue = Number(rule.target_value);

      if (currentValue === null || !Number.isFinite(targetValue)) {
        alertSatisfiedRef.current[rule.alert_id] = false;
        return;
      }

      const fieldKey = `${rule.symbol}:${rule.field_name}`;
      const previousValue = fieldPreviousValuesRef.current[fieldKey];
      const previousSatisfied = alertSatisfiedRef.current[rule.alert_id] ?? false;

      let satisfiedNow = false;
      let shouldTrigger = false;

      if (rule.operator === 'crosses_above') {
        satisfiedNow = currentValue > targetValue;
        shouldTrigger =
          previousValue !== undefined && previousValue <= targetValue && currentValue > targetValue;
      } else if (rule.operator === 'crosses_below') {
        satisfiedNow = currentValue < targetValue;
        shouldTrigger =
          previousValue !== undefined && previousValue >= targetValue && currentValue < targetValue;
      } else {
        satisfiedNow = evaluateSimpleOperator(currentValue, rule.operator, targetValue);
        shouldTrigger = satisfiedNow && !previousSatisfied;
      }

      alertSatisfiedRef.current[rule.alert_id] = satisfiedNow;

      if (shouldTrigger) {
        nextEvents.push({
          alert_event_id: createId('alert_event'),
          alert_id: rule.alert_id,
          event_type: 'triggered',
          event_ts: new Date().toISOString(),
          symbol: rule.symbol,
          payload: {
            field_name: rule.field_name,
            operator: rule.operator,
            current_value: currentValue,
            target_value: targetValue,
          },
        });
      }
    });

    const nextFieldValues: Record<string, number> = {};
    watchlistRows.forEach((row) => {
      ['last_price', 'pct_change', 'iv_pctl', 'imp_vol'].forEach((fieldName) => {
        const value = getNumericFieldValue(row, fieldName);
        if (value !== null) {
          nextFieldValues[`${row.symbol}:${fieldName}`] = value;
        }
      });
    });
    fieldPreviousValuesRef.current = nextFieldValues;

    if (nextEvents.length > 0) {
      setAlertHistory((prev) => [...nextEvents, ...prev].slice(0, 24));
    }
  }, [alertRules, watchlistRows]);

  const layout = useMemo(() => getLayout(expanded), [expanded]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const centerDefaultField = () => {
      const worldWidth = el.scrollWidth;
      const viewWidth = el.clientWidth;
      const centeredLeft = Math.max(0, (worldWidth - viewWidth) / 2);
      el.scrollLeft = centeredLeft;
    };

    centerDefaultField();
    const t = setTimeout(centerDefaultField, 50);
    window.addEventListener('resize', centerDefaultField);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', centerDefaultField);
    };
  }, [expanded]);

  const applyPreset = (preset: 'default' | 'preset2' | 'preset3') => {
    if (preset === 'default') {
      setExpanded({
        newPanel: false,
        watchlist: false,
        positions: false,
        scanners: false,
        newPanel2: false,
      });
      return;
    }

    if (preset === 'preset2') {
      setExpanded({
        newPanel: true,
        watchlist: true,
        positions: false,
        scanners: true,
        newPanel2: true,
      });
      return;
    }

    setExpanded({
      newPanel: true,
      watchlist: false,
      positions: true,
      scanners: false,
      newPanel2: true,
    });
  };

  const togglePanel = (panel: keyof PanelState) => {
    setExpanded((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  const appendAlertEvent = (event: AlertEvent) => {
    setAlertHistory((prev) => [event, ...prev].slice(0, 24));
  };

  const ensureWatchlistSymbolRow = (symbol: string) => {
    setWatchlistRows((prev) => {
      if (prev.some((row) => row.symbol === symbol)) return prev;
      return [
        ...prev,
        {
          symbol,
          latest: 0,
          pctChange: 0,
          relStr14d: 0,
          ivPctl: 0,
          ivHv: 0,
          impVol: 0,
          iv5d: 0,
          iv1m: 0,
          iv3m: 0,
          iv6m: 0,
          bbPct: 0,
          bbRank: 0,
          ttmSqueeze: 'N/A',
          adr14d: 0,
          optionsVol: 0,
          totalVol1m: 0,
          callVol: 0,
          putVol: 0,
        },
      ];
    });
  };

  const upsertWatchObject = (watch: WatchObject) => {
    setWatchObjects((prev) => {
      const idx = prev.findIndex((item) => item.watch_id === watch.watch_id);
      if (idx === -1) return [...prev, watch];
      const next = [...prev];
      next[idx] = watch;
      return next;
    });
  };

  const isSymbolWatched = (symbol: string) =>
    watchObjects.some(
      (watch) => watch.watch_type === 'symbol' && watch.underlying === symbol && watch.is_active
    );

  const toggleSymbolWatch = (symbol: string) => {
    ensureWatchlistSymbolRow(symbol);

    const existing = watchObjects.find(
      (watch) => watch.watch_type === 'symbol' && watch.underlying === symbol
    );

    if (existing) {
      const nextIsActive = !existing.is_active;
      upsertWatchObject({ ...existing, is_active: nextIsActive });

      if (!nextIsActive) {
        setPinnedInfoHubKeys((prev) => prev.filter((key) => key !== `symbol:${symbol}`));
      }
      return;
    }

    upsertWatchObject({
      watch_id: createId('watch'),
      watch_type: 'symbol',
      label: symbol,
      underlying: symbol,
      source: 'user',
      payload: {},
      is_active: true,
    });
  };

  const ensureSymbolWatchActive = (symbol: string) => {
    ensureWatchlistSymbolRow(symbol);

    const existing = watchObjects.find(
      (watch) => watch.watch_type === 'symbol' && watch.underlying === symbol
    );

    if (existing) {
      if (!existing.is_active) {
        upsertWatchObject({ ...existing, is_active: true });
      }
      return existing.watch_id;
    }

    const watchId = createId('watch');
    upsertWatchObject({
      watch_id: watchId,
      watch_type: 'symbol',
      label: symbol,
      underlying: symbol,
      source: 'user',
      payload: {},
      is_active: true,
    });
    return watchId;
  };

  const togglePinnedKey = (key: string) => {
    setPinnedInfoHubKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const promoteSymbolToInfoHub = (symbol: string) => {
    ensureSymbolWatchActive(symbol);
    togglePinnedKey(`symbol:${symbol}`);
  };

  const addQuickAlertForSymbol = (symbol: string) => {
    setBuilderSymbol(symbol);
    setBuilderField('last_price');
    setBuilderOperator('>=');
    const row = watchlistRows.find((item) => item.symbol === symbol);
    const nextTarget = row ? (row.latest + Math.max(1, row.latest * 0.01)).toFixed(2) : '0';
    setBuilderTargetValue(nextTarget);
    ensureSymbolWatchActive(symbol);
  };

  const createAlertRule = () => {
    const symbol = normalizeSymbol(builderSymbol);
    const target = builderTargetValue.trim();

    if (!symbol || target === '' || !Number.isFinite(Number(target))) return;

    ensureWatchlistSymbolRow(symbol);

    const nextRule: AlertRule = {
      alert_id: createId('alert'),
      name: `${symbol} ${getFieldLabel(builderField)} ${getOperatorLabel(builderOperator)} ${target}`,
      symbol,
      field_name: builderField,
      operator: builderOperator,
      target_value: target,
      desktop: true,
      pushover: true,
      is_enabled: true,
      created_by: 'user',
    };

    setAlertRules((prev) => [nextRule, ...prev]);
    appendAlertEvent({
      alert_event_id: createId('alert_event'),
      alert_id: nextRule.alert_id,
      event_type: 'created',
      event_ts: new Date().toISOString(),
      symbol,
      payload: {
        field_name: nextRule.field_name,
        operator: nextRule.operator,
        target_value: Number(nextRule.target_value),
      },
    });
  };

  const toggleAlertRuleEnabled = (alertId: string) => {
    setAlertRules((prev) =>
      prev.map((rule) => {
        if (rule.alert_id !== alertId) return rule;
        const nextRule = { ...rule, is_enabled: !rule.is_enabled };

        appendAlertEvent({
          alert_event_id: createId('alert_event'),
          alert_id: nextRule.alert_id,
          event_type: nextRule.is_enabled ? 'enabled' : 'disabled',
          event_ts: new Date().toISOString(),
          symbol: nextRule.symbol,
          payload: {},
        });

        return nextRule;
      })
    );
  };

  const deleteAlertRule = (alertId: string) => {
    setAlertRules((prev) => prev.filter((rule) => rule.alert_id !== alertId));
    delete alertSatisfiedRef.current[alertId];
  };

  const addWatchedSymbol = () => {
    const symbol = normalizeSymbol(newWatchSymbol);
    if (!symbol) return;

    ensureWatchlistSymbolRow(symbol);
    ensureSymbolWatchActive(symbol);
    setNewWatchSymbol('');
  };

  const addWatchedStructure = () => {
    const label = newStructureLabel.trim();
    const underlying = normalizeSymbol(newStructureUnderlying);

    if (!label || !underlying) return;

    const existing = watchObjects.find(
      (watch) =>
        watch.watch_type === 'structure' &&
        watch.label.toLowerCase() === label.toLowerCase() &&
        watch.underlying === underlying
    );

    if (existing) {
      upsertWatchObject({ ...existing, is_active: true });
    } else {
      upsertWatchObject({
        watch_id: createId('watch'),
        watch_type: 'structure',
        label,
        underlying,
        source: 'user',
        payload: { created_mode: 'manual_structure_scaffold' },
        is_active: true,
      });
    }

    ensureWatchlistSymbolRow(underlying);
    setNewStructureLabel('');
    setNewStructureUnderlying('');
  };

  const toggleStructureInfoHubPromotion = (watchId: string) => {
    togglePinnedKey(`structure:${watchId}`);
  };

  const dismissAlertEvent = (alertEventId: string) => {
    const target = alertHistory.find((event) => event.alert_event_id === alertEventId);
    if (!target) return;

    appendAlertEvent({
      alert_event_id: createId('alert_event'),
      alert_id: target.alert_id,
      event_type: 'dismissed',
      event_ts: new Date().toISOString(),
      symbol: target.symbol,
      payload: { dismissed_event_id: alertEventId },
    });

    setAlertHistory((prev) => prev.filter((event) => event.alert_event_id !== alertEventId));
  };

  const activeStructureWatches = watchObjects.filter(
    (watch) => watch.watch_type === 'structure' && watch.is_active
  );

  const infoHubCards = useMemo<InfoHubCard[]>(() => {
    const kpiCards: InfoHubCard[] = [
      {
        card_id: 'kpi_netliq',
        card_type: 'kpi',
        title: 'Net Liq',
        subtitle: 'System KPI',
        value: netLiq !== null ? `$${netLiq.toLocaleString()}` : '—',
        secondary_value: 'Live',
        priority: 'low',
        source: 'system',
        series: netLiq !== null ? [netLiq * 0.995, netLiq * 1.002, netLiq] : [],
      },
      {
        card_id: 'kpi_bp',
        card_type: 'kpi',
        title: 'BP',
        subtitle: 'System KPI',
        value: bp !== null ? `$${bp.toLocaleString()}` : '—',
        secondary_value: 'Live',
        priority: 'low',
        source: 'system',
        series: bp !== null ? [bp * 0.99, bp * 1.01, bp] : [],
      },
      {
        card_id: 'kpi_25x',
        card_type: 'system',
        title: '25x Limit',
        subtitle: 'System Cap',
        value:
          netLiq !== null
            ? `$${(netLiq * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : '—',
        secondary_value: 'Derived',
        priority: 'low',
        source: 'system',
        series: netLiq !== null ? [netLiq * 24.7, netLiq * 24.9, netLiq * 25] : [],
      },
    ];

    const latestTriggeredByAlert = new Map<string, AlertEvent>();
    alertHistory
      .filter((event) => event.event_type === 'triggered')
      .forEach((event) => {
        if (!latestTriggeredByAlert.has(event.alert_id)) {
          latestTriggeredByAlert.set(event.alert_id, event);
        }
      });

    const alertCards: InfoHubCard[] = Array.from(latestTriggeredByAlert.values())
      .map((event) => {
        const rule = alertRules.find((item) => item.alert_id === event.alert_id);
        if (!rule) return null;

        const currentValue =
          typeof event.payload.current_value === 'number'
            ? Number(event.payload.current_value)
            : Number(rule.target_value);

        return {
          card_id: `alert:${event.alert_id}`,
          card_type: 'alert',
          title: `${rule.symbol} Alert`,
          subtitle: `${getFieldLabel(rule.field_name)} ${getOperatorLabel(rule.operator)} ${rule.target_value}`,
          value: Number.isFinite(currentValue) ? currentValue.toFixed(2) : rule.target_value,
          secondary_value: new Date(event.event_ts).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          priority: 'high',
          source: 'alerts',
          series: Number.isFinite(currentValue)
            ? [currentValue * 0.995, currentValue * 1.003, currentValue]
            : [],
        } as InfoHubCard;
      })
      .filter((card): card is InfoHubCard => card !== null);

    const alertedSymbols = new Set(alertCards.map((card) => card.title.split(' ')[0]));

    const symbolCards: InfoHubCard[] = watchObjects
      .filter((watch) => watch.watch_type === 'symbol' && watch.is_active)
      .map((watch) => {
        const row = watchlistRows.find((item) => item.symbol === watch.underlying);
        const pinned = pinnedInfoHubKeys.includes(`symbol:${watch.underlying}`);

        if (!row) {
          return {
            card_id: `symbol:${watch.watch_id}`,
            card_type: 'symbol',
            title: watch.label,
            subtitle: 'User Watch',
            value: '—',
            secondary_value: 'Awaiting quote',
            priority: pinned ? 'high' : 'medium',
            source: 'alerts',
            series: [],
          } as InfoHubCard;
        }

        if (alertedSymbols.has(row.symbol) && !pinned) return null;

        return {
          card_id: `symbol:${watch.watch_id}`,
          card_type: 'symbol',
          title: watch.label,
          subtitle: 'User Watch',
          value: formatPrice(row.latest),
          secondary_value: formatSignedPct(row.pctChange),
          priority: pinned ? 'high' : 'medium',
          source: 'alerts',
          series: [row.latest * 0.997, row.latest * 1.002, row.latest],
        } as InfoHubCard;
      })
      .filter((card): card is InfoHubCard => card !== null);

    const structureCards: InfoHubCard[] = watchObjects
      .filter((watch) => watch.watch_type === 'structure' && watch.is_active)
      .map((watch) => {
        const pinned = pinnedInfoHubKeys.includes(`structure:${watch.watch_id}`);

        return {
          card_id: `structure:${watch.watch_id}`,
          card_type: 'structure',
          title: watch.label,
          subtitle: `${watch.underlying} · Structure Watch`,
          value: watch.underlying,
          secondary_value: pinned ? 'Pinned' : 'Watched',
          priority: pinned ? 'high' : 'medium',
          source: 'alerts',
          series: [],
        } as InfoHubCard;
      });

    const underlyingCards: InfoHubCard[] = [];

    const allCards = [
      ...alertCards,
      ...symbolCards,
      ...structureCards,
      ...underlyingCards,
      ...kpiCards,
    ];

    const uniqueById = new Map<string, InfoHubCard>();
    allCards.forEach((card) => {
      if (!uniqueById.has(card.card_id)) {
        uniqueById.set(card.card_id, card);
      }
    });

    return Array.from(uniqueById.values()).sort((a, b) => {
      const priorityDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.title.localeCompare(b.title);
    });
  }, [alertHistory, alertRules, bp, netLiq, pinnedInfoHubKeys, watchObjects, watchlistRows]);

  const watchlistExpanded = expanded.watchlist;
  const infoHubSpan = layout.infoHub.colEnd - layout.infoHub.colStart;
  const maxInfoHubCards = expanded.positions ? Math.max(3, infoHubSpan) : Math.max(4, infoHubSpan + 1);
  const visibleInfoHubCards = infoHubCards.slice(0, maxInfoHubCards);
  const renderedHistory = alertHistory.slice(0, 8);

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
              style={{
                border: '1px solid #2a2a2a',
                background: '#080808',
                color: '#ddd',
                padding: '4px 8px',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Journal
            </button>

            <button
              onClick={openArtifactTestHook}
              style={{
                border: '1px solid #2a2a2a',
                background: '#080808',
                color: '#ddd',
                padding: '4px 8px',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Artifact Test
            </button>

            <button
              onClick={() => applyPreset('default')}
              style={{
                border: '1px solid #2a2a2a',
                background:
                  !expanded.newPanel &&
                  !expanded.watchlist &&
                  !expanded.positions &&
                  !expanded.scanners &&
                  !expanded.newPanel2
                    ? '#1f1f1f'
                    : '#080808',
                color: '#ddd',
                padding: '4px 8px',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Default State
            </button>

            <button
              onClick={() => applyPreset('preset2')}
              style={{
                border: '1px solid #2a2a2a',
                background:
                  expanded.newPanel &&
                  expanded.watchlist &&
                  expanded.scanners &&
                  expanded.newPanel2 &&
                  !expanded.positions
                    ? '#1f1f1f'
                    : '#080808',
                color: '#ddd',
                padding: '4px 8px',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Outer + Watchlist/Scanners
            </button>

            <button
              onClick={() => applyPreset('preset3')}
              style={{
                border: '1px solid #2a2a2a',
                background:
                  expanded.newPanel &&
                  expanded.positions &&
                  expanded.newPanel2 &&
                  !expanded.watchlist &&
                  !expanded.scanners
                    ? '#1f1f1f'
                    : '#080808',
                color: '#ddd',
                padding: '4px 8px',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Outer + Positions
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          style={{
            height: 'calc(100vh - 34px)',
            overflowX: 'auto',
            overflowY: 'hidden',
            background: '#0a0a0a',
          }}
        >
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
            <div
              style={{
                ...basePanel,
                ...areaStyle(layout.newPanel),
                background: '#fd18fa',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="panel-head">
                <span>{expanded.newPanel ? 'ALERT CENTER - EXPANDED' : 'ALERT CENTER - COLLAPSED'}</span>
                <button onClick={() => togglePanel('newPanel')}>{expanded.newPanel ? '−' : '+'}</button>
              </div>

              <AlertsPanel
                quoteRows={watchlistRows.map((row) => ({
                  symbol: row.symbol,
                  latest: row.latest,
                  pctChange: row.pctChange,
                }))}
              />
            </div>

            <div
              style={{
                ...basePanel,
                ...areaStyle(layout.watchlist),
                background: '#15e80f',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="panel-head">
                <span>{watchlistExpanded ? 'WATCHLIST - EXPANDED' : 'WATCHLIST - COLLAPSED'}</span>
                <button onClick={() => togglePanel('watchlist')}>{watchlistExpanded ? '−' : '+'}</button>
              </div>

              <div style={{ flex: 1, minHeight: 0 }}>
                <WatchlistPanel
                  quoteRows={watchlistRows.map((row) => ({
                    symbol: row.symbol,
                    latest: row.latest,
                    pctChange: row.pctChange,
                  }))}
                  onLaunchArtifact={launchArtifactFromWatchlist}
                />
              </div>
            </div>

            <div
              style={{
                ...basePanel,
                ...areaStyle(layout.infoHub),
                background: '#ff2618',
                display: 'flex',
                flexDirection: 'column',
                padding: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  color: '#111',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 24 }}>INFO HUB</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>
                  {visibleInfoHubCards.length} cards · low-noise
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(
                    visibleInfoHubCards.length || 1,
                    expanded.positions ? Math.max(1, infoHubSpan) : Math.max(2, infoHubSpan)
                  )}, minmax(0, 1fr))`,
                  gap: 8,
                  flex: 1,
                  alignContent: 'start',
                }}
              >
                {visibleInfoHubCards.map((card) => {
                  const priorityBorder =
                    card.priority === 'high'
                      ? '3px solid rgba(127, 29, 29, 0.8)'
                      : card.priority === 'medium'
                        ? '3px solid rgba(120, 53, 15, 0.7)'
                        : '3px solid rgba(17, 24, 39, 0.35)';

                  const secondaryColor =
                    card.card_type === 'alert'
                      ? '#7f1d1d'
                      : card.secondary_value.startsWith('+')
                        ? '#0f5132'
                        : card.secondary_value.startsWith('-')
                          ? '#7f1d1d'
                          : '#111';

                  return (
                    <div
                      key={card.card_id}
                      style={{
                        background: 'rgba(255,255,255,0.14)',
                        borderLeft: priorityBorder,
                        padding: expanded.positions ? '8px 10px' : '10px 12px',
                        minHeight: expanded.positions ? 72 : 96,
                        display: 'grid',
                        gridTemplateRows: 'auto 1fr auto',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          alignItems: 'start',
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: expanded.positions ? 11 : 12,
                              fontWeight: 700,
                              color: '#111',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {card.title}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: '#111',
                              opacity: 0.82,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {card.subtitle}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#111',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {card.card_type.toUpperCase()}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: expanded.positions ? 22 : 28,
                            fontWeight: 700,
                            color: '#111',
                            lineHeight: 1,
                          }}
                        >
                          {card.value}
                        </div>

                        {!expanded.positions && card.series.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 3,
                              alignItems: 'flex-end',
                              height: 26,
                            }}
                          >
                            {card.series.map((point, index) => {
                              const base = Math.max(...card.series, 1);
                              const height = Math.max(4, Math.round((point / base) * 24));
                              return (
                                <div
                                  key={`${card.card_id}-series-${index}`}
                                  style={{
                                    width: 6,
                                    height,
                                    background: 'rgba(17,17,17,0.6)',
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: secondaryColor,
                          marginTop: 6,
                        }}
                      >
                        {card.secondary_value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                ...basePanel,
                ...areaStyle(layout.positions),
                background: '#4d84da',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="panel-head">
                <span>{expanded.positions ? 'POSITIONS - EXPANDED' : 'POSITIONS - COLLAPSED'}</span>
                <button onClick={() => togglePanel('positions')}>{expanded.positions ? '−' : '+'}</button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <PositionsPanel />
              </div>
            </div>

            <div
              style={{
                ...basePanel,
                ...areaStyle(layout.scanners),
                background: '#e1ca68',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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

            <div
              style={{
                ...basePanel,
                ...areaStyle(layout.newPanel2),
                background: '#2fc8d3',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="panel-head">
                <span>{expanded.newPanel2 ? 'NEW PANEL 2 - EXPANDED' : 'NEW PANEL 2 - COLLAPSED'}</span>
                <button onClick={() => togglePanel('newPanel2')}>{expanded.newPanel2 ? '−' : '+'}</button>
              </div>

              <div
                className="panel-fill"
                style={{
                  padding: 10,
                  color: '#082f33',
                  fontSize: 11,
                  display: 'grid',
                  alignContent: 'start',
                  gap: 6,
                }}
              >
                <div style={{ fontWeight: 700 }}>INFOHUB / WATCH / ALERT COUNTS</div>
                <div>Watched symbols: {watchObjects.filter((w) => w.watch_type === 'symbol' && w.is_active).length}</div>
                <div>Watched structures: {activeStructureWatches.length}</div>
                <div>Active rules: {alertRules.filter((rule) => rule.is_enabled).length}</div>
                <div>Triggered events: {alertHistory.filter((event) => event.event_type === 'triggered').length}</div>
                <div>Journal popup: {isJournalOpen ? 'Open' : 'Closed'}</div>
                <div>Artifact modal: {artifactStore.isOpen ? 'Open' : 'Closed'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <JournalPopup open={isJournalOpen} onClose={() => setIsJournalOpen(false)} />

      <ArtifactModal store={artifactStore} />
    </>
  );
}


