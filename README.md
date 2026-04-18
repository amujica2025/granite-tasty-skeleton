Handoff for the next agent
What the app is

This app is a capital-efficiency-focused options workspace built around your actual workflow, not broker defaults. The last approved working layout that should be treated as the visual baseline is the GitHub commit 8d426aa97b7b210fac075cd43e2e220a67e35121 with message “UI: panel buttons + no-overlay resizing; stable layout.”

Non-negotiable product vision

The app should become a custom Thinkorswim/Tasty-style terminal for:

live positions monitoring
capital-aware entry comparison
roll opportunity evaluation
term structure / vol context
user-defined watch structures
alerts
artifact-based visual collaboration
queryable journal / DB / AI workflow

It is not a generic dashboard.

Approved layout / viewport model

Use Excel-grid language. That is the correct language for this project.

Viewport/grid rules
10 columns × 6 rows
fixed-width columns
strict deterministic panel occupancy
no layout guessing
no soft floating consumer-app feel
three preset buttons only:
Default State
Outer + Watchlist/Scanners
Outer + Positions
Stable layout mental model

Default state:

New Panel = collapsed
Watchlist = collapsed
InfoHub = center top
Positions = center lower
Scanners = collapsed
New Panel 2 = collapsed

Expanded states:

sides bundle = New Panel + Watchlist + Scanners + New Panel 2 expanded
outer + positions = New Panel + Positions + New Panel 2 expanded
Panels started so far
Positions Panel

This is the hero panel.
Purpose:

raw truth layer
show legs only
no grouping in the main display
selected rows create a temporary simulation world

Rules already defined:

raw legs only, sorted by strike
row selection
selected state = white
modified qty state = yellow
qty overrides only move toward zero
totals row at bottom
totals row uses selected rows if selection exists
otherwise totals row uses all rows
if qty is modified, totals must use modified qty
qty controls:
longs: can only reduce toward 0, never exceed original, never flip sign
shorts: same idea, move toward 0 only
only one arrow appears at edge states
future actions from this panel:
add selected legs to InfoHub
create alerts from selection
artifact launch from selection
later roll workflows

What matters most:

Positions = atomic truth
no auto grouping
no auto-detection pretending to know intent
Watchlist

Purpose:

left-side market context rail/panel
collapsed and expanded modes
should conceptually mirror a Barchart-style data-rich watchlist when expanded
should be useful pre-open and intraday

Planned behavior:

collapsed view: minimal critical columns
expanded view: richer term-structure / volatility / market context columns
row-level actions:
quote
alert
scan
chart
chain
user wants multiple watchlists, import, save, share
watchlist should be able to feed the rest of the app when a symbol is chosen
InfoHub

Purpose:

center-top command strip
rotating / marquee-style status area
not just KPIs

Cards should include:

KPI cards
symbol cards
open-underlying cards
user-added structure cards
user-added symbol cards

Behavior:

if Positions is collapsed:
InfoHub gets more room
cards can be larger
chart area can be bigger
if Positions is expanded:
InfoHub compresses
cards shrink
sparkline / compact mode preferred

Crucial design rule:

no auto structure detection required for the user
user selects legs and explicitly adds them to InfoHub
Scanners Panel

Purpose:

right-side tooling stack
eventually:
entry scanner
roll scanner
vol surface / vol chart
capital-efficiency tools

State:

currently still conceptual / partially scaffolded in the layout shell
should remain secondary to Positions, but always visible in the right lane
New Panel / New Panel 2

Purpose:

symmetric outer rails/panels
user intentionally formalized them into the workspace
they expand outward from the default field of view
do not reinterpret them as accidental filler
Popups / modal systems started or planned
Alerts Center popup

Purpose:

alert creation and management
fill-in-the-blank rules
desktop + phone push by default
all alerts tracked in DB

Core behavior:

choose symbol / field / operator / value
create rule
view active rules
view alert history
later AI agent can manage alerts too
Artifact popup / canvas

Purpose:

visual analysis and shared reference surface
initially used when receiving an artifact
can also be launched later from positions, journal, scanners, alerts

Core behavior:

expanded artifact view
larger canvas
thumbnail / artifact switching rail
user can draw / annotate
agent should be able to use these annotations as shared reference context
Journal + DB + AI popup

Purpose:

unified access to:
journal entries
DB schema / event model
event log
AI chat interface

Core behavior:

quick direct answers first
depth only when requested
should be able to look up DB / journal history conversationally
Planned features you and I mapped

This is the consolidated list the next agent should inherit.

Positions / simulation / risk workflow
raw legs display only
row selection
ctrl/cmd multi-select
qty override toward zero only
totals row
selected totals mode
full-portfolio totals mode
add selected legs to InfoHub
add symbols to InfoHub
create alerts from rows
launch artifacts from rows
later roll workflows from rows
InfoHub / context layer
NLV
NLV × 25
BP
marquee cards
symbol cards
structure cards
underlyings with open positions
dynamic compact/full display based on Positions panel state
Alerts
fill-in-the-blank alert builder
any supported field as alertable field
desktop + push delivery
alert history
DB tracking
AI-managed alerts later
Artifacts
artifact viewer
expanded canvas
annotation layer
agent can discuss artifact with user using annotation context
Journal / DB / AI
event store
journal entries
artifacts
annotations
alerts + alert events
AI query interface
fast direct answers first
deeper explanation on demand
Future engine work
real chain-driven entry scanner
real roll scanner
capital-aware ranking
vol surface
term structure views
notional/BP-aware comparisons
later NLP / AI orchestration
2) Framework for splitting each panel/feature into its own project convo

This is how I would split it.

Common package every specialized agent should receive
A. Identity

Each agent should be told:

you own one panel or one subsystem
you are not redesigning the whole app
you must preserve the stable layout baseline
you must work inside the approved workspace model
B. Role
improve one panel/subsystem deeply
do not break other panels
keep backward compatibility with the repo baseline
produce changes as full-file replacements or one-step installer scripts
C. Required project files for every agent

Include:

the latest relevant file(s) for that panel
the GitHub baseline version of the same file(s)
one current screenshot if available
one short handoff summary
one “rules of engagement” file with your preferences
the stable layout commit hash:
8d426aa97b7b210fac075cd43e2e220a67e35121
D. Rules of engagement file for every agent

Tell them:

always compare the latest local file with the GitHub repo version before editing
preserve backward compatibility unless explicitly told to break it
do not tear down working layout logic
use Excel-grid / cell-ownership language
give me full file replacements or a one-step installer
do not give me vague frameworks
do not impose your own product language
keep responses direct
mock data is fine for visual/function scaffolding if live wiring is not ready
preserve existing auth/backend flows unless the task explicitly targets them
do not silently rewrite unrelated files
