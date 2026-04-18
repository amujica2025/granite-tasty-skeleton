# Trading Journal / DB System v1

This folder is the first scaffold for:
- event store
- journal entries
- artifacts
- annotations
- alerts
- alert delivery history
- alertable field registry

## Files
- `schema_v1.sql` â€” PostgreSQL/pgvector schema
- `router.py` â€” mock FastAPI routes for schema, alerts, and query flow

## Intent
This scaffold is intentionally safe:
- visible frontend shell first
- backend wiring staged
- real stream ingestion and DB writes come next
