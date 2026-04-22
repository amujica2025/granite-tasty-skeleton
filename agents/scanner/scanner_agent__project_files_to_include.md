\# Scanner Agent — Project Files to Include



\## Minimum Starter Context

Always include these at the start of a Scanner build conversation:



1\. `scanner\_agent\_\_prompt.md`

2\. `scanner\_agent\_\_identity.md`

3\. `scanner\_agent\_\_ownership.md`

4\. `scanner\_agent\_\_shared\_contracts.md`

5\. `scanner\_agent\_\_surface\_vision.md`

6\. `scanner\_agent\_\_ui\_vision.md`

7\. `scanner\_agent\_\_workflow\_rules.md`

8\. `agents/\_shared/charting\_rules.md`

9\. `agents/\_shared/coding\_rules.md`

10\. `agents/\_shared/integration\_rules.md`

11\. `agents/\_shared/git\_workflow\_cheatsheet.md`



\## Strongly Recommended Live Code Context

Also provide:

1\. current live `frontend/src/App.tsx`

2\. current live `frontend/src/index.css`

3\. current live `frontend/src/components/ScannerPanel.tsx` if it exists

4\. current scanner-related backend files if scanner logic is already wired

5\. any current vol-surface-related files if the mini surface needs live payload support

6\. any current positions-open-context file if roll logic must account for same-underlying live positions



\## Library Context to Include

Tell the agent explicitly that the lower-third Scanner vol surface should prefer:

\- Plotly

\- `react-plotly.js`



\## User Preferences to Remind the Agent

Remind the agent that:

\- Scanner is one panel, not two unrelated tools

\- top toggle = Entry / Roll

\- mini vol surface belongs in the bottom third

\- roll logic must be holistic

\- same-underlying open positions matter

\- provide full files only

\- do not touch unrelated surfaces

