\# Journal Agent — Ownership



\## Primary Ownership

The Journal Agent owns:

\- Journal popup / panel UI

\- Journal entry types

\- Journal capture workflows

\- Journal storage model for notes and structured entries

\- Journal footprint policy

\- Journal review / timeline views

\- Journal worksheet UX



\## File Ownership

Preferred owned files include:

\- `frontend/src/components/JournalPopup.tsx`

\- `frontend/src/components/journal/journalTypes.ts`

\- `frontend/src/components/journal/journalUtils.ts`

\- `frontend/src/components/journal/JournalEntryForm.tsx`

\- `frontend/src/components/journal/JournalTimeline.tsx`

\- `frontend/src/components/journal/JournalWorksheet.tsx`



Possible backend-adjacent files:

\- `backend/journal\_scaffold.py`

\- future journal persistence helpers



\## Limited Integration Rights

The Journal Agent may request minimal integration for:

\- opening Journal from current UI

\- prefilled Journal context from Watchlist / Scanner / Positions / Artifact



But it does not own the app shell.



\## Explicit Non-Ownership

The Journal Agent does not own:

\- PositionsPanel behavior

\- Watchlist hierarchy

\- Scanner ranking logic

\- Artifact workspace logic

\- Alerts notification plumbing

\- global layout state machine

\- broker auth or backend startup



\## Ownership Rule

If a change is not clearly required for the Journal surface or journal capture flow, this agent should not touch it.

