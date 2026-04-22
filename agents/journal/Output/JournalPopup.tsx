// frontend/src/components/journal/JournalPopup.tsx

import React, { useEffect, useMemo, useState } from 'react';

type JournalEntry = {
  id: string;
  timestamp: number;
  source?: string;
  symbol?: string;
  note: string;
};

type JournalPrefill = {
  source: 'watchlist' | 'alerts-rule' | 'alerts-history' | 'scanner';
  symbol?: string;
  note?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  prefill?: JournalPrefill | null;
};

const STORAGE_KEY = 'journal_entries_v1';

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        typeof e.id === 'string' &&
        typeof e.timestamp === 'number' &&
        typeof e.note === 'string'
    );
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function sanitizeImport(input: any): JournalEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((e) => ({
      id: typeof e.id === 'string' ? e.id : `${Date.now()}_${Math.random()}`,
      timestamp:
        typeof e.timestamp === 'number' ? e.timestamp : Date.now(),
      source: typeof e.source === 'string' ? e.source : undefined,
      symbol: typeof e.symbol === 'string' ? e.symbol : undefined,
      note: typeof e.note === 'string' ? e.note : '',
    }))
    .filter((e) => e.note.length > 0);
}

export default function JournalPopup({ open, onClose, prefill }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    if (!prefill) return;

    const summary = [
      prefill.source.toUpperCase(),
      prefill.symbol || '',
      prefill.note || '',
    ]
      .filter(Boolean)
      .join(' | ');

    setNote(summary);
  }, [prefill]);

  const addEntry = () => {
    if (!note.trim()) return;

    const entry: JournalEntry = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      note: note.trim(),
    };

    setEntries((prev) => [entry, ...prev]);
    setNote('');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'journal_export.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const sanitized = sanitizeImport(parsed);

        setEntries((prev) => {
          const ids = new Set(prev.map((e) => e.id));
          const merged = [
            ...sanitized.filter((e) => !ids.has(e.id)),
            ...prev,
          ];
          return merged;
        });
      } catch {}
    };
    reader.readAsText(file);
  };

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.timestamp - a.timestamp),
    [entries]
  );

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          right: '10%',
          bottom: '10%',
          background: '#111',
          color: '#fff',
          padding: 16,
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Journal</h3>

        <div style={{ marginBottom: 12 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write note..."
            style={{ width: '100%', height: 80 }}
          />
          <button onClick={addEntry}>Add</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <button onClick={exportJson}>Export JSON</button>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
            }}
          />
        </div>

        <div>
          {sortedEntries.map((e) => (
            <div key={e.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {new Date(e.timestamp).toLocaleString()}
              </div>
              <div>{e.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}