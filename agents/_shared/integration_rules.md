# Integration Rules

- App.tsx is orchestration, not an agent-owned file
- Do not overwrite App.tsx with stale outputs
- Preserve working state
- Build -> test -> commit after each stable step
- Restore one file at a time when possible
- Journal must only mount when open
- Artifact must use store-based mounting
- Positions totals are inline after last row, not sticky
