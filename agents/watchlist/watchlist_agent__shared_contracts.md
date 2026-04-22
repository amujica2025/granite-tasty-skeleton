\# Watchlist Agent — Shared Contracts



\## Purpose

These contracts define how the Watchlist surface must behave relative to the rest of the platform.



\---



\## Contract 1 — Charting Standard

All Watchlist price charts must use:

\- Lightweight Charts



The Watchlist Agent must not introduce:

\- Recharts for market price charts

\- arbitrary sparkline libraries

\- competing price-chart styles



\---



\## Contract 2 — Artifact Relationship

The Watchlist surface is a feeder into Artifact.



Expected behavior:

\- single click on ticker row = highlight + update mini chart

\- double click on ticker row = launch Artifact for deeper chart work



The Watchlist Agent must not redefine Artifact internals.



\---



\## Contract 3 — Live Data Source

Uploaded CSVs may be used only to seed:

\- first-time watchlist membership

\- initial watchlist composition



They are not the long-term source of truth for live displayed row values.



All live row metrics must ultimately come from:

\- tasty DX stream

\- existing app quote/live data feed



\---



\## Contract 4 — Watchlist Universe

The top-level watchlists must include only:

\- Weeklys

\- XLC

\- XLY

\- XLP

\- XLE

\- XLF

\- XLV

\- XLI

\- XLK

\- XLB

\- XLRE

\- XLU



The Watchlist must not include:

\- SPX

\- NDX

\- RUT



\---



\## Contract 5 — Column Discipline



\### Collapsed Watchlist Row Columns

Use exactly:

\- Symbol

\- Latest

\- %Change

\- IV Pctl

\- Upper EM Fly

\- Upper EM Cost (ex shorts)

\- Lower EM Fly

\- Lower EM Cost (ex shorts)



\### Expanded Ticker Row Columns

Use exactly:

\- Symbol

\- Latest

\- %Change

\- 14D Rel Str

\- IV Pctl

\- IV/HV

\- Imp Vol

\- 5D IV

\- 1M IV

\- 3M IV

\- 6M IV

\- Upper EM Fly

\- Upper EM Cost (ex shorts)

\- Lower EM Fly

\- Lower EM Cost (ex shorts)

\- BB%

\- BB Rank

\- TTM Squeeze

\- 14D ADR

\- Options Vol

\- 1M Total Vol

\- Call Volume

\- Put Volume



Remove the Links column entirely.



\---



\## Contract 6 — Scope Boundary

The Watchlist Agent must not:

\- redesign the global layout

\- rewrite App.tsx structure

\- change Positions behavior

\- change Scanner behavior

\- change Journal behavior

\- change Alert engine behavior

\- change Artifact store or modal internals



\---



\## Contract 7 — Delivery Format

The Watchlist Agent must return:

\- full files only

\- scoped changes only

\- explicit file paths

