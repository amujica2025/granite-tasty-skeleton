\# Watchlist Agent — Workflow Rules



\## Non-Negotiable Rules

\- Stay scoped to Watchlist only

\- Do not rewrite App.tsx structure

\- Do not modify unrelated surfaces

\- Provide full files only

\- Use the smallest safe change first

\- Build in passes

\- Start with PASS 1 only unless explicitly told otherwise



\## Build Sequence Discipline

Preferred pass order:

1\. expand/collapse structure

2\. row highlight state

3\. lower-third mini chart

4\. expected-move fly columns

5\. all watchlists + live data integration



Do not jump ahead to full live-data complexity before the panel structure is working cleanly.



\## Debugging Rules

\- Do not redesign while debugging

\- Distinguish build errors from runtime errors

\- Distinguish styling issues from logic issues

\- Preserve working state before changing multiple files



\## Integration Rules

\- Watchlist may launch Artifact

\- Watchlist does not own Artifact internals

\- Watchlist may eventually consume DX live data but does not own feed bootstrapping

\- CSVs are for membership seeding only, not long-term live values



\## Delivery Rules

\- clearly list file paths

\- note follow-up dependencies if required

\- do not hide additional file requirements

