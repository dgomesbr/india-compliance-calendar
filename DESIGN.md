---
name: India Compliance Calendar
description: Indian statutory deadlines with their sources, penalty exposure and holidays, set like a listed company's annual report.
colors:
  ground: "#ffffff"
  layer-1: "#f5f7fa"
  layer-2: "#ecf0f5"
  ink: "#0f1f33"
  ink-2: "#3f4f63"
  ink-3: "#5f6e80"
  rule: "#e2e7ee"
  rule-2: "#ccd4de"
  rule-3: "#93a0b0"
  navy: "#0e2a47"
  navy-2: "#173b60"
  navy-ink: "#ffffff"
  navy-ink-2: "rgba(255, 255, 255, 0.72)"
  accent: "#1d4ed8"
  accent-hover: "#1e40af"
  accent-weak: "#eff4ff"
  accent-line: "#b2c7ff"
  focus: "#1d4ed8"
  overdue: "#c0392b"
  overdue-text: "#a33223"
  overdue-tint: "#fbefed"
  overdue-line: "#f0c7c0"
  soon: "#c47c06"
  soon-text: "#8a5300"
  soon-tint: "#fdf5e4"
  soon-line: "#efd9a8"
  extended: "#3478c6"
  extended-text: "#1f5ea8"
  extended-tint: "#edf4fc"
  extended-line: "#c2d8f0"
  filed: "#287a4f"
  filed-text: "#1c6a43"
  filed-tint: "#ebf6f0"
  filed-line: "#bddfcb"
  upcoming: "#0e2a47"
  past: "#9aa6b4"
typography:
  display:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.015em"
    fontFeature: "'tnum'"
  headline:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  figure:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.015em"
    fontFeature: "'tnum'"
  control:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.01em"
  mono:
    fontFamily: "'Fragment Mono', ui-monospace, 'Cascadia Mono', Menlo, monospace"
    fontSize: "0.9em"
    fontWeight: 400
rounded:
  tag: "4px"
  control: "6px"
  panel: "10px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
  gutter: "clamp(16px, 3vw, 32px)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ground}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.ground}"
  button-secondary:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.layer-1}"
  button-secondary-active:
    backgroundColor: "{colors.layer-2}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-quiet-hover:
    backgroundColor: "{colors.layer-2}"
    textColor: "{colors.ink}"
  button-disabled:
    backgroundColor: "{colors.layer-1}"
    textColor: "{colors.ink-3}"
  button-on-navy:
    backgroundColor: "transparent"
    textColor: "{colors.navy-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-on-navy-hover:
    backgroundColor: "{colors.navy-2}"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "7px 11px"
    height: "38px"
  segmented:
    backgroundColor: "{colors.layer-1}"
    rounded: "8px"
    padding: "3px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "30px"
  segmented-option-on:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.navy}"
  filter-chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "30px"
  filter-chip-on:
    backgroundColor: "{colors.accent-weak}"
    textColor: "{colors.accent-hover}"
  status-count:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "0 12px 0 10px"
    height: "32px"
  status-count-on:
    backgroundColor: "{colors.accent-weak}"
  status-pill:
    backgroundColor: "{colors.layer-1}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "1px 8px 1px 7px"
  status-pill-overdue:
    backgroundColor: "{colors.overdue-tint}"
    textColor: "{colors.overdue-text}"
  status-pill-soon:
    backgroundColor: "{colors.soon-tint}"
    textColor: "{colors.soon-text}"
  status-pill-extended:
    backgroundColor: "{colors.extended-tint}"
    textColor: "{colors.extended-text}"
  status-pill-filed:
    backgroundColor: "{colors.filed-tint}"
    textColor: "{colors.filed-text}"
  status-pill-projected:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
  law-tag:
    backgroundColor: "{colors.layer-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  file-check:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.control}"
    size: "30px"
  file-check-filed:
    backgroundColor: "{colors.filed}"
    textColor: "{colors.ground}"
  masthead:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-ink}"
    height: "64px"
  nav-tab:
    textColor: "{colors.navy-ink-2}"
    typography: "{typography.control}"
    padding: "22px 12px 21px"
  nav-tab-active:
    textColor: "{colors.navy-ink}"
  table-head:
    backgroundColor: "{colors.layer-1}"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    padding: "10px 12px"
  table-row:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "12px"
  table-row-hover:
    backgroundColor: "{colors.layer-1}"
  table-row-selected:
    backgroundColor: "{colors.accent-weak}"
  timeline-tooltip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  sheet:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    width: "560px"
  report-sheet:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.panel}"
    padding: "48px 48px 32px"
---

# Design System: India Compliance Calendar

## Overview

**Creative North Star: "The Blue-Chip Annual Report"**

The compliance year is typeset the way a listed company sets its annual report. A deep navy masthead sits over white working pages, and the content below it is ruled tables with tabular figures, short lists under section rules, and a single chart that shows how the horizon's deadlines fall law by law. The register is corporate and clean: a document the board would accept, read at a desk and equally at home on a phone between meetings. Density is high but calm. One working page carries a headline, a row of controls, a full-width chart and a long table without crowding, because separation comes from hairlines, tonal bands and generous section spacing rather than from boxes.

Color is held back so that it can carry meaning. Navy is the ink of record: the masthead, every obligation code, the headline figures, the rule that opens each section, and every ordinary due date on the chart. A single cobalt marks what can be acted on or what is selected. Four muted state hues (overdue red, due-soon amber, extension blue, filed green) appear only where the state itself is the message. Type is one family, Archivo at its normal width, separated into roles by weight: semibold headings, a heavier figure voice for codes and figures, regular prose. Depth is nearly absent; surfaces are flat and tonal, and shadow only lifts a control by a hair or floats a transient layer.

The system replaces a dark catalog look the user tried and rejected, and it refuses the pastel SaaS dashboard of count tiles. The product's confirmed rejections carry into the visual system: no alarm red everywhere, no walls of legal text, nothing playful or gamified.

**Key Characteristics:**
- Navy masthead over white working pages and cool grey panels; light only.
- Ruled tables with tabular figures; hairlines, not boxes, separate content.
- A 2px navy rule opens every working section.
- One cobalt for action and selection; state hues only where state is the message.
- One family (Archivo, normal width) with a 650 figure voice for codes and figures.
- One chart: the swimlane timeline, its marks sized by the cost of filing late.
- Flat surfaces; shadow only for control lift, floating layers and dialogs.

## Colors

A cool, low-chroma slate field under a deep navy masthead, with one cobalt for action and four muted state hues held to state alone.

### Primary
- **Cobalt** (accent, #1d4ed8): the primary button in each action group, links, toggled law chips and status counts (as a border over Cobalt Wash), the selected table row, calendar day and timeline date range, and the Today line on the timeline. White on Cobalt and Cobalt on white both measure 6.7:1.
- **Deep Cobalt** (accent-hover, #1e40af): hover on primary buttons and links, and the text of a toggled law chip.
- **Cobalt Wash** (accent-weak, #eff4ff): the fill of whatever is selected or toggled on.
- **Cobalt Line** (accent-line, #b2c7ff): link underlines at rest (they darken to the text color on hover) and the edge of the selected range on the timeline.
- **Focus Cobalt** (focus, #1d4ed8): the 2px focus outline at 2px offset on light surfaces. Text inputs take a Cobalt border and a 3px Cobalt halo at 16% opacity instead.

### Secondary
- **Masthead Navy** (navy, #0e2a47): the sticky masthead, the 2px rule that opens each working section, obligation codes, headline figures, the calendar's today disc, the browser theme color and the favicon ground.
- **Raised Navy** (navy-2, #173b60): the hover fill of a control sitting on the masthead.
- **Masthead White** (navy-ink, #ffffff): the wordmark, the current tab, icons and focus rings on navy.
- **Masthead Muted White** (navy-ink-2, rgba(255, 255, 255, 0.72)): inactive tabs (8.2:1 on navy).
- **Upcoming Navy** (upcoming, #0e2a47): the state color of an ordinary open obligation, on timeline marks, its status-count dot and calendar chip dots. It is the masthead navy by design, so an ordinary due date is drawn in the ink of record and only exceptions take a hue.

### Tertiary
The state hues. Each state has a solid for marks and dots, a darker text tone, a tint for fills and a line for borders; any state-colored text uses the text tone.
- **Overdue Red** (overdue #c0392b, overdue-text #a33223, overdue-tint #fbefed, overdue-line #f0c7c0): past due and unfiled, nothing else.
- **Due-Soon Amber** (soon #c47c06, soon-text #8a5300, soon-tint #fdf5e4, soon-line #efd9a8): due within 7 days.
- **Extension Blue** (extended #3478c6, extended-text #1f5ea8, extended-tint #edf4fc, extended-line #c2d8f0): a notified extension moved the date; the tint also backs the extension note in the detail panel. It is a state, never an action color.
- **Filed Green** (filed #287a4f, filed-text #1c6a43, filed-tint #ebf6f0, filed-line #bddfcb): recorded as filed; also the hover border and the filled face of the file check.
- **Past Grey** (past #9aa6b4): due dates that passed before the team began tracking; deliberately the quietest mark on the chart.

### Neutral
- **Report White** (ground, #ffffff): the working page, controls, sheets and the report page.
- **Cool Panel Grey** (layer-1, #f5f7fa): the table header band, the segmented-control track, grouped-input panels (custom horizon, planner), the month grid's weekday header and blank cells, the footer band, hover on rows and secondary buttons, and the stretch of the chart beyond the chosen horizon.
- **Tag Grey** (layer-2, #ecf0f5): law tags, calendar code chips, inline code, the hover fill of quiet buttons and the pressed secondary button.
- **Ledger Ink** (ink, #0f1f33): text and headings.
- **Slate Ink** (ink-2, #3f4f63): secondary text: obligation names in tables, notes, inactive options, chip text and field labels (8.4:1).
- **Caption Slate** (ink-3, #5f6e80): labels, column heads, meta lines, placeholders and axis ticks (5.2:1 on white, 4.9:1 on Cool Panel Grey).
- **Hairline Rule** (rule, #e2e7ee): every row divider and section hairline.
- **Control Rule** (rule-2, #ccd4de): borders of buttons, inputs and chips, and the rule under a table header band or due strip.
- **Hover Rule** (rule-3, #93a0b0): borders on hover and the dashed border of a projected pill.

A few literals live outside the token set and belong to the system rather than to one screen: text selection #d6e2ff under Ledger Ink, a thin #c3cbd6 scrollbar on white, the current-tab bar #8fb0ff on navy (6.8:1), the dialog backdrop rgba(16, 24, 40, 0.42), and weekend day cells at #fbfbfc.

### Named Rules
**The One Cobalt Rule.** Cobalt is the only hue that means act or selected: primary buttons, links, toggled filters, the selected row, day and range, focus, and Today on the chart. Nothing decorative is cobalt. Two places mark selection differently, and both are deliberate: the segmented control shows its current value as a raised white segment with navy text, and on navy the current tab uses the lighter #8fb0ff bar.

**The State Is the Message Rule.** Red, amber, extension blue and green appear only on an element whose message is that state: status pills, timeline marks and the status-count dots that serve as their legend, calendar code chips, the file check, the extension note, and status cells and figures in the report. Never as a section color, heading color, row stripe or page wash.

**The Quiet Red Rule.** Red means overdue and nothing else. The Overdue count turns red only when it is above zero, and so does the report's Overdue figure; with nothing overdue, the only red left on screen is the legend dot of the Overdue filter.

## Typography

**Display Font:** Archivo (variable, self-hosted, pinned to normal width), with ui-sans-serif, system-ui, -apple-system and Segoe UI as fallbacks
**Body Font:** Archivo (the same family)
**Label/Mono Font:** Fragment Mono, for code identifiers only

**Character:** One plain, firm grotesque does every job, and roles are told apart by weight rather than by a second face: semibold headings, a heavier 650 figure voice for codes and figures, regular prose. It reads like the typeset body of an annual report, numerically exact and unshowy.

### Hierarchy
- **Display** (650, 2.25rem, 1.1, -0.015em, tabular figures): the range headline on the Overview, page titles, the code at the head of the detail panel, the report period. Steps to 1.75rem below 720px. The per-obligation entry page sets its code one step larger (3rem, 2.25rem on phones), the only size above the ramp.
- **Headline** (600, 1.375rem, 1.2, -0.01em): section heads on reading pages (navy, with a hairline beneath) and sheet titles.
- **Title** (500, 1.125rem, 1.35): an obligation's name under its code (1.375rem on the entry page). Ledes use the same size at 400 and 1.5; block headings at this size (an empty state, planner results) take 600.
- **Body** (400, 0.9375rem, 1.5): running text. Prose blocks cap at 70ch and open to a 1.6 line height; the footer note caps at 62ch.
- **Body small** (400, 0.8125rem, 1.5): tables, detail sections (at 1.55), notes and the footer.
- **Figure** (650, 0.9375rem in tables and lists, 1.1, -0.015em, tabular figures): obligation codes and headline counts; the same voice scales up for display and for the 1.75rem cost and report figures.
- **Control** (600, 0.8125rem, 1): buttons, segmented options, masthead tabs, footer links and disclosure summaries.
- **Label** (600, 0.75rem, 1.35, +0.01em, sentence case): column heads, field labels, list headings, meta lines and pills.
- **Mono** (Fragment Mono 400, 0.9em): rule ids and code on a Tag Grey chip, nowhere else.

Inside the chart, text is set in pixels on the same family: lane names 12.5px 600, ticks 11px 500 (600 on major ticks), Today 11px 700 in Cobalt, mark counts 9.5px 700 (8.5px at -0.02em for two digits), and the cost callout 11.5px 650 in navy with a 4px white halo.

### Named Rules
**The Figure Voice Rule.** Codes, counts and headline figures take the figure voice (650, -0.015em, tabular); dates and amounts in tables take 600 with tabular figures, and every table is tabular by default. Obligation codes are navy unless a state chip recolors them or a filed row fades them.

**The Sentence-Case Label Rule.** Labels are 12px semibold at +0.01em, in sentence case, in Caption Slate (Slate Ink for field labels). No uppercase, no wide tracking, no small caps.

**The One Family Rule.** Archivo at normal width carries every role from the 3rem entry code to the 9.5px chart counts. Do not reach for its condensed or expanded widths or add a second display face, and do not set numbers in Fragment Mono.

## Layout

The page is one centered column, at most 1440px wide, with a side gutter of clamp(16px, 3vw, 32px). The Overview stacks its head (the range headline with the profile name beside it, then the controls row, the law filters and the status counts), a full-width chart, and a split of the table (minmax(0, 1fr)) beside a 360px aside, 32px apart. The aside holds four short lists (costliest if late, extended or moved, due on a holiday or weekend, from the regulators) and gives way to the obligation detail when a row is selected; the detail then sticks 80px from the top and scrolls on its own. The month calendar uses the same split with a 340px day list, and the per-obligation entry page splits 1.4fr to 1fr with 48px between. Reading pages hold their head to 760px and their prose to 70ch.

Spacing runs on a 4px base (4, 8, 12, 16, 24, 32, 48, 64). Groups are tight (6px between chips, 8px between status counts and inside buttons, 12 to 16px between controls) and separation is generous (16 to 24px between the head's rows, 24 to 32px between blocks, 48px between reading-page sections, 64px above the footer). Table cells pad 12px, aside items 10px top and bottom, and a section rule sits 12px above its heading. The 64px masthead is sticky, and the table's header band sticks directly beneath it.

Responsive behavior is a set of discrete steps rather than fluid type. Below 1100px the split collapses to one column, the aside lists follow the table, and the detail leaves the aside to open as a right-hand sheet. Below 900px the masthead wraps and its tabs take their own row, scrolling sideways behind a right-edge fade. Below 720px titles step down, the horizon control becomes a four-column grid, the sort select fills its row, law chips scroll sideways edge to edge, the table drops its header and the authority column and each row becomes a stacked grid (code and file check, then due and amount, then pills), sheets go full width, and the month grid shrinks to 58px cells that show state dots instead of code chips. Below 600px the profile button keeps only its icon. The chart has its own narrow drawing whenever its width is under 640px: short lane names, no lane counts, smaller marks, two-digit years at each year change, and no cost callout.

### Named Rules
**The Ruled Section Rule.** A working section opens with a 2px navy rule across its full width (the chart, each aside list, the detail panel, the calendar's day list, the report's key figures), and its rows are divided by 1px Hairline Rules. Boxes are the exception, never the container.

## Elevation & Depth

The system is flat and tonal. Surfaces are told apart by Cool Panel Grey bands and hairlines, and shadow, always a cool soft blur on an rgba(16, 24, 40) base, appears in three small doses: a resting lift that makes controls read as pressable, a float for the transient tooltip and the on-screen report page, and a deep throw for dialogs. Print removes all of it.

### Shadow Vocabulary
- **Control lift** (`box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06)`): buttons, inputs, selects, the file check, and the current segment of the segmented control (paired with a 1px Hairline ring). Quiet and disabled buttons drop it.
- **Float** (`box-shadow: 0 4px 12px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)`): the chart's tooltip and the report sheet on screen.
- **Sheet** (`box-shadow: 0 18px 40px -12px rgba(16, 24, 40, 0.22)`): the right-hand dialogs (the obligation detail on smaller screens, the entity profile) over a rgba(16, 24, 40, 0.42) backdrop.
- **Masthead edge** (`box-shadow: 0 1px 0 rgba(16, 24, 40, 0.18)`): a 1px edge under the sticky masthead; a rule, not depth.

### Named Rules
**The Paper Flat Rule.** Content does not float. Tables, lists, panels and the chart lie flat on the page; only controls (by a hair), the tooltip, the on-screen report sheet and dialogs carry shadow.

## Shapes

The form language is soft rectangles, full pills and circles. Controls take gently squared 6px corners (buttons, inputs, selects, status counts, the file check, the tooltip, detail notes), the segmented track that nests them takes 8px, and the few bordered panels take 10px (the month grid, grouped-input panels, empty states, subscribe tiles, the report sheet). Small tags (law tags, calendar code chips, inline code) take 4px. Full pills are reserved for status pills, law filter chips and the calendar's today number. Circles carry data: the 6px state dot inside each pill, the 9px dot in each status count, and every timeline mark. Lines are 1px hairlines plus the 2px navy section rule; a dashed line marks the provisional (the projected pill's border, the empty state's frame), and the chart's lanes are dotted guides (2px dash, 4px gap).

### Named Rules
**The Round Ends Rule.** Full pills belong to statuses and law filters. Buttons that do something (file, print, export, subscribe, save) are 6px rectangles.

## Components

### Buttons
Squared, quiet and firm: the secondary button is the default, and each action group gets at most one cobalt primary.
- **Shape:** gently squared (6px), 36px tall, 14px side padding, an 8px gap to a 16px icon, control type.
- **Primary:** Cobalt fill and border with white text ("Mark filed", "Print", "Save profile", "Subscribe to this obligation"); Deep Cobalt on hover. In markup the primary variant is the secondary button carrying an empty block marker as its last child.
- **Secondary:** white with a Control Rule border, Ledger Ink text and the control lift; hover Cool Panel Grey with a Hover Rule border; pressed Tag Grey.
- **Quiet:** no border, fill or shadow, Slate Ink text; hover Tag Grey fill with Ledger Ink. Used for close, cancel, "Copy link", "Clear date" and "Show everything".
- **Disabled:** Cool Panel Grey with a Hairline border and Caption Slate text, no shadow, a not-allowed cursor.
- **On navy:** the profile button is transparent with a 28% white border, white text and a user icon; hover Raised Navy with a 60% border. Below 600px it keeps only its icon.
- **Hover / Focus:** color changes over 150ms on the system ease-out, cubic-bezier(0.16, 1, 0.3, 1); focus is the 2px Cobalt outline at 2px offset on light surfaces and a white outline on navy.

### Chips
- **Law filter chips:** full pills 30px tall, white with a Control Rule border and Slate Ink text at 13px 500; hover a Hover Rule border and Ledger Ink; on, a Cobalt border, Cobalt Wash fill and Deep Cobalt text. A text button, "Show all laws", appears in Cobalt once any chip is on.
- **Status pills:** label type in a full pill with a 6px state dot, a state line border, a state tint fill and state text (Overdue, Due within 7 days, Extended, Filed). Projected is white with a dashed Hover Rule border and a hollow dot; past is neutral. In tables and lists an ordinary upcoming item carries no pill at all, so the absence of a pill means nothing needs attention; only the detail's due strip names it, in a neutral pill.
- **Law tags:** 4px Tag Grey tags in Slate Ink label type that name the law beside each code ("Income tax", "GST", "FEMA").

### Status counts
The row of state counts under the law filters is both a filter and the chart's color legend. Each is a 32px button with 6px corners, white with a Hairline border, holding a 9px state dot, the count at 650 with tabular figures and the state name; toggled on, it takes a Cobalt border over Cobalt Wash. The horizon's fixed exposure ("Rs 19,77,100 fixed exposure if every open item ran 30 days late") closes the row in Caption Slate.

### Cards / Containers
- **Ruled sections, not cards.** The default container is the ruled section: a 2px navy rule, a heading, hairline-divided rows.
- **Bordered panels** (10px corners, Hairline border, no shadow) appear only where the content is itself a sheet or a group: grouped inputs on Cool Panel Grey (the custom horizon at 12px by 16px padding, the planner form at 24px), the month grid, the subscribe tiles, and the empty state, which uses a dashed Control Rule frame at 32px by 24px with a 1.125rem 600 title and its recovery actions.
- **Detail notes:** 6px corners, Cool Panel Grey (the Extension tint for an extension), 13px Slate Ink, 8px by 12px padding.

### Inputs / Fields
- **Style:** 38px tall, 6px corners, white, a Control Rule border with the control lift, 13px text, 7px by 11px padding, placeholder in Caption Slate. Selects draw a small caret of their own and reserve 34px on the right; search insets a 16px icon 11px from the left.
- **Hover:** a Hover Rule border.
- **Focus:** a Cobalt border and a 3px Cobalt halo at 16%, no outline.
- **Labels:** label type above the field with a 6px gap; inline labels such as "Order by" and "Months ahead" sit to the left in Caption Slate. Checkboxes and range sliders take Cobalt as their accent color.

### Navigation
- **Masthead:** a sticky 64px navy bar with the wordmark (the drawn 24px calendar-check mark and "India Compliance Calendar" at 15px 650) at the left, the tabs, and the profile button at the right.
- **Tabs:** control type in Masthead Muted White, white on hover and when current; the current tab carries a 3px #8fb0ff bar with rounded top corners along its bottom edge. Tab focus is a white outline inset 4px.
- **Mobile:** below 900px the tabs move to their own row, scroll sideways and fade out at the right edge to show there is more.
- **Footer:** a Cool Panel Grey band under a hairline holding the "Information only, not legal advice" note, links in 13px 600 Slate Ink that turn Cobalt on hover, and the build date.

### Obligations table
The working core of every horizon: ruled, tabular and sticky-headed. The header band is Cool Panel Grey with label type in Caption Slate between a hairline above and a Control Rule below, and it sticks under the masthead. Ordered by due date, rows group under a date line ("Thu 15 Oct 2026 - Today - 14 obligations") in 13px 600 Ledger Ink with faint qualifiers. The columns are when (days left, "Today" or "3d late", set in Ledger Ink 600 when due soon or overdue), the obligation (the navy code in the figure voice with its law tag, the name in Slate Ink, the period as a faint label), the authority (two lines at most), the cost at 30 days (right-aligned, "+ interest" beneath), the state (pills and owner) and the file check. Rows take Cool Panel Grey on hover and Cobalt Wash when selected; filed rows fade code, name and date to Caption Slate.
- **File check:** a 30px square with 6px corners, white with a Control Rule border and a check icon in Caption Slate; hover a Filed Green border and Filed text; filed, solid Filed Green with a white check. One click marks the item filed today; the detail form records date, acknowledgement and owner.

### Swimlane timeline (signature)
The one chart, under its own 2px navy rule with a plain-language note on how to read it. One lane per law, its name at the left (with its count on wide screens); dotted lane guides; month ticks (Monday ticks on short spans) with heavier lines at major starts; a 1.5px Cobalt Today line labelled in Cobalt. Each due date is a circle whose radius grows with the log of its fixed 30-day penalty, keyed as under Rs 1,000, Rs 10,000 and Rs 1 lakh or more, filled with its state color (navy when ordinary) and ringed 1.5px in white so neighbors stay separate. Marks that would touch merge into a cluster large enough to print its count. Past the chosen horizon the field turns Cool Panel Grey and marks drop to 38% opacity. The costliest mark in the horizon gets a navy callout ("MOOWR +1 - Rs 4 L") placed where it never covers a mark. Hovering or arrowing to a mark rings it in Ledger Ink and shows the tooltip (white, 6px, float shadow: date range, law tag, codes in navy, count, state and the rupee cost); Enter or a click filters the table to that date, drawn as a Cobalt Wash band with a Cobalt Line edge.

Cluster counts are white numerals. On the amber due-soon fill they measure about 2.9:1, under the floor for text; that is a known shortfall of the build, not a precedent for white text on light state solids.

### Detail panel
In the aside on wide screens, in a right-hand sheet below 1100px. It opens under a 2px navy rule with the code in display type, the name in title type and a meta line (law tag, authority, period), then a due strip between a Control Rule and a hairline that sets Due, When and State side by side, the state column sized to its pill so it never wraps. The filing actions follow (Mark filed as the primary, Add to calendar, Copy link as quiet), then the owner field, then hairline-divided sections under label headings: the summary, who files, the cost of a delay (a days-late slider driving the cost in 1.75rem navy figures), the rule, and the sources with their verified date and confidence. Legal text sits behind Cobalt disclosure summaries, closed by default.

### Month calendar
A grid with 10px outer corners and hairline cells 112px tall; the weekday header and blank cells are Cool Panel Grey, and weekend cells sit a shade off white with faint numbers. Today is a navy disc; the selected day is Cobalt Wash with a 1.5px inset Cobalt ring, so the two never read alike. Each day lists up to four code chips (4px, Tag Grey, navy 12px 600 with a state dot, tinted by state when the state is not ordinary) and a "+N more" line; holidays are named in Slate Ink.

### Report sheet
The printable board report. On screen it is a white page with 10px corners, a Hairline border and the float shadow; in print it is the bare page. The period sits in navy display type over the entity and dates, then a key-figures strip of five label-over-figure pairs in 1.75rem navy between a 2px navy rule and a Control Rule (Overdue in red only when nonzero), then a ruled table in which only the status cell takes color.

### Named Rules
**The One Chart Rule.** The swimlane timeline is the system's only chart. Other surfaces show the same data as ruled tables, the month grid and lists; no sparklines, rings or secondary charts.

## Do's and Don'ts

### Do:
- **Do** open every working section with the 2px navy rule and divide its rows with 1px Hairline Rules (#e2e7ee).
- **Do** keep Cobalt (#1d4ed8) for the primary action, links, toggled filters, selection, focus and Today, with at most one primary button per action group.
- **Do** set codes, counts and headline figures in the figure voice (650, -0.015em, tabular figures), and keep codes navy.
- **Do** show state with a pill or a mark in the state's color, and use the state's text tone (overdue-text, soon-text, extended-text, filed-text) for any state-colored text.
- **Do** leave an ordinary upcoming item navy and pill-less in tables and lists; color is for exceptions.
- **Do** put legal text, penalty bases and change notes behind a disclosure, and show every rule's sources with its verified date.
- **Do** draw icons from the Lucide set at 16px with a 1.75 stroke, round caps and joins, in the current text color; the calendar-check mark is the product's own.
- **Do** theme the browser's own surfaces from the palette: #d6e2ff selection, a thin #c3cbd6 scrollbar, a Cobalt caret, 1px Cobalt Line underlines offset 0.2em, and Cobalt checkboxes and sliders.
- **Do** move state changes on the system ease-out (cubic-bezier(0.16, 1, 0.3, 1)) at 120 to 150ms, keep the sheet's 220ms slide as the one entrance, and honor reduced motion.

### Don't:
- **Don't** bring back a dark ground or the dark catalog look this system replaced; it is light only.
- **Don't** build count tiles or hero metrics on working surfaces; counts are compact filter buttons, and the large-figure strip belongs to the printable report.
- **Don't** use red for anything but overdue, and don't color a count red at zero.
- **Don't** add a second accent hue, or use a state hue as decoration, a section color, a row stripe or a page wash.
- **Don't** make cards the page structure or nest boxes; working content lives in ruled sections and hairline rows, and bordered panels stay limited to the cases under Cards / Containers.
- **Don't** add a second chart, sparklines or progress rings.
- **Don't** uppercase or letter-space labels, and don't set numbers in Fragment Mono; it is for code identifiers only.
- **Don't** use Archivo's condensed or expanded widths, or a second display face.
- **Don't** lift content with shadow; only controls, the tooltip, the on-screen report sheet and dialogs carry it.
- **Don't** add gradient fills, gradient text, glass or blur; the only gradients in the system are functional (the select caret, the loading shimmer, the masthead's scroll fade).
- **Don't** add playful or gamified touches such as illustrations, emoji or celebrations on filing; a filed item simply turns green and goes quiet.
- **Don't** set white text on the amber due-soon solid; amber carries text only as soon-text on its tint.
