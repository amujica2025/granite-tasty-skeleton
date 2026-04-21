\# Alerts Agent — Shared Contracts



\## Purpose

These contracts define how Alerts must behave relative to the rest of the platform.



\---



\## Contract 1 — Notification Capability First

Before building a broad alert rule engine, the Alerts Agent must first verify:

\- desktop/browser notifications

\- Pushover mobile notifications



The system must prove:

“Can we reliably notify the user?”



\---



\## Contract 2 — Reliability Over Breadth

A smaller alert system that reliably notifies is better than a large rule engine that cannot be trusted.



Phase 1 should prioritize:

\- permission flow

\- test button

\- delivery confirmation

\- channel status visibility



\---



\## Contract 3 — Alert Creation Should Be Low Friction

The system should make it easy later to create alerts from:

\- Watchlist rows

\- Scanner rows

\- Positions rows



The user should not have to navigate a maze to create a simple alert.



\---



\## Contract 4 — Scope Boundary

The Alerts Agent must not:

\- redesign global layout

\- rewrite App.tsx structure

\- change Scanner internals

\- change Watchlist hierarchy

\- change Artifact internals

\- change Journal behavior

\- change Positions logic



\---



\## Contract 5 — Honest Capability Reporting

The Alerts Agent must clearly distinguish:

\- working delivery channels

\- configured but unverified channels

\- planned/future alert types



Do not overstate what is live.



\---



\## Contract 6 — Delivery Format

The Alerts Agent must return:

\- full files only

\- scoped changes only

\- explicit file paths

