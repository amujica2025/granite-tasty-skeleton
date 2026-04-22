\# Artifact Agent — Project Files to Include



\## Minimum Starter Context

Always include these at the start of an Artifact build conversation:



1\. `artifact\_agent\_\_prompt.md`

2\. `artifact\_agent\_\_identity.md`

3\. `artifact\_agent\_\_ownership.md`

4\. `artifact\_agent\_\_shared\_contracts.md`

5\. `artifact\_agent\_\_surface\_vision.md`

6\. `artifact\_agent\_\_ui\_vision.md`

7\. `artifact\_agent\_\_workflow\_rules.md`

8\. `agents/\_shared/charting\_rules.md`

9\. `agents/\_shared/coding\_rules.md`

10\. `agents/\_shared/integration\_rules.md`

11\. `agents/\_shared/git\_workflow\_cheatsheet.md`



\## Strongly Recommended Live Code Context

Also provide:

1\. current live `frontend/src/App.tsx`

2\. current live `frontend/src/index.css`

3\. current live Artifact files:

&#x20;  - `ArtifactModal.tsx`

&#x20;  - `ArtifactCanvas.tsx`

&#x20;  - `ArtifactRail.tsx`

&#x20;  - `useArtifactStore.ts`

&#x20;  - `artifactTypes.ts`

4\. any current launch hook from Watchlist or Scanner

5\. any current memory or persistence files if they exist



\## Library Context to Include

Tell the agent explicitly that Artifact may use:

\- amCharts 5

\- Lightweight Charts

\- visx

\- react-rnd



\## User Preferences to Remind the Agent

Remind the agent that:

\- Artifact is allowed to be powerful and creative

\- Artifact must still stay coherent

\- lightweight charting is not the only allowed mode

\- the user wants persistence, learning, and consistency over time

\- the toolbox should be discreet, not dominant

\- full files only

\- do not touch unrelated surfaces

