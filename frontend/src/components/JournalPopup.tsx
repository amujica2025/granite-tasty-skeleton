import { useMemo, useState } from 'react';

type JournalEvent = {
  event_id: string;
  event_type: string;
  event_ts: string;
  source_agent: 'positions' | 'scanner' | 'alerts' | 'artifact' | 'journal';
  underlying: string;
  payload: Record<string, unknown>;
  tags: string[];
};

type JournalEntry = {
  journal_entry_id: string;
  entry_type: 'note' | 'summary' | 'reflection' | 'linked_context';
  created_ts: string;
  title: string;
  body: string;
  source: 'user' | 'journal' | 'system';
  linked_objects: string[];
};

type QueryRequest = {
  query_id: string;
  query_ts: string;
  user_text: string;
  context_filters: Record<string, unknown>;
  mode: 'direct' | 'expanded';
};

type QueryResponse = {
  response_id: string;
  query_id: string;
  answer: string;
  sources: string[];
  confidence_mode: 'stored_context' | 'mixed_context';
  next_actions: string[];
};

type Props = {
  onClose: () => void;
};

type ActiveTab = 'journal' | 'events' | 'schema' | 'ai';

const mockEvents: JournalEvent[] = [
  {
    event_id: 'evt-20260419-001',
    event_type: 'positions.selection.changed',
    event_ts: '2026-04-19T09:11:00Z',
    source_agent: 'positions',
    underlying: 'SPY',
    payload: {
      selected_position_ids: ['1', '3'],
      selected_symbols: ['SPY 240620C550', 'QQQ 240628C460'],
      selection_count: 2,
    },
    tags: ['selection', 'positions', 'working-set'],
  },
  {
    event_id: 'evt-20260419-002',
    event_type: 'artifact.opened',
    event_ts: '2026-04-19T09:18:00Z',
    source_agent: 'artifact',
    underlying: 'SPY',
    payload: {
      artifact_id: 'artifact-risk-curve-001',
      artifact_type: 'risk_curve',
      title: 'SPY risk curve',
    },
    tags: ['artifact', 'review'],
  },
  {
    event_id: 'evt-20260419-003',
    event_type: 'alerts.rule.created',
    event_ts: '2026-04-19T09:42:00Z',
    source_agent: 'alerts',
    underlying: 'QQQ',
    payload: {
      alert_id: 'alert-qqq-roll-credit',
      name: 'QQQ roll credit watch',
      field_name: 'roll_credit_pct_risk',
      operator: '>=',
      target_value: '0.25',
    },
    tags: ['alerts', 'watch'],
  },
  {
    event_id: 'evt-20260419-004',
    event_type: 'journal.entry.created',
    event_ts: '2026-04-19T10:03:00Z',
    source_agent: 'journal',
    underlying: 'SPY',
    payload: {
      journal_entry_id: 'je-20260419-001',
      entry_type: 'summary',
      title: 'SPY adjustment context saved',
    },
    tags: ['journal', 'memory'],
  },
];

const mockEntries: JournalEntry[] = [
  {
    journal_entry_id: 'je-20260419-001',
    entry_type: 'summary',
    created_ts: '2026-04-19T10:03:00Z',
    title: 'SPY adjustment context saved',
    body: 'Selected SPY context was saved after a position-selection change and an artifact review. This is a readable memory object, not just a raw event echo.',
    source: 'journal',
    linked_objects: ['evt-20260419-001', 'evt-20260419-002'],
  },
  {
    journal_entry_id: 'je-20260419-002',
    entry_type: 'note',
    created_ts: '2026-04-19T10:15:00Z',
    title: 'QQQ alert watch rationale',
    body: 'A QQQ alert rule was recorded to monitor roll-credit conditions. This note keeps the intent visible later without forcing the user back into raw alert rows.',
    source: 'user',
    linked_objects: ['evt-20260419-003', 'alert-qqq-roll-credit'],
  },
];

function formatTs(ts: string) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function payloadSummary(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(', ')}`;
      }
      if (value && typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${String(value)}`;
    })
    .join('\n');
}

function buildResponse(
  request: QueryRequest,
  events: JournalEvent[],
  entries: JournalEntry[]
): QueryResponse {
  const text = request.user_text.trim().toLowerCase();

  if (!text) {
    return {
      response_id: `resp-${request.query_id}`,
      query_id: request.query_id,
      answer: 'No query entered.',
      sources: [],
      confidence_mode: 'stored_context',
      next_actions: [],
    };
  }

  const eventMatches = events.filter((event) => {
    const haystack = [
      event.event_type,
      event.event_id,
      event.underlying,
      event.source_agent,
      JSON.stringify(event.payload),
      event.tags.join(' '),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(text);
  });

  const entryMatches = entries.filter((entry) => {
    const haystack = [entry.title, entry.body, entry.entry_type, entry.linked_objects.join(' ')]
      .join(' ')
      .toLowerCase();

    return haystack.includes(text);
  });

  if (request.mode === 'direct') {
    if (eventMatches.length > 0) {
      const first = eventMatches[0];
      return {
        response_id: `resp-${request.query_id}`,
        query_id: request.query_id,
        answer: `${eventMatches.length} matching event(s). Most recent match: ${first.event_type} on ${formatTs(first.event_ts)} from ${first.source_agent}.`,
        sources: eventMatches.map((event) => event.event_id),
        confidence_mode: 'stored_context',
        next_actions: ['Switch to Expanded mode for more detail.', 'Open the Events tab to inspect payload rows.'],
      };
    }

    if (entryMatches.length > 0) {
      const first = entryMatches[0];
      return {
        response_id: `resp-${request.query_id}`,
        query_id: request.query_id,
        answer: `${entryMatches.length} matching journal entr${entryMatches.length === 1 ? 'y' : 'ies'}. Most relevant: "${first.title}".`,
        sources: entryMatches.map((entry) => entry.journal_entry_id),
        confidence_mode: 'stored_context',
        next_actions: ['Open the Journal tab for the readable memory object.'],
      };
    }

    return {
      response_id: `resp-${request.query_id}`,
      query_id: request.query_id,
      answer: 'No matching stored context found in the current scaffold data.',
      sources: [],
      confidence_mode: 'stored_context',
      next_actions: ['Try a symbol, event type, or source agent term.'],
    };
  }

  if (eventMatches.length === 0 && entryMatches.length === 0) {
    return {
      response_id: `resp-${request.query_id}`,
      query_id: request.query_id,
      answer: 'No matching stored context found in the current scaffold data.',
      sources: [],
      confidence_mode: 'stored_context',
      next_actions: ['Try a narrower query like SPY, alerts, artifact, or selection.'],
    };
  }

  const lines: string[] = [];
  if (eventMatches.length > 0) {
    lines.push(`Events (${eventMatches.length})`);
    eventMatches.forEach((event) => {
      lines.push(
        `- ${event.event_type} | ${formatTs(event.event_ts)} | ${event.source_agent} | ${event.underlying || '—'}`
      );
    });
  }
  if (entryMatches.length > 0) {
    lines.push(`Journal entries (${entryMatches.length})`);
    entryMatches.forEach((entry) => {
      lines.push(`- ${entry.title} | ${formatTs(entry.created_ts)} | ${entry.entry_type}`);
    });
  }

  return {
    response_id: `resp-${request.query_id}`,
    query_id: request.query_id,
    answer: lines.join('\n'),
    sources: [
      ...eventMatches.map((event) => event.event_id),
      ...entryMatches.map((entry) => entry.journal_entry_id),
    ],
    confidence_mode: 'stored_context',
    next_actions: ['Review linked rows in Journal or Events.', 'Refine the query for a smaller working set.'],
  };
}

export default function JournalPopup({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('journal');
  const [queryText, setQueryText] = useState('');
  const [queryMode, setQueryMode] = useState<'direct' | 'expanded'>('direct');
  const [lastResponse, setLastResponse] = useState<QueryResponse | null>(null);

  const schemaCards = useMemo(
    () => [
      {
        title: 'Journal Event',
        subtitle: 'Primary event-store input. Structured history, readable in rows.',
        fields: [
          ['event_id', 'string'],
          ['event_type', 'string'],
          ['event_ts', 'ISO-8601'],
          ['source_agent', 'positions | scanner | alerts | artifact | journal'],
          ['underlying', 'string'],
          ['payload', 'object'],
          ['tags', 'string[]'],
        ],
      },
      {
        title: 'Journal Entry',
        subtitle: 'Human-readable memory object. Separate from raw event rows.',
        fields: [
          ['journal_entry_id', 'string'],
          ['entry_type', 'note | summary | reflection | linked_context'],
          ['created_ts', 'ISO-8601'],
          ['title', 'string'],
          ['body', 'string'],
          ['source', 'user | journal | system'],
          ['linked_objects', 'string[]'],
        ],
      },
      {
        title: 'Query Request',
        subtitle: 'AI shell input. Direct mode stays concise. Expanded mode goes deeper.',
        fields: [
          ['query_id', 'string'],
          ['query_ts', 'ISO-8601'],
          ['user_text', 'string'],
          ['context_filters', 'object'],
          ['mode', 'direct | expanded'],
        ],
      },
      {
        title: 'Query Response',
        subtitle: 'Grounded answer output. Uses stored scaffold context only.',
        fields: [
          ['response_id', 'string'],
          ['query_id', 'string'],
          ['answer', 'string'],
          ['sources', 'string[]'],
          ['confidence_mode', 'stored_context | mixed_context'],
          ['next_actions', 'string[]'],
        ],
      },
    ],
    []
  );

  const runQuery = () => {
    const request: QueryRequest = {
      query_id: `qry-${Date.now()}`,
      query_ts: new Date().toISOString(),
      user_text: queryText,
      context_filters: {},
      mode: queryMode,
    };

    setLastResponse(buildResponse(request, mockEvents, mockEntries));
  };

  return (
    <div className="journal-overlay" role="dialog" aria-modal="true" aria-label="Journal DB AI popup">
      <div className="journal-popup">
        <div className="journal-header">
          <div className="journal-header-left">
            <div className="journal-title">Journal / DB / AI</div>
            <div className="journal-subtitle">Memory terminal for stored events, readable context, schema visibility, and grounded query answers.</div>
          </div>

          <button className="journal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="journal-tabs">
          <button
            className={`journal-tab ${activeTab === 'journal' ? 'journal-tab-active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            Journal
          </button>
          <button
            className={`journal-tab ${activeTab === 'events' ? 'journal-tab-active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={`journal-tab ${activeTab === 'schema' ? 'journal-tab-active' : ''}`}
            onClick={() => setActiveTab('schema')}
          >
            Schema
          </button>
          <button
            className={`journal-tab ${activeTab === 'ai' ? 'journal-tab-active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI
          </button>
        </div>

        <div className="journal-content">
          {activeTab === 'journal' ? (
            mockEntries.length > 0 ? (
              <div className="journal-entry-list">
                {mockEntries.map((entry) => (
                  <div key={entry.journal_entry_id} className="journal-entry-card">
                    <div className="journal-entry-meta">
                      <div className="journal-entry-type">{entry.entry_type}</div>
                      <div className="journal-entry-ts">{formatTs(entry.created_ts)}</div>
                    </div>
                    <div className="journal-entry-title">{entry.title}</div>
                    <div className="journal-entry-body">{entry.body}</div>
                    <div className="journal-linked-objects">
                      {entry.linked_objects.map((objectId) => (
                        <div key={objectId} className="journal-linked-chip">
                          {objectId}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="journal-empty">No journal entries recorded yet.</div>
            )
          ) : null}

          {activeTab === 'events' ? (
            mockEvents.length > 0 ? (
              <div className="event-log-shell">
                <div className="event-log-head">
                  <div>Timestamp</div>
                  <div>Event Type</div>
                  <div>Source</div>
                  <div>Underlying</div>
                  <div>Payload</div>
                </div>

                {mockEvents.map((event) => (
                  <div key={event.event_id} className="event-log-row">
                    <div className="event-ts">{formatTs(event.event_ts)}</div>
                    <div>
                      <div className="event-type-badge">{event.event_type}</div>
                    </div>
                    <div>
                      <div className="event-source-badge">{event.source_agent}</div>
                    </div>
                    <div className="event-underlying">{event.underlying || '—'}</div>
                    <div className="event-payload">{payloadSummary(event.payload)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="journal-empty">No events recorded yet.</div>
            )
          ) : null}

          {activeTab === 'schema' ? (
            <div className="schema-grid">
              {schemaCards.map((card) => (
                <div key={card.title} className="schema-card">
                  <div className="schema-card-title">{card.title}</div>
                  <div className="schema-card-subtitle">{card.subtitle}</div>
                  <div className="schema-field-list">
                    {card.fields.map(([name, type]) => (
                      <div key={`${card.title}-${name}`} className="schema-field-row">
                        <div className="schema-field-name">{name}</div>
                        <div className="schema-field-type">{type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === 'ai' ? (
            <div className="ai-shell">
              <div className="ai-mode-row">
                <button
                  className={`ai-mode-btn ${queryMode === 'direct' ? 'ai-mode-btn-active' : ''}`}
                  onClick={() => setQueryMode('direct')}
                >
                  Direct
                </button>
                <button
                  className={`ai-mode-btn ${queryMode === 'expanded' ? 'ai-mode-btn-active' : ''}`}
                  onClick={() => setQueryMode('expanded')}
                >
                  Expanded
                </button>
              </div>

              <div className="ai-input-row">
                <input
                  className="ai-input"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Ask from stored context. Example: SPY, alerts, artifact, selection"
                />
                <button className="ai-run-btn" onClick={runQuery}>
                  Run Query
                </button>
              </div>

              <div className="ai-response-card">
                <div className="ai-answer-block">
                  <div className="ai-label">Answer</div>
                  <div className="ai-answer">
                    {lastResponse?.answer ?? 'No query run yet.'}
                  </div>
                </div>

                <div className="ai-meta-row">
                  <div>
                    <div className="ai-label">Sources</div>
                    <div className="ai-chip-row">
                      {(lastResponse?.sources ?? []).length > 0 ? (
                        lastResponse!.sources.map((source) => (
                          <div key={source} className="ai-chip">
                            {source}
                          </div>
                        ))
                      ) : (
                        <div className="ai-chip">None</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="ai-label">Confidence Mode</div>
                    <div className="ai-chip-row">
                      <div className="ai-chip">{lastResponse?.confidence_mode ?? 'stored_context'}</div>
                    </div>
                  </div>

                  <div>
                    <div className="ai-label">Next Actions</div>
                    <div className="ai-chip-row">
                      {(lastResponse?.next_actions ?? []).length > 0 ? (
                        lastResponse!.next_actions.map((action) => (
                          <div key={action} className="ai-chip">
                            {action}
                          </div>
                        ))
                      ) : (
                        <div className="ai-chip">None</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}