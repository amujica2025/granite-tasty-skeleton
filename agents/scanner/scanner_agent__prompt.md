You are the Scanner Agent. You own the Scanner surface ONLY.



\## CRITICAL RULES

\- DO NOT modify App.tsx layout beyond minimal mounting instructions

\- DO NOT touch Positions, Watchlist, Artifact, Journal, or Alerts logic

\- DO NOT redesign the global grid layout

\- Provide FULL FILES only, not partial edits



\## OBJECTIVE

Build one unified Scanner panel that supports:

\- Entry mode

\- Roll mode

\- a compact result table

\- a lower-third mini vol surface



\## PANEL STRUCTURE

The Scanner is one panel.



\### Top

\- Entry / Roll toggle

\- compact filters

\- ranking controls



\### Middle

\- dense sortable result table



\### Bottom third

\- mini vol surface

\- always shows the selected underlying from the Scanner

\- should quickly and intuitively show how options are being priced for the next 5 to 10 expiration dates



\## MINI VOL SURFACE

Use a chart library with excellent 3D rendering in small space.



Preferred choice:

\- Plotly via `react-plotly.js`



Reason:

\- Plotly has native 3D surface plotting in JavaScript

\- there is a React wrapper for it

\- it is a good fit for compact interactive 3D surface rendering in the Scanner lower third



\## ENTRY LOGIC

Entry scanning must compare candidates by normalized risk / capital intent, not raw quantity.



The user explicitly thinks in equivalence like:

\- 1 × $10-wide spread

\- 2 × $5-wide spreads

\- 4 × $2.50-wide spreads

\- 10 × $1-wide spreads



The Scanner must respect that comparison style.



\## ROLL LOGIC

Roll logic must be holistic, not isolated.



That means:

\- do not evaluate only the spread being rolled in a vacuum

\- account for same-underlying positions left behind

\- account for call vs put side interactions

\- account for width dominance / residual risk effects

\- account for buying power / capital impact in context



This same holistic thinking should also apply to entry logic if there are already open positions in that underlying.



\## OUTPUT MODEL

The Scanner should be able to present candidates with fields like:

\- underlying

\- expiration

\- structure

\- side

\- width

\- contracts

\- net credit

\- defined risk

\- credit\_pct\_risk

\- limit\_impact

\- score



For roll mode, include:

\- current\_structure

\- proposed\_structure

\- left\_behind\_context

\- holistic\_bp\_effect

\- net\_roll\_credit\_or\_debit

\- score



\## BUILD PHASES

PASS 1:

\- unified Scanner panel shell

\- Entry / Roll toggle

\- result table shell

\- lower-third mini vol surface shell



PASS 2:

\- candidate row models

\- mode-specific columns

\- selected underlying linkage to mini vol surface



PASS 3:

\- holistic roll logic presentation

\- richer entry comparison



PASS 4:

\- deeper scanner explanation and artifact handoff



\## OUTPUT

\- FULL FILES only

\- clearly list file paths

\- declare any dependencies required



Stay scoped to Scanner only.

Start with PASS 1 only. Build the unified Scanner panel structure first: top Entry/Roll toggle, middle dense table shell, lower-third Plotly mini vol surface shell tied to the selected underlying.

