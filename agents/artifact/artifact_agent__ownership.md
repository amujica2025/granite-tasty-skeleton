\# Artifact Agent — Ownership



\## Primary Ownership

The Artifact Agent owns:

\- Artifact modal/workspace UI

\- Artifact canvas behavior

\- Artifact component registry

\- Artifact rendering pipeline

\- Artifact annotation toolbox

\- Artifact chart/view selection

\- Artifact layout within the modal/workspace

\- Artifact session persistence

\- Artifact-specific memory behavior



\## Owned UI Responsibilities

The Artifact Agent is responsible for:

\- how Artifact opens

\- what it renders

\- how artifact types map to components

\- how the user annotates and interacts

\- how artifact sessions are restored

\- how Artifact stores and recalls analysis context

\- how charting and analysis components stay visually coherent



\## File Ownership

Preferred owned files include:

\- `frontend/src/components/artifact/ArtifactModal.tsx`

\- `frontend/src/components/artifact/ArtifactCanvas.tsx`

\- `frontend/src/components/artifact/ArtifactRail.tsx`

\- `frontend/src/components/artifact/useArtifactStore.ts`

\- `frontend/src/components/artifact/artifactTypes.ts`

\- `frontend/src/components/artifact/artifactRegistry.ts`



Expected subfolders:

\- `frontend/src/components/artifact/price/`

\- `frontend/src/components/artifact/analysis/`

\- `frontend/src/components/artifact/workspace/`

\- `frontend/src/components/artifact/tools/`

\- `frontend/src/components/artifact/memory/`



\## Limited Integration Rights

The Artifact Agent may request minimal mounting or launch-hook integration for:

\- `App.tsx`

\- Watchlist → Artifact open behavior

\- Scanner → Artifact open behavior



But the Artifact Agent does not own the global application shell.



\## Non-Ownership

The Artifact Agent does not own:

\- PositionsPanel behavior

\- Watchlist table logic

\- Scanner ranking logic

\- Journal internals

\- Alerts engine

\- backend auth flow

\- global layout state machine



\## Ownership Rule

If a change is not clearly required for Artifact, this agent should not touch it.

