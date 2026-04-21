import { useEffect, useMemo, useState } from 'react';

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
  open?: boolean;
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
      (entry) =>
        typeof entry.id === 'string' &&
        typeof entry.timestamp === 'number' &&
        typeof entry.note === 'string'
    );
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage failures
  }
}

function sanitizeImport(input: unknown): JournalEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => ({
      id: typeof entry?.id === 'string' ? entry.id : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: typeof entry?.timestamp === 'number' ? entry.timestamp : Date.now(),
      source: typeof entry?.source === 'string' ? entry.source : undefined,
      symbol: typeof entry?.symbol === 'string' ? entry.symbol : undefined,
      note: typeof entry?.note === 'string' ? entry.note : '',
    }))
    .filter((entry) => entry.note.trim().length > 0);
}

export default function JournalPopup({ open = true, onClose, prefill }: Props) {
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
    const summary = [prefill.source.toUpperCase(), prefill.symbol || '', prefill.note || '']
      .filter(Boolean)
      .join(' | ');
    setNote(summary);
  }, [prefill]);

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => b.timestamp - a.timestamp), [entries]);

  if (!open) return null;

  return (
    <div className="journal-overlay" onClick={onClose}>
      <div className="journal-popup" onClick={(event) => event.stopPropagation()}>
        <div className="journal-header">
          <span>JOURNAL</span>
          <button onClick={onClose}>Close</button>
        </div>

        <div className="journal-tabs">
          <button className="journal-tab active" type="button">
            Notes
          </button>
        </div>

        <div className="journal-body">
          <div className="journal-card">
            <div className="journal-card-title">NEW ENTRY</div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write note..."
              style={{ width: '100%', minHeight: 88, background: '#070707', color: '#fff', border: '1px solid #202020', padding: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => {
                  if (!note.trim()) return;
                  const entry: JournalEntry = {
                    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    timestamp: Date.now(),
                    note: note.trim(),
                  };
                  setEntries((existing) => [entry, ...existing]);
                  setNote('');
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = 'journal_export.json';
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export JSON
              </button>
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const parsed = JSON.parse(String(reader.result));
                      const sanitized = sanitizeImport(parsed);
                      setEntries((existing) => {
                        const ids = new Set(existing.map((entry) => entry.id));
                        return [...sanitized.filter((entry) => !ids.has(entry.id)), ...existing];
                      });
                    } catch {
                      // ignore import failure
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </div>
          </div>

          <div className="journal-card">
            <div className="journal-card-title">ENTRY HISTORY</div>
            <div className="journal-grid">
              {sortedEntries.length === 0 ? (
                <div className="journal-ai-box">No entries yet.</div>
              ) : (
                sortedEntries.map((entry) => (
                  <div key={entry.id} className="journal-ai-box">
                    <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 6 }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div>{entry.note}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
