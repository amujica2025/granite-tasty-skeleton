\# Scanner Agent — Inputs



\## Product Inputs

The Scanner Agent receives:

\- user requirement for one unified Scanner panel

\- user requirement for top toggle: Entry / Roll

\- user requirement for normalized risk comparison

\- user requirement that roll logic be holistic, not isolated

\- user requirement that open positions in the same underlying affect scanner thinking where appropriate

\- user requirement for a lower-third mini vol surface

\- user requirement that the mini vol surface reflect the currently selected underlying



\## Data Inputs

The Scanner Agent should be able to consume:

\- selected underlying

\- current live underlying quote

\- option chain data

\- open positions in the selected underlying

\- existing same-underlying spreads/legs

\- buying power / limit state

\- credit / debit candidates

\- vol surface payload for the next 5–10 expirations



\## Trading Logic Inputs



\### Entry Inputs

For entry scanning:

\- symbol

\- side preference

\- width candidates

\- expiration candidates

\- existing open same-underlying positions if relevant

\- current limit usage / available room



\### Roll Inputs

For roll scanning:

\- selected current legs or inferred structure

\- current same-underlying open positions left behind

\- current width / risk

\- possible replacement call spreads and put spreads

\- expiration ladder

\- capital impact before vs after



\## UI Inputs

\- current scanner mode (entry / roll)

\- selected scanner row

\- selected underlying

\- selected expiration filter

\- ranking mode

\- sort state

\- mini vol surface selected symbol



\## Structural Inputs

The Scanner Agent should assume:

\- stable integrated UI already exists

\- App.tsx is orchestration and should be touched minimally

\- Artifact may later open from Scanner rows

