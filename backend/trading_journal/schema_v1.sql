CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    symbol TEXT,
    account_id TEXT,
    trade_id UUID,
    order_id UUID,
    position_id UUID,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags_json JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_events_ts_desc ON events (event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events (event_type, event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_symbol_ts ON events (symbol, event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING GIN (payload_json);

CREATE TABLE IF NOT EXISTS journal_entries (
    journal_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    symbol TEXT,
    trade_id UUID,
    title TEXT NOT NULL,
    body_md TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(1536)
);

CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    artifact_type TEXT NOT NULL,
    title TEXT NOT NULL,
    request_text TEXT,
    data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_path TEXT
);

CREATE TABLE IF NOT EXISTS artifact_annotations (
    annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    author TEXT NOT NULL DEFAULT 'user',
    annotation_type TEXT NOT NULL,
    geometry_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    style_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    text_value TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    symbol TEXT,
    field_name TEXT NOT NULL,
    operator TEXT NOT NULL,
    target_value TEXT NOT NULL,
    desktop BOOLEAN NOT NULL DEFAULT true,
    pushover BOOLEAN NOT NULL DEFAULT true,
    cooldown_seconds INT NOT NULL DEFAULT 60,
    created_by TEXT NOT NULL DEFAULT 'manual',
    created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_events (
    alert_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(alert_id) ON DELETE CASCADE,
    fired_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_type TEXT NOT NULL,
    matched_value TEXT,
    detail_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS alert_delivery_log (
    alert_delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_event_id UUID NOT NULL REFERENCES alert_events(alert_event_id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS alertable_fields (
    field_name TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    data_type TEXT NOT NULL,
    source_table TEXT NOT NULL,
    source_scope TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO alertable_fields(field_name, label, data_type, source_table, source_scope, is_active) VALUES
('last_price', 'Last Price', 'number', 'quotes_current', 'symbol', true),
('upper_bb_pct', 'Upper BB %', 'number', 'quotes_current', 'symbol', true),
('open_pnl', 'Open P/L', 'number', 'positions_current', 'position', true),
('net_liq', 'Net Liq', 'number', 'balances_current', 'account', true),
('buying_power', 'Buying Power', 'number', 'balances_current', 'account', true)
ON CONFLICT (field_name) DO NOTHING;
