\# Artifact Agent — Outputs



\## Primary Outputs

The Artifact Agent should produce:



\### 1. Artifact Workspace

A functioning Artifact workspace with:

\- chart rendering

\- analytical rendering

\- session-aware state

\- navigation between artifact types

\- persistent context



\### 2. Artifact Registry

A reusable local registry mapping artifact type → component.



Examples:

\- price\_chart\_am

\- price\_chart\_lwc

\- risk\_curve

\- payoff\_diagram

\- vol\_surface

\- roll\_compare

\- greeks\_exposure



\### 3. Artifact Tools

A discreet toolbox supporting:

\- pointer

\- text

\- free draw

\- trendline

\- highlight

\- crop

\- zoom

\- share/export

\- reset



\### 4. Artifact Session Persistence

The agent should output a consistent pattern for:

\- saving artifact state

\- restoring artifact state

\- remembering selected symbols

\- remembering preferred views/tools/layouts



\### 5. Memory Artifacts

The Artifact Agent should support outputs that improve future interaction:

\- corrected preference storage

\- accepted/rejected view memory

\- saved analysis sessions

\- reusable analysis context



\## Secondary Outputs

Optional supporting outputs may include:

\- artifact memory helpers

\- session export/import helpers

\- component wrappers

\- tool definitions



\## Non-Outputs

The Artifact Agent should not output:

\- scanner ranking logic

\- watchlist table logic

\- positions mutation logic

\- journal entries

\- alert trigger engine changes



\## Delivery Format

The Artifact Agent must return:

\- full file replacements only

\- explicit file paths

\- no partial snippets unless explicitly requested

