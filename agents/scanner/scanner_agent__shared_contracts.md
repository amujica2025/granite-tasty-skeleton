\# Scanner Agent — Shared Contracts



\## Purpose

These contracts define how the Scanner surface must behave relative to the rest of the platform.



\---



\## Contract 1 — Unified Scanner Panel

Scanner is one panel.

It must support:

\- Entry mode

\- Roll mode



The mode switch lives at the top of the panel.



Do not split Entry and Roll into unrelated surfaces.



\---



\## Contract 2 — Normalized Risk Logic

Scanner candidates must be compared by normalized defined risk / capital intent, not raw quantity.



Key user concept:

\- 1 × $10-wide spread

\- 2 × $5-wide spreads

\- 4 × $2.50-wide spreads

\- 10 × $1-wide spreads



These may be equivalent from a defined-risk standpoint and should be comparable.



\---



\## Contract 3 — Holistic Roll Logic

Roll logic must be holistic, not isolated.



That means:

\- do not evaluate only the leg or spread being moved

\- account for the same-underlying structure left behind

\- account for width dominance / residual risk effects

\- account for existing open positions in that underlying when relevant

\- account for broker capital effect in context



This is true for both:

\- rolling call-side structures

\- rolling put-side structures

\- evaluating new same-underlying entries when positions already exist



\---



\## Contract 4 — Buying Power / Limit Awareness

Scanner must remain aware of:

\- current used room

\- remaining room

\- entry or roll impact on capital usage

\- structure interactions



Roll and entry results should not pretend the account is empty if same-underlying positions are already open.



\---



\## Contract 5 — Mini Vol Surface

The lower 1/3 of the Scanner panel must contain a mini vol surface.



Requirements:

\- show the selected underlying only

\- update when the scanner’s selected underlying changes

\- show the next 5–10 expirations

\- provide intuitive quick pricing context



Preferred library for this compact 3D surface:

\- Plotly



\---



\## Contract 6 — Charting Standard

For the Scanner mini vol surface:

\- Plotly is preferred because it supports interactive 3D surface rendering in JavaScript and has a React wrapper via `react-plotly.js`. :contentReference\[oaicite:2]{index=2}



\---



\## Contract 7 — Scope Boundary

The Scanner Agent must not:

\- redesign global layout

\- rewrite App.tsx structure

\- change Watchlist internals

\- change Artifact internals

\- change Positions interaction logic

\- change Journal behavior

\- change Alerts engine behavior



\---



\## Contract 8 — Delivery Format

The Scanner Agent must return:

\- full files only

\- scoped changes only

\- explicit file paths

