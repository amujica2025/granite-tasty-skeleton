\# Journal Agent — Shared Contracts



\## Purpose

These contracts define how Journal must behave relative to the rest of the platform.



\---



\## Contract 1 — User-Focused, Not Dev-Focused

Journal must feel like a trader’s notebook and worksheet system.



It must not feel like:

\- a debug console

\- a raw event dump

\- a developer log viewer



\---



\## Contract 2 — Low-Footprint by Default

Journal should default to:

\- structured event logging

\- lightweight text/metadata storage

\- state summaries, not full raw dumps

\- trigger-based snapshots when meaningful



Do not default to:

\- full screenshots

\- full continuous recording

\- full keystroke archiving

\- unbounded raw websocket storage



\---



\## Contract 3 — Layered Capture Model

Journal should support three levels:



\### Layer 1 — always-on lightweight capture

\- ideas

\- targets

\- checklist submissions

\- scanner searches

\- alert events

\- selected candidates

\- artifact opens/saves

\- review notes



\### Layer 2 — triggered snapshots

\- before entry

\- before exit

\- on alert

\- on marked idea

\- on worksheet submit

\- on artifact share/save



\### Layer 3 — optional heavy capture

\- keystrokes

\- screenshots

\- continuous recording

\- broader workstation monitoring



Layer 3 should be opt-in, not default.



\---



\## Contract 4 — Worksheet Support

Journal should support structured worksheet-style inputs before and after trades.



The user explicitly wants forms/checklists/worksheets that can be filled before entry and before exit.



\---



\## Contract 5 — Retrospective Value

Journal must support in-case and after-the-fact use cases:

\- trade review

\- outcome analysis

\- what happened and why

\- idea tracking

\- pattern recognition later



\---



\## Contract 6 — Scope Boundary

The Journal Agent must not:

\- redesign global layout

\- rewrite App.tsx structure

\- change Positions logic

\- change Watchlist logic

\- change Scanner logic

\- change Artifact internals

\- change Alerts delivery behavior



\---



\## Contract 7 — Delivery Format

The Journal Agent must return:

\- full files only

\- scoped changes only

\- explicit file paths

