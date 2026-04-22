// frontend/src/components/alerts/AlertsPanel.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertRule, AlertHistoryEntry } from './alertsTypes';
import {
  evaluateRule,
  shouldTriggerRule,
  sendDesktopNotification,
  sendPushoverRuntime,
} from './alertsUtils';

type QuoteRow = {
  symbol: string;
  latest: number;
  pctChange: number;
};

type Props = {
  quoteRows: QuoteRow[];
};

export default function AlertsPanel({ quoteRows }: Props) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);

  const prevValuesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem('alerts_rules');
    if (stored) {
      setRules(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('alerts_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    quoteRows.forEach((row) => {
      const keyBase = row.symbol;

      rules.forEach((rule) => {
        if (!rule.enabled) return;
        if (rule.symbol !== row.symbol) return;

        const fieldKey = `${keyBase}_${rule.field}`;
        const prev = prevValuesRef.current[fieldKey];

        const currentValue =
          rule.field === 'price' ? row.latest : row.pctChange;

        const triggered = shouldTriggerRule(rule, prev, currentValue);

        if (triggered) {
          const entry: AlertHistoryEntry = {
            id: `${Date.now()}_${Math.random()}`,
            symbol: row.symbol,
            message: `${rule.symbol} ${rule.field} ${rule.operator} ${rule.value}`,
            timestamp: Date.now(),
          };

          setHistory((h) => [entry, ...h]);

          if (rule.desktop) {
            sendDesktopNotification(entry.message);
          }

          if (rule.pushover) {
            sendPushoverRuntime(entry.message);
          }
        }

        prevValuesRef.current[fieldKey] = currentValue;
      });
    });
  }, [quoteRows, rules]);

  const addRule = () => {
    const newRule: AlertRule = {
      id: `${Date.now()}`,
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
    setRules((r) => [newRule, ...r]);
  };

  const updateRule = (id: string, updates: Partial<AlertRule>) => {
    setRules((rules) =>
      rules.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRule = (id: string) => {
    setRules((rules) => rules.filter((r) => r.id !== id));
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Alerts</h3>

      <button onClick={addRule}>Add Rule</button>

      <div style={{ marginTop: 12 }}>
        {rules.map((rule) => (
          <div key={rule.id} style={{ marginBottom: 8 }}>
            <input
              value={rule.symbol}
              onChange={(e) =>
                updateRule(rule.id, { symbol: e.target.value.toUpperCase() })
              }
            />

            <select
              value={rule.field}
              onChange={(e) =>
                updateRule(rule.id, { field: e.target.value as any })
              }
            >
              <option value="price">price</option>
              <option value="%">%</option>
            </select>

            <select
              value={rule.operator}
              onChange={(e) =>
                updateRule(rule.id, { operator: e.target.value as any })
              }
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
              value={rule.value}
              onChange={(e) =>
                updateRule(rule.id, { value: Number(e.target.value) })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) =>
                  updateRule(rule.id, { enabled: e.target.checked })
                }
              />
              enabled
            </label>

            <label>
              <input
                type="checkbox"
                checked={rule.desktop}
                onChange={(e) =>
                  updateRule(rule.id, { desktop: e.target.checked })
                }
              />
              desktop
            </label>

            <label>
              <input
                type="checkbox"
                checked={rule.pushover}
                onChange={(e) =>
                  updateRule(rule.id, { pushover: e.target.checked })
                }
              />
              pushover
            </label>

            <button onClick={() => deleteRule(rule.id)}>X</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>History</h4>
        {history.map((h) => (
          <div key={h.id}>
            {new Date(h.timestamp).toLocaleTimeString()} — {h.message}
          </div>
        ))}
      </div>
    </div>
  );
}