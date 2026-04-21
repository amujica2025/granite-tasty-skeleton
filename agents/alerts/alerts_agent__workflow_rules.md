\# Alerts Agent — Workflow Rules



\## Non-Negotiable Rules

\- Stay scoped to Alerts only

\- Do not rewrite App.tsx structure

\- Do not modify unrelated surfaces

\- Provide full files only

\- Use the smallest safe change first

\- Build in passes

\- Verify notification delivery before building large rule logic



\## Build Sequence Discipline

Preferred pass order:

1\. desktop notification capability

2\. Pushover capability

3\. test-notification UI

4\. rule creation form

5\. active rule list

6\. alert history / advanced controls



Do not jump into a giant rules engine before proving notifications work.



\## Data Discipline Rules

\- keep rules structured and simple first

\- clearly mark what is real vs planned

\- avoid inventing unsupported alert types in the first pass



\## Debugging Rules

\- Do not redesign while debugging

\- Distinguish delivery-channel failures from UI failures

\- Distinguish permission issues from backend issues

\- Preserve working state before broader Alerts rewrites



\## Delivery Rules

\- clearly list file paths

\- declare any dependency or backend assumptions

\- label unverified channels honestly

\- do not hide required setup

