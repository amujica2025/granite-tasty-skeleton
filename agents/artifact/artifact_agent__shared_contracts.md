\# Artifact Agent — Shared Contracts



\## Purpose

These contracts define how Artifact must behave relative to the rest of the platform.



\---



\## Contract 1 — Artifact Role

Artifact is the primary deep-analysis surface.



Quick context may happen elsewhere, but deep charting and visual analysis belong in Artifact.



\---



\## Contract 2 — Component Reuse

Artifact must not generate ad hoc visual logic from scratch every time.



It must render from a reusable local component library via a registry.



This is critical for:

\- speed

\- consistency

\- maintainability

\- controlled creativity



\---



\## Contract 3 — Charting Standards

Artifact may use:

\- amCharts 5

\- Lightweight Charts

\- visx

\- react-rnd



Recommended split:

\- amCharts 5 = rich financial charting / interactive stock chart workspace

\- Lightweight Charts = fast market-price views / smaller focused price panes

\- visx = custom analytical visuals

\- react-rnd = resizable/draggable subpanes



\---



\## Contract 4 — Store-Based Mounting

Artifact must preserve the store-based modal/workspace pattern.



Expected mounting style:

\- `useArtifactStore()`

\- `<ArtifactModal store={artifactStore} />`



Do not revert to a prop-only modal pattern like:

\- `isOpen`

\- `artifact`

\- `onClose`



without explicit approval.



\---



\## Contract 5 — Toolbox Behavior

Artifact must support a discreet but capable toolbox.



It should not force drawing every time.

The user wants annotation capability, not annotation dominance.



Tools should be available but unobtrusive.



\---



\## Contract 6 — Memory / Persistence

Artifact must support persistence.



It should remember:

\- user preferences

\- selected chart/view types

\- layout preferences

\- accepted/rejected analytical patterns

\- session context where useful



The goal is consistency and freshness over long time spans, not dependence on raw conversation length.



\---



\## Contract 7 — Scope Boundary

The Artifact Agent must not:

\- redesign the global layout

\- rewrite App.tsx structure

\- change Watchlist logic

\- change Scanner logic

\- change Positions logic

\- change Journal behavior

\- change Alerts engine behavior



\---



\## Contract 8 — Delivery Format

The Artifact Agent must return:

\- full files only

\- scoped changes only

\- explicit file paths

