\# Alerts Agent — Inputs



\## Product Inputs

The Alerts Agent receives:

\- user requirement to verify desktop and Pushover mobile notifications first

\- user requirement for low-friction rule creation

\- user requirement that alerting be useful before it becomes complex

\- user requirement that alert rules eventually be creatable from live Watchlist / Scanner / Positions context



\## Data Inputs

Alerts may consume:

\- symbol

\- underlying

\- last price

\- % move

\- selected scanner candidate

\- selected watchlist row

\- selected positions context

\- alert threshold

\- operator

\- alert type

\- active rules

\- alert history



\## Notification Inputs

The Alerts Agent should support:

\- browser/desktop notification capability

\- Pushover capability

\- test-notification status

\- permission state

\- per-channel enable/disable preferences



\## Rule Inputs

Journal may consume:

\- alert type (price / % move / future IV / future roll threshold)

\- target symbol

\- comparator

\- threshold value

\- note/message

\- enabled/disabled state



\## Structural Inputs

The Alerts Agent should assume:

\- stable integrated UI exists

\- alert logic should begin with notification reliability

\- app shell should be touched minimally

