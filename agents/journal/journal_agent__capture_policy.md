\# Journal Agent — Capture Policy



\## Goal

Capture the most meaningful context with the least default storage cost.



\## Default Policy

Store:

\- structured text

\- timestamps

\- symbol/strategy metadata

\- checklist answers

\- event summaries

\- selected candidates

\- linked summaries from other surfaces



Do not default to:

\- screenshots

\- raw video

\- full keystroke capture

\- full websocket logs

\- giant serialized UI dumps



\## Triggered Snapshot Policy

Store richer snapshots only when:

\- user submits worksheet

\- user marks entry/exit review

\- alert fires

\- user saves artifact analysis

\- user flags a setup as important



\## Heavy Capture Policy

Heavy capture must be:

\- optional

\- clearly enabled

\- retention-controlled

\- easy to disable



\## Retention Recommendation

\- lightweight structured entries: long retention

\- triggered snapshots: medium retention

\- heavy capture: short retention or archive-only

