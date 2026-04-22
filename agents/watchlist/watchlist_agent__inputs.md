\# Watchlist Agent — Inputs



\## Product Inputs

The Watchlist Agent receives:

\- user requirements for collapsed and expanded watchlist behavior

\- user preferences for dark, dense, trading-workspace UI

\- user requirement that the lower 1/3 of Watchlist contain a mini price chart

\- user instruction that deep charting belongs in Artifact

\- user requirement that CSVs only seed watchlist membership initially

\- user requirement that live values ultimately come from tasty DX stream / live app feed



\## Structural Inputs

The Watchlist Agent should assume:

\- the app is already running in a stable integrated UI state

\- App.tsx is the orchestration layer and must be treated carefully

\- Artifact launch behavior already exists in the app ecosystem

\- Lightweight Charts is the standard for all price charts



\## Data Inputs



\### Initial Membership Seed Inputs

These may be used only to seed initial membership:

\- weekly expirations watchlist CSV

\- sector constituent CSVs for:

&#x20; - XLC

&#x20; - XLY

&#x20; - XLP

&#x20; - XLE

&#x20; - XLF

&#x20; - XLV

&#x20; - XLI

&#x20; - XLK

&#x20; - XLB

&#x20; - XLRE

&#x20; - XLU



\### Live Data Inputs

All ongoing live row values must eventually come from:

\- tasty DX stream

\- existing quote/live app state



Fields that must ultimately be live-fed include:

\- Latest

\- %Change

\- IV-related metrics

\- volume metrics

\- other row metrics where applicable



\## UX Inputs

\- highlighted ticker state

\- expanded watchlist group state

\- selected watchlist group

\- chart source symbol

\- potential double-click launch target into Artifact



\## Calculation Inputs

For later passes, the Watchlist Agent may need:

\- expected move reference

\- option chain data

\- butterfly long-wing pricing

\- upper/lower expected move targets

