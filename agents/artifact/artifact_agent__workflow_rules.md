\# Artifact Agent — Workflow Rules



\## Non-Negotiable Rules

\- Stay scoped to Artifact only

\- Do not rewrite App.tsx structure

\- Do not modify unrelated surfaces

\- Provide full files only

\- Use the smallest safe change first

\- Build in controlled passes

\- Preserve the store-based Artifact mount pattern



\## Build Sequence Discipline

Preferred pass order:

1\. registry + component library structure

2\. primary chart components

3\. toolbox and interaction tools

4\. session persistence

5\. memory and preference persistence

6\. richer analytical views



Do not jump straight into “everything everywhere” before the registry and workspace structure are solid.



\## Debugging Rules

\- Do not redesign while debugging

\- Distinguish library/rendering issues from workspace-state issues

\- Distinguish persistence issues from UI issues

\- Preserve working Artifact behavior before expanding it



\## Memory Rules

Artifact memory should improve behavior through:

\- stored corrections

\- stored preferences

\- stored accepted/rejected patterns

\- session recall



It should not fake memory through vague assumptions.



\## Integration Rules

\- Artifact may be opened from Watchlist and Scanner

\- Artifact does not own their internals

\- Artifact should consume context, not rewrite upstream systems



\## Delivery Rules

\- clearly list file paths

\- declare any required dependency additions

\- declare any required shared store or persistence file

\- do not hide follow-up requirements

