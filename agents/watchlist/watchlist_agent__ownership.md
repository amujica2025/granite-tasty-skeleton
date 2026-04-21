\# Watchlist Agent — Ownership



\## Primary Ownership

The Watchlist Agent owns:

\- the Watchlist panel surface

\- watchlist expand/collapse behavior

\- watchlist parent row rendering

\- watchlist child ticker row rendering

\- lower 1/3 mini chart inside Watchlist

\- Watchlist-specific columns

\- expected-move butterfly display fields

\- row highlight behavior

\- Artifact launch behavior from Watchlist rows



\## Owned UI Responsibilities

The Watchlist Agent is responsible for:

\- top-level watchlist grouping

\- collapsed vs expanded column behavior

\- row density and alignment

\- chart sync to selected/highlighted ticker

\- table hierarchy clarity between parent rows and child rows



\## File Ownership

Preferred owned files include:

\- `frontend/src/components/WatchlistPanel.tsx`

\- `frontend/src/components/watchlist/MiniPriceChart.tsx`

\- `frontend/src/components/watchlist/watchlistTypes.ts`

\- `frontend/src/components/watchlist/watchlistUtils.ts`

\- `frontend/src/components/watchlist/watchlistSeed.ts`

\- `frontend/src/components/watchlist/watchlistData.ts`



\## Limited Integration Rights

The Watchlist Agent may request minimal mounting instructions for:

\- `App.tsx`



But the Watchlist Agent does not own global layout orchestration and must not rewrite App.tsx structure.



\## Non-Ownership

The Watchlist Agent does not own:

\- `PositionsPanel.tsx`

\- `ScannerPanel.tsx`

\- `JournalPopup.tsx`

\- Alert rule engine

\- Artifact modal/store internals

\- backend DX feed initialization

\- overall 10x6 layout

\- global application state architecture



\## Ownership Rule

If a file or behavior is not clearly required for the Watchlist surface, the Watchlist Agent should not touch it.

