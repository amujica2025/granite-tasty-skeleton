import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertHistoryEntry, AlertRule } from './alertsTypes';
import {
  sendDesktopNotification,
  sendPushoverRuntime,
  shouldTriggerRule,
} from './alertsUtils';

type QuoteRow = {
  symbol: string;
  latest: number;
  pctChange: number;
};

type Props = {
  quoteRows: QuoteRow[];
};

const STORAGE_KEY = 'alerts_rules_v2';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#101010',
  color: '#f3f4f6',
  border: '1px solid #242424',
  padding: '6px 8px',
  fontSize: 11,
  outline: 'none',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 10,
  color: '#d1d5db',
};

const actionButtonStyle: React.CSSProperties = {
  border: '1px solid #242424',
  background: '#0d0d0d',
  color: '#e5e7eb',
  padding: '4px 8px',
  fontSize: 10,
  cursor: 'pointer',
};

function newRule(): AlertRule {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    symbol: 'SPY',
    field: 'price',
    operator: '>',
    value: 0,
    enabled: true,
    desktop: true,
    pushover: false,
    triggerOnceUntilReset: false,
    cooldownMs: 0,
  };
}

function loadRules(): AlertRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [newRule()];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [newRule()];
    return parsed.map((rule) => ({ ...newRule(), ...rule }));
  } catch {
    return [newRule()];
  }
}

export default function AlertsPanel({ quoteRows }: Props) {
  const [rules, setRules] = useState<AlertRule[]>(() => loadRules());
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const prevValuesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    const now = Date.now();

    quoteRows.forEach((row) => {
      rules.forEach((rule) => {
        if (!rule.enabled || rule.symbol !== row.symbol) return;

        const fieldKey = `${row.symbol}_${rule.field}`;
        const prev = prevValuesRef.current[fieldKey];
        const currentValue = rule.field === 'price' ? row.latest : row.pctChange;
        const triggered = shouldTriggerRule(rule, prev, currentValue, now);

        if (triggered) {
          const message = `${rule.symbol} ${rule.field} ${rule.operator} ${rule.value}`;
          const entry: AlertHistoryEntry = {
            id: `${now}_${Math.random().toString(36).slice(2, 8)}`,
            symbol: row.symbol,
            message,
            timestamp: now,
          };

          setHistory((existing) => [entry, ...existing].slice(0, 50));

          setRules((existing) =>
            existing.map((existingRule) =>
              existingRule.id === rule.id ? { ...existingRule, lastTriggeredAt: now } : existingRule
            )
          );

          if (rule.desktop) sendDesktopNotification(message);
          if (rule.pushover) {
            void sendPushoverRuntime(message);
          }
        }

        prevValuesRef.current[fieldKey] = currentValue;
      });
    });
  }, [quoteRows, rules]);

  const sortedRules = useMemo(() => [...rules], [rules]);

  const updateRule = (id: string, updates: Partial<AlertRule>) => {
    setRules((existing) => existing.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)));
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) 150px',
        gap: 8,
        padding: 8,
        background: '#060606',
        color: '#f3f4f6',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: 8,
          border: '1px solid #161616',
          background: '#0b0b0b',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>DEDICATED ALERTS PANEL</div>
        <button onClick={() => setRules((existing) => [newRule(), ...existing])} style={actionButtonStyle}>
          Add Rule
        </button>
      </div>

      <div style={{ minHeight: 0, overflow: 'auto', border: '1px solid #161616', background: '#0b0b0b' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '92px 70px 92px 74px 1fr auto',
            gap: 8,
            padding: '8px 10px',
            borderBottom: '1px solid #161616',
            fontSize: 10,
            fontWeight: 700,
            color: '#9ca3af',
            letterSpacing: '0.04em',
            position: 'sticky',
            top: 0,
            background: '#0b0b0b',
            zIndex: 2,
          }}
        >
          <div>SYMBOL</div>
          <div>FIELD</div>
          <div>OPERATOR</div>
          <div>TARGET</div>
          <div>OPTIONS</div>
          <div>ACTIONS</div>
        </div>

        {sortedRules.map((rule) => (
          <div
            key={rule.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '92px 70px 92px 74px 1fr auto',
              gap: 8,
              padding: '8px 10px',
              borderBottom: '1px solid #121212',
              alignItems: 'start',
            }}
          >
            <input
              value={rule.symbol}
              onChange={(e) => updateRule(rule.id, { symbol: e.target.value.toUpperCase() })}
              style={inputStyle}
            />

            <select
              value={rule.field}
              onChange={(e) => updateRule(rule.id, { field: e.target.value as AlertRule['field'] })}
              style={inputStyle}
            >
              <option value="price">price</option>
              <option value="%">%</option>
            </select>

            <select
              value={rule.operator}
              onChange={(e) => updateRule(rule.id, { operator: e.target.value as AlertRule['operator'] })}
              style={inputStyle}
            >
              <option value=">">{'>'}</option>
              <option value="<">{'<'}</option>
              <option value=">=">{'>='}</option>
              <option value="<=">{'<='}</option>
              <option value="crosses_above">crosses above</option>
              <option value="crosses_below">crosses below</option>
            </select>

            <input
              type="number"
              value={Number.isFinite(rule.value) ? rule.value : 0}
              onChange={(e) => updateRule(rule.id, { value: Number(e.target.value) })}
              style={inputStyle}
            />

            <div style={{ display: 'grid', gap: 6, paddingTop: 2 }}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                />
                enabled
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={rule.desktop}
                  onChange={(e) => updateRule(rule.id, { desktop: e.target.checked })}
                />
                desktop
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={rule.pushover}
                  onChange={(e) => updateRule(rule.id, { pushover: e.target.checked })}
                />
                pushover
              </label>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <button onClick={() => setRules((existing) => existing.filter((item) => item.id !== rule.id))} style={actionButtonStyle}>
                Remove
              </button>
              <button
                onClick={() => updateRule(rule.id, { lastTriggeredAt: undefined })}
                style={actionButtonStyle}
              >
                Reset
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ minHeight: 0, overflow: 'auto', border: '1px solid #161616', background: '#0b0b0b' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderBottom: '1px solid #161616',
            fontSize: 10,
            fontWeight: 700,
            color: '#9ca3af',
            letterSpacing: '0.04em',
          }}
        >
          <span>HISTORY</span>
          <span>{history.length}</span>
        </div>

        <div style={{ padding: '6px 10px', display: 'grid', gap: 6 }}>
          {history.length === 0 ? (
            <div style={{ fontSize: 11, color: '#6b7280' }}>No triggers yet.</div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} style={{ fontSize: 11, borderBottom: '1px solid #121212', paddingBottom: 6 }}>
                <div style={{ color: '#e5e7eb' }}>{entry.message}</div>
                <div style={{ color: '#6b7280', fontSize: 10 }}>
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
