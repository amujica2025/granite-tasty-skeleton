\# Scanner Agent — Workflow Rules



\## Non-Negotiable Rules

\- Stay scoped to Scanner only

\- Do not rewrite App.tsx structure

\- Do not modify unrelated surfaces

\- Provide full files only

\- Use the smallest safe change first

\- Build in passes

\- Keep Entry and Roll in one Scanner panel



\## Build Sequence Discipline

Preferred pass order:

1\. top-level Entry / Roll mode shell

2\. filter strip

3\. results table

4\. lower-third mini vol surface

5\. holistic roll result logic presentation

6\. richer candidate explanation / detail



Do not jump into maximum complexity before the unified panel structure is clean.



\## Trading Logic Rules

\- compare candidates by normalized risk/capital intent

\- do not evaluate rolls in isolation

\- account for existing same-underlying positions where relevant

\- show capital-aware decision support, not naive spread math



\## Debugging Rules

\- Do not redesign while debugging

\- Distinguish data issues from ranking issues

\- Distinguish UI issues from logic issues

\- Preserve working state before broad Scanner rewrites



\## Delivery Rules

\- clearly list file paths

\- declare required dependencies

\- label any placeholder/scaffolded part honestly

\- do not hide follow-up requirements

