---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/Shell.astro"]
---

Scope: Overview, the single pane of glass at route `/`. Visitor mode: Operate. It shares one shell with Calendar, Planner, Report, Updates, Sources, Subscribe and the per-obligation pages.

Audience and task: the in-house compliance team (finance, legal, secretarial) reviews what is due and at risk over a chosen horizon, opens an obligation, reads its source and penalty, marks it filed with acknowledgement and owner, or escalates. Desktop and phone equally.

Content: structured rules from `data/`, expanded per horizon; penalty exposure; sources with verified dates; holidays; the regulator feed. No invented claims or numbers.

Constraints: horizon selector (1 week, 2 weeks, 1 month, 1 quarter, to year end, custom up to 24 months); sort by due date or penalty exposure; corporate and clean (user's standing preference); no alarm red everywhere, no walls of legal text, nothing playful.

Memorable moment: the swimlane timeline, where each law's deadlines line up across the horizon and the costliest ones stand out as larger marks.

History: replaces the Catalog Sleeve world (matte black, pulse plot), which the user asked to replace with a more corporate, cleaner theme.

## Direction contract

THESIS: The compliance year set like a listed company's annual report: a navy masthead, white working pages, ruled tables and one chart that tells the year; refuses both the dark catalog look and the pastel SaaS dashboard of count tiles.

OWN-WORLD: White ground and cool grey panels under a deep navy masthead; ruled tables with tabular figures; Archivo at normal width with semibold headings; one cobalt for actions and selection; state tints (amber due soon, red overdue, blue extended, green filed) only on status pills and timeline marks.

STORY: The team sees what is due and at risk in the horizon, which law is heaviest when, and which filing costs most if late; they open one, read its source, and mark it filed.

FIRST VIEWPORT: Navy top bar with tabs and the profile; the range as the headline with horizon, sort and search controls; law filters and status counts; a full-width swimlane timeline (one lane per law, due dates as marks sized by penalty, a cobalt today line); the first table rows beneath with the at-risk column to the right.

FORM: Annual Report, first of my safer-register grounded list, chosen by the user over Board Pack, Desk Calendar and the category standard; seed key 26667422 (re-roll 1, safer register).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
