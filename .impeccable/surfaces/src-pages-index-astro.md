---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/Shell.astro"]
---

Scope: Overview, the single pane of glass at route `/`. Visitor mode: Operate. It shares one shell with Calendar, Planner, Report, Updates, Sources, Subscribe and the per-obligation pages.

Audience and task: the in-house compliance team (finance, legal, secretarial) reviews what is due and at risk over a chosen horizon, opens an obligation, reads its source and penalty, marks it filed with acknowledgement and owner, or escalates. Desktop and phone equally.

Content: structured rules from `data/`, expanded per horizon; penalty exposure; sources with verified dates; holidays; the regulator feed. No invented claims or numbers.

Constraints: horizon selector (1 week, 2 weeks, 1 month, 1 quarter, to year end, custom up to 24 months); sort by due date or penalty exposure; no alarm red everywhere, no walls of legal text, nothing playful.

Memorable moment: the pulse plot, where the month's filing rhythm (7th, 11th, 15th, 20th) rises as stacked pulses.

## Direction contract

THESIS: Every obligation is a catalog entry with its own number, and the horizon's risk is one pulse plot read at a glance; refuses the SaaS month grid with pastel pills and stat tiles.

OWN-WORLD: Matte black ground, hairline white rules and outlined controls, a code strip of grey, blue, yellow, red and white blocks where position names the law and colour names the state; wide grotesk numerals for codes, tracked mono caps for labels; only the active row decodes to full colour.

STORY: The team sees where risk sits in the horizon, what is overdue or due within a week, and which filing costs most if late; they open one, read its source, and mark it filed.

FIRST VIEWPORT: Header with tabs; horizon, sort and filter controls; a status readout of counts; the pulse plot across the full width (months stacked, days 1-31 across, pulse height is penalty exposure, today marked); the first table rows beneath with the at-risk column to the right.

FORM: Catalog Sleeve, the Factory Records catalog identity, adopted by the user over the assigned seventh grounded candidate (Route and Timetable); seed key 26667422.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
