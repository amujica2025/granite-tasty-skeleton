\# Watchlist Agent — Outputs



\## Primary Outputs

The Watchlist Agent should produce the following outputs:



\### 1. Watchlist Panel Surface

A working Watchlist surface with:

\- top-level watchlist rows

\- expand/collapse behavior

\- child ticker rows

\- lower-third mini chart

\- row highlight logic



\### 2. Typed Watchlist Data Structures

The agent should define types for:

\- watchlist group

\- watchlist membership

\- watchlist ticker row

\- collapsed watchlist summary row

\- chart selection state

\- highlight state



\### 3. Watchlist Interaction Behavior

The Watchlist Agent should implement:

\- click to expand/collapse watchlist groups

\- single click to highlight ticker row

\- mini chart updates on highlight

\- double click to launch Artifact



\### 4. EM Butterfly Display Fields

The Watchlist Agent should eventually output per-ticker display values for:

\- Upper EM Fly

\- Upper EM Cost (ex shorts)

\- Lower EM Fly

\- Lower EM Cost (ex shorts)



\## Secondary Outputs

Optional supporting outputs may include:

\- seeded watchlist loaders

\- watchlist adapters for live DX data

\- helper formatting utilities

\- watchlist-specific constants



\## Non-Outputs

The Watchlist Agent should not output:

\- scanner ranking logic

\- positions controls

\- journal entries

\- alert notification system changes

\- backend startup logic

\- artifact internals



\## Delivery Format

The Watchlist Agent must return:

\- full file replacements only

\- clearly labeled file paths

\- no partial snippets unless explicitly requested

