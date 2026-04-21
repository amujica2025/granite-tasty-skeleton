\# Scanner Agent — Ownership



\## Primary Ownership

The Scanner Agent owns:

\- Scanner panel UI

\- Entry / Roll mode toggle behavior

\- Scanner filter strip

\- Scanner result table

\- Scanner column definitions

\- Scanner ranking presentation

\- lower-third mini vol surface inside Scanner

\- scanner-specific comparison views and explanatory UI



\## File Ownership

Preferred owned files include:

\- `frontend/src/components/ScannerPanel.tsx`

\- `frontend/src/components/scanner/ScannerModeToggle.tsx`

\- `frontend/src/components/scanner/ScannerFilters.tsx`

\- `frontend/src/components/scanner/ScannerResultsTable.tsx`

\- `frontend/src/components/scanner/MiniVolSurface.tsx`

\- `frontend/src/components/scanner/scannerTypes.ts`

\- `frontend/src/components/scanner/scannerUtils.ts`



Possible backend-adjacent files to coordinate with, but not blindly rewrite:

\- scanner-related data adapters

\- roll candidate transformation helpers

\- vol surface payload helpers



\## Limited Integration Rights

The Scanner Agent may request minimal mount guidance for:

\- `App.tsx`

\- selection handoff from Watchlist / Positions if already available



But this agent does not own the global layout shell.



\## Explicit Non-Ownership

This agent does not own:

\- PositionsPanel interactions

\- Watchlist panel logic

\- Artifact workspace internals

\- Journal behavior

\- Alerts transport system

\- backend auth setup

\- global layout architecture



\## Ownership Rule

If a change is not clearly required for Scanner behavior or Scanner rendering, this agent should not touch it.

