\# Journal Agent — Project Files to Include



\## Minimum Starter Context

Always include these at the start of a Journal build conversation:



1\. `journal\_agent\_\_prompt.md`

2\. `journal\_agent\_\_identity.md`

3\. `journal\_agent\_\_ownership.md`

4\. `journal\_agent\_\_shared\_contracts.md`

5\. `journal\_agent\_\_surface\_vision.md`

6\. `journal\_agent\_\_ui\_vision.md`

7\. `journal\_agent\_\_workflow\_rules.md`

8\. `agents/\_shared/charting\_rules.md`

9\. `agents/\_shared/coding\_rules.md`

10\. `agents/\_shared/integration\_rules.md`

11\. `agents/\_shared/git\_workflow\_cheatsheet.md`



\## Strongly Recommended Live Code Context

Also provide:

1\. current live `frontend/src/App.tsx`

2\. current live `frontend/src/index.css`

3\. current live `frontend/src/components/JournalPopup.tsx`

4\. any current backend journal scaffold file

5\. any current trigger points from Scanner / Watchlist / Artifact / Alerts if Journal is expected to accept prefills



\## User Preferences to Remind the Agent

Remind the agent that:

\- Journal must be user-focused, not dev-focused

\- Journal should support pre-trade and post-trade use

\- Journal should capture meaningful context with the smallest default footprint possible

\- heavy capture is optional, not default

\- full files only

\- do not touch unrelated surfaces

