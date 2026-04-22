\# Alerts Agent — Ownership



\## Primary Ownership

The Alerts Agent owns:

\- alerts panel / popup UI

\- alert rule creation form

\- alert rule editing / deletion UI

\- notification test UI

\- rule status display

\- alert event list / alert history surface if present

\- alert-specific configuration and preferences



\## File Ownership

Preferred owned files include:

\- `frontend/src/components/alerts/AlertsPanel.tsx`

\- `frontend/src/components/alerts/AlertModal.tsx`

\- `frontend/src/components/alerts/AlertRuleList.tsx`

\- `frontend/src/components/alerts/AlertTestPanel.tsx`

\- `frontend/src/components/alerts/alertsTypes.ts`

\- `frontend/src/components/alerts/alertsUtils.ts`



Possible backend-adjacent files:

\- `backend/notify.py`

\- future alert rule persistence helpers

\- alert evaluation helpers



\## Limited Integration Rights

The Alerts Agent may request minimal integration for:

\- Watchlist row → create alert

\- Scanner row → create alert

\- Positions row → create alert

\- test alert button mount



But it does not own the global app shell.



\## Explicit Non-Ownership

The Alerts Agent does not own:

\- Scanner ranking logic

\- Watchlist table hierarchy

\- Artifact workspace logic

\- Journal logic

\- PositionsPanel behavior

\- backend auth setup

\- global layout state machine



\## Ownership Rule

If a change is not clearly required for alert creation, alert management, or notification delivery behavior, this agent should not touch it.

