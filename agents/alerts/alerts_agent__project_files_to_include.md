\# Alerts Agent — Project Files to Include



\## Minimum Starter Context

Always include these at the start of an Alerts build conversation:



1\. `alerts\_agent\_\_prompt.md`

2\. `alerts\_agent\_\_identity.md`

3\. `alerts\_agent\_\_ownership.md`

4\. `alerts\_agent\_\_shared\_contracts.md`

5\. `alerts\_agent\_\_surface\_vision.md`

6\. `alerts\_agent\_\_ui\_vision.md`

7\. `alerts\_agent\_\_workflow\_rules.md`

8\. `agents/\_shared/charting\_rules.md`

9\. `agents/\_shared/coding\_rules.md`

10\. `agents/\_shared/integration\_rules.md`

11\. `agents/\_shared/git\_workflow\_cheatsheet.md`



\## Strongly Recommended Live Code Context

Also provide:

1\. current live `frontend/src/App.tsx`

2\. current live `frontend/src/index.css`

3\. current live alert-related UI if any exists

4\. current `backend/notify.py`

5\. any current alert endpoints or test endpoints

6\. any Watchlist / Scanner / Positions hook points if prefilling alerts is expected soon



\## User Preferences to Remind the Agent

Remind the agent that:

\- verify desktop and Pushover first

\- reliability beats breadth

\- keep it user-facing and clean

\- full files only

\- do not touch unrelated surfaces

