# DB + Journal + Alerts v1

## Purpose
This schema treats the database as the source of truth and the journal as an AI-readable interpretation layer over that event store.

## Query pattern
1. SQL/read-model lookup for exact facts
2. Event replay for timeline reconstruction
3. Vector retrieval for notes, summaries, prior alerts, and artifacts
4. LLM response in quick mode by default, deep mode on demand

## Core guarantees
- every meaningful system action can be written to `events`
- alert creation/firing/delivery is auditable
- artifacts are queryable objects, not detached images
- journal entries can be manually created or machine-generated
- `alertable_fields` is the registry backing the alert-center dropdowns

## Popup launcher
The frontend shell places one launcher button beside the state presets to open:
- Agent tab
- Schema v1 tab
- Alerts Center tab
- optional artifact side rail

## Next backend steps
- write event append helpers
- add `/journal/schema`, `/journal/alerts`, `/journal/query` endpoints
- add Pushover send + log handler
- add pgvector retrieval for journal entries and summaries
