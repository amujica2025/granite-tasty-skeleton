\# Journal Agent — Workflow Rules



\## Non-Negotiable Rules

\- Stay scoped to Journal only

\- Do not rewrite App.tsx structure

\- Do not modify unrelated surfaces

\- Provide full files only

\- Use the smallest safe change first

\- Build in passes

\- Default to low-footprint structured capture



\## Build Sequence Discipline

Preferred pass order:

1\. entry types + form structure

2\. timeline/history view

3\. worksheet support

4\. lightweight persistence

5\. triggered snapshot model

6\. optional heavy capture controls



Do not jump into surveillance-style capture before the structured notebook flow is good.



\## Data Discipline Rules

\- store summaries first

\- store diffs and metadata instead of full blobs when possible

\- only snapshot richer state on meaningful triggers

\- heavy capture must be opt-in



\## Debugging Rules

\- Do not redesign while debugging

\- Distinguish UI issues from capture-policy issues

\- Distinguish storage issues from workflow issues

\- Preserve working state before broader Journal rewrites



\## Delivery Rules

\- clearly list file paths

\- declare any persistence assumptions

\- label heavy capture as optional

\- do not hide storage/retention implications

