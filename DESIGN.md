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
  navy-accent: "#8fb0ff"
  accent: "#1d4ed8"
  accent-hover: "#1e40af"
  accent-weak: "#eff4ff"
  accent-line: "#b2c7ff"
  focus: "#1d4ed8"
  overdue: "#c0392b"
  overdue-text: "#a33223"
  overdue-tint: "#fbefed"
  overdue-line: "#f0c7c0"
  overdue-on-navy: "#ff9d8f"
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
  filed-on-navy: "#4fb985"
  upcoming: "#0e2a47"
  past: "#9aa6b4"
  law-income-tax: "#d4568f"
  law-gst: "#8c2f4f"
  law-mca: "#4a55b8"
  law-sebi: "#7a8a10"
  law-rbi-fema: "#8e3ea8"
  law-labour: "#d9622b"
  law-state: "#0e8fb8"
  law-trade: "#9a4e12"
  law-other: "#8794a3"
typography:
  display:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.75rem"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 108"
  display-lg:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "3.5rem"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 108"
  key-figure:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2rem"
    fontWeight: 750
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 108"
  headline:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  figure:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 750
    lineHeight: 1.08
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
  control:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.78125rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "0.01em"
  chart:
    fontFamily: "'Archivo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 400
  mono:
    fontFamily: "'Fragment Mono', ui-monospace, 'Cascadia Mono', Menlo, monospace"
    fontSize: "0.9em"
    fontWeight: 400
rounded:
  swatch: "2px"
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
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.navy-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-on-navy-hover:
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  button-on-navy-primary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.navy}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-on-navy-primary-hover:
    backgroundColor: "#eaf0ff"
    textColor: "{colors.navy}"
  button-profile:
    backgroundColor: "transparent"
    textColor: "{colors.navy-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-profile-hover:
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
    padding: "0 13px"
    height: "32px"
  segmented-thumb:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
  law-chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 13px 0 11px"
    height: "32px"
  law-chip-on:
    backgroundColor: "{colors.accent-weak}"
    textColor: "{colors.accent-hover}"
  filter-chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 13px"
    height: "32px"
  filter-chip-on:
    backgroundColor: "{colors.accent-weak}"
    textColor: "{colors.accent-hover}"
  law-swatch:
    backgroundColor: "{colors.law-other}"
    rounded: "{rounded.swatch}"
    size: "8px"
  law-tag:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "1px 7px 1px 6px"
  law-tag-on-navy:
    backgroundColor: "rgba(255, 255, 255, 0.1)"
    textColor: "{colors.navy-ink}"
  status-pill:
    backgroundColor: "{colors.layer-1}"
    textColor: "{colors.ink-2}"
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
  file-check:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.control}"
    size: "32px"
  file-check-filed:
    backgroundColor: "{colors.filed}"
    textColor: "{colors.ground}"
  masthead:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-ink}"
    height: "64px"
  nav-tab:
    textColor: "{colors.navy-ink-2}"
    padding: "22px 12px 21px"
  nav-tab-active:
    textColor: "{colors.navy-ink}"
  nav-indicator:
    backgroundColor: "{colors.navy-accent}"
    height: "3px"
  band:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-ink}"
    padding: "32px clamp(16px, 3vw, 32px)"
  band-title:
    textColor: "{colors.navy-ink}"
    typography: "{typography.display}"
  band-figure:
    backgroundColor: "transparent"
    textColor: "{colors.navy-ink}"
    typography: "{typography.key-figure}"
    rounded: "{rounded.control}"
    padding: "8px 10px 10px"
  band-figure-hover:
    backgroundColor: "rgba(255, 255, 255, 0.07)"
  band-figure-on:
    backgroundColor: "rgba(143, 176, 255, 0.16)"
  table-head:
    backgroundColor: "{colors.layer-1}"
    textColor: "{colors.ink-2}"
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
  table-row-just-filed:
    backgroundColor: "{colors.filed-tint}"
  timeline-tooltip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  delay-readout:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "5px 10px 6px"
  next-leaf:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "12px 16px 16px"
  next-leaf-first:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-ink}"
  source-card:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
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

The compliance year is typeset the way a listed company sets its annual report. A deep navy masthead runs straight into a navy cover band at the top of every page, carrying the page's title, a short lede and, where the page has them, its key figures. Below the cover the working pages are white, and the content is ruled tables with tabular figures, short lists under section rules, and two charts: one shows how the horizon's deadlines fall law by law, the other what a single filing costs for each day it is late. The register is corporate and clean: a document the board would accept, read at a desk and equally at home on a phone between meetings. Density is high but calm. One working page carries a cover, a row of controls, a full-width chart and a long table without crowding, because separation comes from hairlines, tonal bands and generous section spacing rather than from boxes.

Color is held back so that it can carry meaning. Navy is the ink of record: the masthead and cover, every obligation code, the headline figures, the rule that opens each section, and every ordinary due date on the chart. A single cobalt marks what can be acted on or what is selected on white, and a lighter Cover Blue does that job on navy. Four muted state hues (overdue red, due-soon amber, extension blue, filed green) appear only where the state itself is the message. Nine law hues name the laws, but only as small squares and faint washes beside ink text, so a reader can follow one law across the chips, the chart's lanes and the tags without color ever standing in for words. Type is one family, Archivo, separated into roles by weight and, for the few largest lines, by width: bold headings, a heavier figure voice for codes and figures, a slightly wide display voice for cover titles and key figures, regular prose. Depth is nearly absent; surfaces are flat and tonal, and shadow only lifts a control or floats a transient layer.

Motion is refined and present everywhere, but it explains change rather than performing: a press answers at once, rows glide to their new places, figures count to their new values, and between pages the masthead holds while the cover morphs. Each surface has at most one authored moment; on the Overview it is the timeline assembling outward from Today. The system replaces a dark catalog look the user tried and rejected, and it refuses the pastel SaaS dashboard of count tiles. The product's confirmed rejections carry into the visual system: no alarm red everywhere, no walls of legal text, nothing playful or gamified, which is why motion confirms a filing and never celebrates it.

**Key Characteristics:**
- A navy masthead running into a navy cover band on every page, over white working pages and cool grey panels; light only.
- Ruled tables with tabular figures; hairlines, not boxes, separate content.
- A 2px navy rule opens every working section.
- One cobalt for action and selection on white, Cover Blue for selection on navy; state hues only where state is the message.
- Nine law hues as identity, held to small squares and faint washes beside ink text.
- One family (Archivo): 700 headings, a 750 figure voice, and a 108% width for the largest lines.
- Two charts: the swimlane timeline, its marks sized by the cost of filing late, and the cost-of-delay curve.
- Flat surfaces; shadow only for control lift, floating layers and dialogs.
- Motion that confirms and continues on one exponential ease-out, with a reduced-motion path of fades.

## Colors

A cool, low-chroma slate field under a deep navy masthead and cover, with one cobalt for action, four muted state hues held to state alone, and nine law hues held to small identity marks.

### Primary
- **Cobalt** (accent, #1d4ed8): the primary button in each action group, links, source titles and disclosure summaries, toggled law and filter chips (as a border over Cobalt Wash), the selected table row, calendar day and timeline date range, the search icon while its field has focus, and the Today line on the timeline. White on Cobalt and Cobalt on white both measure 6.7:1.
- **Deep Cobalt** (accent-hover, #1e40af): hover on primary buttons, links and disclosure summaries, and the text of a toggled chip.
- **Cobalt Wash** (accent-weak, #eff4ff): the fill of whatever is selected or toggled on.
- **Cobalt Line** (accent-line, #b2c7ff): link underlines at rest (on hover they darken to the text color and open from a 0.2em to a 0.28em offset), the edge of the selected range on the timeline, and the border of a source card under the pointer.
- **Focus Cobalt** (focus, #1d4ed8): the 2px focus outline at 2px offset on light surfaces, easing out to its offset as it appears. Text inputs take a Cobalt border and a 3px Cobalt halo at 16% opacity instead.

### Secondary
- **Masthead Navy** (navy, #0e2a47): the sticky masthead and the cover band beneath it, the 2px rule that opens each working section, obligation codes, headline figures, the first of the next-due leaves, the costliest bars, the cost-of-delay marker, the calendar's today disc, the browser theme color and the favicon ground.
- **Raised Navy** (navy-2, #173b60): the hover fill of the profile button on the masthead.
- **Masthead White** (navy-ink, #ffffff): the wordmark, the current tab, cover titles and figures, icons and focus rings on navy, and the cover's primary button.
- **Masthead Muted White** (navy-ink-2, rgba(255, 255, 255, 0.72)): inactive tabs, cover ledes, sub lines and figure labels (8.2:1 on navy).
- **Cover Blue** (navy-accent, #8fb0ff): selection on navy, as Cobalt is on white: the current tab's bar (6.8:1 on navy) and, at 16% with a 70% ring, a key figure toggled on. The cover's ambient light is the same hue at 6 to 20%; that is its one decorative use, and it stays on the cover.
- **Upcoming Navy** (upcoming, #0e2a47): the state color of an ordinary open obligation, on timeline marks and calendar chip dots. It is the masthead navy by design, so an ordinary due date is drawn in the ink of record and only exceptions take a hue; on the cover its dot turns white.

### Tertiary
The state hues. Each state has a solid for marks and dots, a darker text tone, a tint for fills and a line for borders; any state-colored text uses the text tone.
- **Overdue Red** (overdue #c0392b, overdue-text #a33223, overdue-tint #fbefed, overdue-line #f0c7c0): past due and unfiled, nothing else. On navy its text tone is **Overdue Red on Navy** (overdue-on-navy, #ff9d8f, 7.3:1), which only the Overdue key figure uses, and only above zero.
- **Due-Soon Amber** (soon #c47c06, soon-text #8a5300, soon-tint #fdf5e4, soon-line #efd9a8): due within 7 days.
- **Extension Blue** (extended #3478c6, extended-text #1f5ea8, extended-tint #edf4fc, extended-line #c2d8f0): a notified extension moved the date; the tint also backs the extension note in the detail panel. It is a state, never an action color.
- **Filed Green** (filed #287a4f, filed-text #1c6a43, filed-tint #ebf6f0, filed-line #bddfcb): recorded as filed; also the hover border and the filled face of the file check, and the tint and ring that confirm a filing. On navy its dot lifts to **Filed Green on Navy** (filed-on-navy, #4fb985, 6.0:1).
- **Past Grey** (past #9aa6b4): due dates that passed before the team began tracking; deliberately the quietest mark.

The three on-navy tones (Cover Blue and the two lifted state tones) are literals in the masthead and cover styles rather than custom properties.

### Law identity
A validated categorical set, one hue per law area, each holding at least 3:1 against white as a mark: **Income Tax Rose** (law-income-tax, #d4568f), **GST Claret** (law-gst, #8c2f4f), **MCA Indigo** (law-mca, #4a55b8), **SEBI Olive** (law-sebi, #7a8a10), **RBI and FEMA Plum** (law-rbi-fema, #8e3ea8), **Labour Orange** (law-labour, #d9622b), **State Levies Cerulean** (law-state, #0e8fb8), **Foreign Trade Umber** (law-trade, #9a4e12) and **Other Regulators Grey** (law-other, #8794a3, also the fallback). An element takes its law's hue from a data-law attribute. The hue fills the swatch of a law tag, a law chip and each timeline lane; washes a law tag at 9% over white; washes each timeline lane at 4% at rest and 10% while one of its marks is under the pointer or the keyboard; and draws the cost-of-delay curve, a 2px line over a 10% wash.

### Neutral
- **Report White** (ground, #ffffff): the working page, controls, sheets, leaves and cards, and the report page.
- **Cool Panel Grey** (layer-1, #f5f7fa): the table header band, data-table heads on reading pages, the segmented-control track, grouped-input panels (custom horizon, planner), the empty state, the month grid's weekday header and blank cells, the footer band, hover on rows and secondary buttons, the skeleton's ground, and the stretch of the timeline beyond the chosen horizon.
- **Tag Grey** (layer-2, #ecf0f5): calendar code chips, inline code, the track under each costliest bar, the hover fill of quiet buttons and the pressed secondary button.
- **Ledger Ink** (ink, #0f1f33): text and headings, the text of law tags and law chips, and the cluster counts on amber marks (4.9:1).
- **Slate Ink** (ink-2, #3f4f63): secondary text, labels and column heads (8.4:1): obligation names in tables, notes, inactive options, reading-page chips.
- **Caption Slate** (ink-3, #5f6e80): faint labels (the due strip's terms, detail section heads, the verified line), meta lines, distances, placeholders and axis text (5.2:1 on white, 4.9:1 on Cool Panel Grey).
- **Hairline Rule** (rule, #e2e7ee): every row divider and section hairline, and the border of leaves, cards and tooltips.
- **Control Rule** (rule-2, #ccd4de): borders of buttons, inputs, chips and the segmented track, the ring of the segmented thumb, the rule under a table header band or due strip, and the zero line of the cost-of-delay chart.
- **Hover Rule** (rule-3, #93a0b0): borders on hover, the dashed border of a projected pill, and the pointer line on the cost-of-delay chart.

A few literals live outside the token set and belong to the system rather than to one screen: text selection #d6e2ff under Ledger Ink (the same blue, at 55%, lights the loading shimmer), a thin #c3cbd6 scrollbar on white, the dialog scrim rgba(16, 24, 40, 0.42), weekend day cells at #fbfbfc, and #eaf0ff under the pointer on the cover's white primary. On navy, white at low alpha draws the furniture: 6 to 16% for hairlines and fills, about 30% for button borders, 60% on hover.

### Named Rules
**The One Cobalt Rule.** Cobalt is the only hue that means act or selected on white: primary buttons, links, toggled chips, the selected row, day and range, focus, and Today on the chart. Nothing decorative is cobalt. Two selections are marked differently, both deliberate: on navy, selection is Cover Blue (the current tab's bar, a toggled key figure), and the segmented control shows its current value as a raised white thumb with navy text.

**The State Is the Message Rule.** Red, amber, extension blue and green appear only on an element whose message is that state: status pills, timeline marks, the key-figure dots on the cover that serve as their legend, calendar code chips, the file check and the confirmation of a filing, the extension note, and status cells and figures in the report. Never as a section color, heading color, row stripe or page wash.

**The Quiet Red Rule.** Red means overdue and nothing else. The Overdue key figure turns red (Overdue Red on Navy) only when it is above zero, and so does the report's Overdue figure; with nothing overdue, the only red left on screen is the Overdue figure's legend dot.

**The Law Swatch Rule.** A law hue appears only beside the law's name in ink, as a square swatch with 2px corners, a faint wash, a lane tint or the cost-of-delay curve. It never colors text, never fills a circle and never stands for a state: squares name laws, and circles belong to state and data.

## Typography

**Display Font:** Archivo (variable, self-hosted, weights 100 to 900 and widths 62 to 125%), with ui-sans-serif, system-ui, -apple-system and Segoe UI as fallbacks
**Body Font:** Archivo (the same family)
**Label/Mono Font:** Fragment Mono, for code identifiers only

**Character:** One plain, firm grotesque does every job. Roles are told apart by weight (regular prose, semibold controls, bold headings, a heavier 750 figure voice) and, for the few largest lines, by opening the width to 108%, which gives cover titles and key figures the presence of a report cover without a second face. It reads like the typeset body of an annual report, numerically exact and unshowy.

### Hierarchy
- **Display** (750, 2.75rem, 1.05, -0.025em, 108% width): the cover title on every page, the Overview's exposure total, the code at the head of the detail panel, the report period and the day numerals of the next-due leaves. Steps to 2rem below 720px (the cover title, the detail code and the leaves). The Overview's range headline sets tabular figures.
- **Display large** (750, 3.5rem, 1.05, -0.025em, 108% width): the obligation code on its entry page's cover, the one size above display; 2.75rem on phones.
- **Key figure** (750, 2rem, 1, -0.02em, 108% width, tabular figures): the state figures on the Overview's cover, the cost of a delay, and the report's key figures. The entry page's cover figures take 1.5rem; on phones the Overview's figures, the total included, take 1.5rem and the entry page's 1.1875rem.
- **Headline** (700, 1.5rem, 1.15, -0.015em): reading-page section heads (navy, with a hairline beneath), the entry page's cost head and the planner's result heads.
- **Title** (700, 1.1875rem, 1.15, -0.015em): block heads such as the chart's "By law", the list head, the calendar's day heading, "Next due dates" and an empty state. The obligation name in the detail takes this size at 550 and 1.35; ledes take it at 400 and 1.5 (the cover lede, the entry summary). Aside list headings step down to 1rem at 700.
- **Body** (400, 1rem, 1.55): running text. Prose caps at 70ch and opens to 1.6; the cover lede caps at 66ch, and the entry summary and the footer note at 62ch.
- **Body small** (400, 0.875rem, 1.55): tables, detail sections, notes, the cover's sub line and the footer.
- **Figure** (750, 1rem in tables and lists, 1.08, -0.02em, tabular figures): obligation codes and counts.
- **Control** (600, 0.875rem, 1): buttons, segmented options (700 when selected), law and filter chips, and footer links; masthead tabs and disclosure summaries take 650.
- **Label** (650, 0.78125rem, 1.35, +0.01em, sentence case): column heads, field labels, section and list labels, meta lines and law tags; status pills take the size at 600.
- **Chart** (400, 11px): lane counts on the timeline and the axes of the cost-of-delay chart; the timeline's tick labels take 500 (650 on major ticks) and its Today label 700 in Cobalt. Counts and rupee ticks use tabular figures.
- **Mono** (Fragment Mono 400, 0.9em): rule ids and code on a Tag Grey chip, nowhere else.

The timeline's lane names take the label size at 650 in Ledger Ink, its cost callout and the numerals inside cluster marks are set to fit the marks, and a count set beside a mark takes the chart step at 650 in Ledger Ink (see the timeline under Components); none of those settings is a step for other surfaces.

### Named Rules
**The Figure Voice Rule.** Codes, counts and figures take the figure voice (750, -0.02em, tabular figures), and the largest of them also open to the 108% width. Dates and amounts in tables take 650 with tabular figures, and every table is tabular by default. Obligation codes are navy unless a state chip recolors them, a filed row fades them or the cover sets them white.

**The Sentence-Case Label Rule.** Labels are 0.78125rem (12.5px) at 650 and +0.01em, in sentence case, in Slate Ink; secondary labels drop to Caption Slate. No uppercase, no wide tracking, no small caps.

**The One Family Rule.** Archivo carries every role, from the 3.5rem entry code to the chart's 11px axis text, at two widths: normal (100%) for text, and 108% for display, display large and key figures. The wordmark's lockup is its own setting (104%). Never reach for the condensed widths, add a second display face, or set numbers in Fragment Mono.

## Layout

The page is one centered column, at most 1440px wide, with a side gutter of clamp(16px, 3vw, 32px). Every page opens with the navy cover directly under the masthead: full bleed, its content held to the same column, with 32px above and below and 24px between its head and its figures. Under the cover the Overview stacks its controls 24px down (the horizon control, the order select, and the search pushed to the right), the law chips 16px below, the full-width chart 24px below that, and then, 32px down, a split of the table (minmax(0, 1fr)) beside a 360px aside, 32px apart. The aside holds short lists (costliest if late, extended or moved, due on a holiday or weekend, closed abroad, from the regulators) and gives way to the obligation detail when a row is selected; the detail then sticks 80px from the top and scrolls on its own. The month calendar sets its month navigation at the right of its cover and uses the same split with a 340px day list. The per-obligation entry page follows its cover with the next-due leaves 32px down and then, 48px below them, splits 1.4fr to 1fr with 48px between: the summary in lede type over a facts list (a 160px label column, hairline rows under a Control Rule) with the cost section 48px below it, and the sources and extensions in ruled lists at the right. Reading pages run their sections 48px apart with prose held to 70ch.

Spacing runs on a 4px base (4, 8, 12, 16, 24, 32, 48, 64). Groups are tight (6px between chips, 8px inside buttons and between the cover's head lines, 8 to 16px between key figures, 12 to 16px between controls) and separation is generous (16 to 24px between the head's rows, 24 to 32px between blocks, 48px between reading-page and entry-page sections, 64px above the footer). Table cells pad 12px, aside items 10px top and bottom, and a section rule sits 12px above its heading. The 64px masthead is sticky and the table's header band sticks directly beneath it; the cover scrolls away with the page.

Responsive behavior is a set of discrete steps rather than fluid type. Below 1100px the split collapses to one column, the aside lists follow the table, the detail leaves the aside to open as a right-hand sheet, and the entry page stacks. Below 900px the masthead wraps and its tabs take their own row, scrolling sideways behind a right-edge fade. Below 720px the cover tightens to 24px of padding, titles and figures step down a size, the key figures sit in two rows on three shared columns sized to their content, labels held to one line and the total sixth, with short labels where the long ones would wrap (two columns without rules on an entry page), the horizon control becomes a four-column grid, the sort select and the search share one row, the sort label kept for assistive technology and a 16px sort icon inset in the select so it never reads as a date field, law chips scroll sideways edge to edge, the table drops its header and the authority column and each row becomes a stacked grid (code and file check, then due and amount, then pills), sheets go full width, the month grid shrinks to 58px cells that show state dots instead of code chips, and the next-due leaves become a sideways strip that snaps leaf by leaf. Below 600px the profile button keeps only its icon. The charts measure their own width: under 640px the timeline draws short lane names, no lane counts, smaller marks, two-digit years and no callout, and the cost-of-delay chart drops its 30-day tick under 480px and shortens from 196px to 156px under 420px.

### Named Rules
**The Ruled Section Rule.** A working section opens with a 2px navy rule across its full width (the chart, each aside list, the detail panel, the calendar's day list, the entry page's cost section and aside lists, the report's key figures), and its rows are divided by 1px Hairline Rules. Boxes are the exception, never the container.

**The Cover Rule.** Every page opens with the navy cover under the masthead: the page title in display type, a lede or sub line in muted white, and at most one row of key figures under a 1px white rule. The cover says what the page is about; the work itself always starts on white below it.

## Elevation & Depth

The system is flat and tonal. Surfaces are told apart by the navy cover, Cool Panel Grey bands and hairlines, and shadow, always a soft blur on an rgba(16, 24, 40) base, appears in small doses: a resting lift that makes controls read as pressable, a slightly deeper lift with a cobalt cast under the one primary, a float for transient layers and the on-screen report page, and a deep throw for dialogs. Nothing on navy casts a shadow; the cover's edges are white hairlines. Print removes all of it.

### Shadow Vocabulary
- **Control lift** (`box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06)`): secondary buttons, inputs, selects, the file check, and the segmented thumb (paired with a 1px Control Rule ring). Quiet and disabled buttons, and every button on navy, drop it.
- **Primary lift** (`box-shadow: 0 1px 2px rgba(16, 24, 40, 0.12), 0 4px 10px -4px rgba(29, 78, 216, 0.5)`): the one cobalt primary in a group, which stands a little forward of its neighbors.
- **Float** (`box-shadow: 0 4px 12px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)`): the timeline tooltip, the cost-of-delay readout, the report sheet on screen, and a source card under the pointer.
- **Sheet** (`box-shadow: 0 18px 40px -12px rgba(16, 24, 40, 0.22)`): the right-hand dialogs (the obligation detail on smaller screens, the entity profile) over the scrim.
- **Masthead edge** (`box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06)`): a faint light hairline where the masthead meets the cover; a rule, not depth. The cover closes on its own 1px white line at 8%.

### Named Rules
**The Paper Flat Rule.** Content does not float. Tables, lists, leaves, panels and the charts lie flat on the page; only controls, tooltips, the on-screen report sheet and dialogs carry shadow, and a card that is wholly a link may rise into the float under the pointer as its hover state.

## Shapes

The form language is soft rectangles, full pills, small squares and circles. Controls take gently squared 6px corners (buttons, inputs, selects, the Overview's key figures, the file check, tooltips and the readout, detail notes, source cards and the detail's small leaves), the segmented track that nests them takes 8px, and bordered panels take 10px (the month grid, grouped-input panels, empty states, subscribe tiles, next-due leaves, the report sheet). Small tags (law tags, calendar code chips, inline code) take 4px, and law swatches and the costliest bars take 2px. Full pills are reserved for status pills, law and filter chips, and the calendar's today number. Squares name laws and circles carry data: the 6px state dot inside each pill and code chip, the 9px dot beside each key figure, every timeline mark and the cost-of-delay marker. Lines are 1px hairlines plus the 2px navy section rule; on navy, rules are 1px white at 14 to 16%. A dashed line marks the provisional or the chosen (the projected pill's border, the empty state's frame, the cost-of-delay drop line), and the timeline's lanes are dotted guides (2px dash, 4px gap). The current tab's bar is 3px tall with rounded top corners.

### Named Rules
**The Round Ends Rule.** Full pills belong to statuses and filter chips. Buttons that do something (file, print, export, subscribe, save) are 6px rectangles, and so are the key figures that filter by state.

## Components

### Buttons
Squared, quiet and firm: the secondary button is the default, and each action group gets at most one primary.
- **Shape:** gently squared (6px), 36px tall, 14px side padding, an 8px gap to a 16px icon, control type.
- **Primary:** Cobalt fill and border with white text and the primary lift ("Mark filed", "Save as filed", "Print", "Save profile"); Deep Cobalt on hover. In markup the primary variant is the secondary button carrying an empty block marker as its last child.
- **Secondary:** white with a Control Rule border, Ledger Ink text and the control lift; hover Cool Panel Grey with a Hover Rule border; pressed Tag Grey.
- **Quiet:** no border, fill or shadow, Slate Ink text; hover Tag Grey fill with Ledger Ink. Used for close, cancel, "Copy link", "Clear date" and "Show all".
- **Disabled:** Cool Panel Grey with a Hairline border and Caption Slate text, no shadow, a not-allowed cursor.
- **On the cover:** the secondary turns translucent (white at 6% with a 30% white border and white text, no shadow; 12% and a 60% border on hover), as in the calendar's month navigation and "See it in the overview". The primary inverts to a white button with navy text ("Subscribe to this obligation"), #eaf0ff on hover.
- **Profile (masthead):** transparent with a 28% white border, white text and a user icon; hover Raised Navy with a 60% border. Below 600px it keeps only its icon.
- **Hover / Press / Focus:** colors change on the fast step (160ms) and a press scales the button to 97% on the instant step (110ms), both on the ease-out; focus is the 2px Cobalt outline at 2px offset on light surfaces and a white outline on navy.

### Chips
- **Law chips:** full pills 32px tall, white with a Control Rule border, Ledger Ink text in control type and the law's 9px square swatch before the name; on hover a Hover Rule border and the swatch grows to 120%; a press scales the chip to 97%; on, a Cobalt border, Cobalt Wash fill and Deep Cobalt text, swatch kept. A Cobalt text button, "Show all laws", fades in once any chip is on. They filter both the Overview and the month calendar.
- **Filter chips:** on the updates and sources pages, the same 32px pill without a swatch, in Slate Ink; pressed, a Cobalt border over Cobalt Wash.
- **Status pills:** a full pill in the label size at 600 with a 6px state dot, a state line border, a state tint fill and state text (Overdue, Due within 7 days, Extended, Filed); a change of state crossfades over 240ms. Projected is white with a dashed Hover Rule border and a hollow dot; past is neutral. In tables and lists an ordinary upcoming item carries no pill at all, so the absence of a pill means nothing needs attention; only the detail's due strip names it, in a neutral pill.
- **Law tags:** 4px tags in label type and Ledger Ink, washed with the law's hue at 9% over white and led by the law's 8px swatch ("Income tax", "GST", "FEMA"), beside each code and in tooltips and meta lines. On the cover a tag turns white at 10% with white text, and its swatch takes a 1.5px white ring so dark hues stay visible on navy.

### Cover band and key figures (signature)
The navy cover that opens every page and continues the masthead. It carries the title in display type, a lede (1.1875rem in muted white, at most 66ch; on an entry page the obligation's name in white at 1.5rem 500, at most 46ch) or a sub line, on an entry page a meta line under the name (the law tag and the authority; nothing ever sits above the title), optional actions, and at most one row of key figures under a 1px white rule at 14% with 16px above them. A slow ambient light, a radial wash of Cover Blue at 6 to 20% across the right of the cover, drifts over 24 seconds on the in-out ease and runs only while the cover is on screen; a 1px white line at 8% closes the band. In print the cover turns white with dark ink and loses its light.
- **Overview figures:** five state figures and the exposure total. Each state figure is a button that filters the table: the count in key-figure type over its state name in 14px 600 muted white, the name led by a 9px state dot (white for upcoming, Filed Green on Navy for filed). At rest it is bare, with 6px corners and 8px by 10px padding; hover white at 7%; a press scales it to 97%; on, Cover Blue at 16% with a 1px inset Cover Blue ring at 70%. The Overdue count turns Overdue Red on Navy only above zero. Extended counts every open item with a notified extension, so it agrees with the Extended pills and the aside's moved list even when the item is also due soon, and pressing it filters to exactly those items. Counts run to new values over 520ms on an exponential ease-out (the total over 700ms). The total ("Rs 19.77 L" over "Fixed cost if every open item runs 30 days late") sits at the right with no dot and leads the row at display size. Below 720px the figures sit in two rows on three shared, content-sized columns at 1.5rem, labels on one line ("Due in 7 days" for due soon), with the total sixth under "Cost at 30 days".
- **Entry figures:** static facts (Next due, Frequency, At 30 days late, Verified) set figure over label at 1.5rem, divided by 1px white rules at 16%, with no dots; two columns without rules on phones.
- **Motion:** the head rises 10px into place over 380ms in 50ms steps, and the figures follow from 120ms in 45ms steps. An island that replaces the static cover does not repeat this and animates only what changes: a new range headline rises 8px in, and a new month slides 20px in from the side it came from. Between pages the cover morphs in place (420ms) while the masthead holds.

### Cards / Containers
- **Ruled sections, not cards.** The default container is the ruled section: a 2px navy rule, a heading, hairline-divided rows.
- **Bordered panels** (10px corners, Hairline border, no shadow) appear only where the content is itself a sheet, a group or a calendar leaf: grouped inputs on Cool Panel Grey (the custom horizon at 12px by 16px padding, the planner form at 24px), the month grid, the subscribe tiles, the next-due leaves, the report sheet, and the empty state, which uses a dashed Control Rule frame on Cool Panel Grey at 32px by 24px with a 30px icon, a title-type heading and its recovery actions.
- **Next-due leaves:** under an entry page's cover, up to six leaves on a six-column grid that spans the measure (three columns below 1100px, 12px apart), white with 12px by 16px padding: the day of the month in display type and navy, then the month, year and weekday in 14px 650 Slate Ink, the period in 14px 550 Ledger Ink, the distance ("In 5 days") in Caption Slate, and any Extended or Projected pill. The first leaf, the next date, is set like the cover: navy fill, white figures, muted white secondary lines. Leaves rise in with a stagger. In the detail panel the same idea is a "Then" row of up to three small leaves (6px corners, Hairline border, 5px by 10px padding, the date in 14px 650 over its period).
- **Source cards:** on an entry page, each source is a card that is wholly a link: 6px corners, a Hairline border, 12px padding, the title in Cobalt at 650 and the host and kind in label size Caption Slate. Under the pointer the border turns Cobalt Line, the title underlines and the card rises 1px into the float shadow. The first five show; the rest sit behind a disclosure.
- **Detail notes:** 6px corners, Cool Panel Grey (the Extension tint for an extension), 14px Slate Ink, 8px by 12px padding.

### Amounts
Every penalty amount is shown in the team's reference currency first, Canadian dollars by default or US dollars, as "CA$22.40" or "US$15.78", with the rupee figure the law fixes beside it in brackets at 85% size in Caption Slate, "(Rs 1,500)". In the obligations table the two stack, the rupee figure beneath in label size; in the Overview's cover the total sets the reference amount in display type with the rupee figure on the line below in white at 650; on an entry page the cover figure carries the rupee figure in its label. Amounts of 10,000 or more may compact ("CA$29.5K"); below 100 they keep cents. The rate is the Bank of Canada's daily rate, recorded in the data and named in the profile sheet. A two-option switch in the masthead (CAD, USD: 30px buttons in label size at 700 inside a 1px white rule at 30%, the chosen one in Cover Blue at 16% with its 70% ring) changes it everywhere at once and is hidden below 600px, where the profile sheet carries the same choice.

### Inputs / Fields
- **Style:** 38px tall, 6px corners, white, a Control Rule border with the control lift, 14px text, 7px by 11px padding, placeholder in Caption Slate. Selects draw a small caret of their own and reserve 34px on the right; search insets a 16px icon 11px from the left, which turns Cobalt while the field has focus; date fields replace the browser's picker glyph with the same 16px calendar icon in Caption Slate.
- **Hover:** a Hover Rule border.
- **Focus:** a Cobalt border and a 3px Cobalt halo at 16%, no outline.
- **Labels:** label type above the field with a 6px gap; inline labels such as "Order by" and "Months ahead" sit to the left. Checkboxes and range sliders take Cobalt as their accent color.

### Navigation
- **Masthead:** a sticky 64px navy bar with the wordmark (the drawn 26px calendar-check mark and "India Compliance Calendar" in 1rem 750 at the lockup's own 104% width) at the left, the tabs, and the profile button at the right; a 1px white hairline at 6% marks where it meets the cover.
- **Tabs:** 14px 650 in Masthead Muted White, white on hover and when current. Under the pointer a 3px white bar at 35% grows out from the middle of the tab's bottom edge (240ms); the current tab carries a 3px Cover Blue bar with rounded top corners, which slides to the new tab when the page changes. Tab focus is a white outline inset 4px.
- **Mobile:** below 900px the tabs move to their own row, scroll sideways and fade out at the right edge to show there is more.
- **Footer:** a Cool Panel Grey band under a hairline holding the "Information only, not legal advice" note in 14px Slate Ink, links in 14px 600 Slate Ink that turn Cobalt on hover, and the build date.

### Sheets
Right-hand dialogs: the obligation detail below 1100px and the entity profile. A sheet is 560px wide (full width below 720px), full height and white, with gutter padding and the sheet shadow over the scrim; its footer of actions sticks to the bottom under a hairline. It slides 32px in from the right over 380ms as the scrim deepens, and leaves faster, in 160ms on the exit ease.

### Obligations table
The working core of every horizon: ruled, tabular and sticky-headed. The header band is Cool Panel Grey with label type in Slate Ink between a hairline above and a Control Rule below, and it sticks under the masthead. Ordered by due date, rows group under a date line ("Thu 15 Oct 2026 - Today - 14 obligations") in 14px 700 Ledger Ink with faint qualifiers at 500. The columns are when (days left, "Today" or "3d late", in Ledger Ink 650 when due soon or overdue and Caption Slate otherwise), the obligation (the navy code in the figure voice beside its law tag, the name in Slate Ink, the period on a faint line), the authority (two lines at most), the cost at 30 days (right-aligned at 650, "+ interest" beneath), the state (pills and owner) and the file check. Rows take Cool Panel Grey on hover and Cobalt Wash when selected, and the code turns Cobalt under the pointer. When the order or filters change, rows glide from their old places (380ms) and new rows rise 8px in, 18ms apart. A filed row fades its code, name and date to Caption Slate.
- **File check:** a 32px square with 6px corners, white with a Control Rule border, the control lift and a check in Caption Slate; hover a Filed Green border and Filed text; a press scales it to 90%; filed, solid Filed Green with a white check. One click marks the item filed today and confirms it: the check draws itself (420ms), a Filed Green ring settles 10px out of the square (700ms), and the row holds a Filed Tint that fades over 1.1s. The detail form records date, acknowledgement and owner.

### Aside lists
Short ruled lists beside the table and on entry pages: a 2px navy rule, a 1rem 700 heading, and hairline-divided items with 10px above and below. On the Overview each item is a button: the code in the figure voice and navy, then a meta line in label size (the law tag and the date). Under the pointer the item's content nudges 4px right and its code or title turns Cobalt. The costliest list adds the amount at 700 on the right and a 3px bar beneath, navy on a Tag Grey track with 2px ends, its length relative to the costliest item; items rise in 40ms apart and their bars grow from the left.

### Swimlane timeline (signature)
The Overview's chart, under its own 2px navy rule, with a plain-language note on how to read it and a size key (under Rs 1,000, Rs 10,000, Rs 1 lakh or more, and a note that numbers count merged due dates). One lane per law: the law's 9px swatch and its name (label size, 650, Ledger Ink) at the left, with its count in chart type on wide screens; a dotted lane guide (2px dash, 4px gap); and the law's hue across the lane, 4% at rest and 10% while a mark in the lane is under the pointer or the keyboard. Month ticks (Monday ticks on short spans) run in chart type, heavier at major starts, and a 1.5px Cobalt Today line is labelled in Cobalt. Each due date is a circle whose radius grows with the log of its fixed 30-day penalty, filled with its state color (navy when ordinary) and ringed 1.5px in white so neighbors stay separate. Marks that would touch merge into one circle sized, like any mark, by its summed cost, so size always reads as cost. Its count prints inside in white (Ledger Ink on the amber fill) when the circle has room (a 7px radius, 9px for two digits) and otherwise sits just beside it in the chart step at 650 in Ledger Ink. Past the chosen horizon the field turns Cool Panel Grey and marks drop to 38% opacity. The costliest mark in the horizon gets a navy callout ("MOOWR +1 - Rs 4 L", 11.5px 700 with a 4px white halo) placed where it never covers a mark. Hovering or arrowing to a mark grows it to 112% and rings it in Ledger Ink, and the tooltip (white, Hairline border, 6px, float shadow: the date range with its law tag, codes in navy, count, state and the rupee cost) fades in and glides from mark to mark; Enter or a click filters the table to that date, drawn as a Cobalt Wash band with a Cobalt Line edge.
- **Entrance:** the Overview's focal moment. The Today line draws itself downward (720ms, after 80ms) and the first marks assemble outward from it, each starting up to 96px toward Today at 40% scale and arriving by its distance (520ms, with up to 260ms of delay), so the chart is in place within 800ms; the callout fades in after it. Marks that appear later pop in where they belong (240ms), and on a new horizon, filter or width every mark, tick and lane glides to its new place (380ms).

### Cost-of-delay chart
The second chart, in the detail panel and on each entry page, for rules whose penalty grows with each day late: one obligation's fixed cost against days late. A "Days late" slider in Cobalt with its value, then the cost at that day in key-figure type and navy, then the plot: three horizontal guides from Rs 0 (Control Rule) to a rounded maximum (Hairline Rule), axis text in chart type and Caption Slate, and ticks at Due, 30, 90, 180 and 365 days. The curve is drawn in the law's hue, a 2px line with round joins over a 10% wash of the same hue. The chosen day is a navy dot with a 2px white ring on a dashed navy drop line, gliding as the slider moves. Under the pointer a Hover Rule line and a white dot ringed in the law's hue follow the curve, with a readout beside the point (white, Hairline border, 6px, float shadow: the days late over the amount in 14px 700 Ledger Ink); dragging across the plot sets the day. The line draws itself once (900ms) and its wash fades in behind it. The entry page pairs the chart with a ruled table of the same values; a rule whose cost does not grow by the day shows its fixed figure alone.

### Detail panel
In the aside on wide screens, where it slides in 12px from the right (380ms), and in a right-hand sheet below 1100px. It opens under a 2px navy rule with the code in display type and navy, the name in title type at 550 and a meta line (the law tag, the authority and the period as labels), then a due strip between a Control Rule and a hairline that sets Due (the short date, "15 Oct 2026"), When and State side by side in columns sized to their content, so none of them breaks mid-phrase, then the "Then" row of the next three dates. The filing actions follow (Mark filed as the primary, Add to calendar, Copy link as quiet), then the owner field, then hairline-divided sections under faint label headings: the summary, who files, the cost of a delay (the cost-of-delay chart, its slider starting at 30 days or at the days already late), the rule, and the sources with their verified date and confidence. Legal text sits behind Cobalt disclosure summaries, closed by default, each led by a 16px chevron (1.75 stroke) that turns to point down as it opens (240ms); the browser's own marker never shows, and opened content rises in.

### Month calendar
A grid with 10px outer corners and hairline cells 112px tall; the weekday header (label type in Slate Ink) and blank cells are Cool Panel Grey, and weekend cells sit a shade off white with faint numbers. Today is a navy disc; the selected day is Cobalt Wash with a 1.5px inset Cobalt ring, so the two never read alike. Each day lists up to four code chips (4px, Tag Grey, navy in label size with a state dot, tinted by state when the state is not ordinary) and a "+N more" line; holidays are named in Slate Ink, and holidays abroad follow in label size Caption Slate with the country in Ledger Ink at 650 ("Canada Thanksgiving Day"). Under the law chips a "Holidays abroad" row of filter chips (Canada, Ontario, United States) chooses which calendars abroad show, and the day list opens with what is closed abroad that day. On phones, where cells drop their text, a 12px bar under the day number marks a holiday: solid navy for India, an open Caption Slate outline for abroad. A new month slides 28px in from the side it came from (380ms), and its day list rises in item by item.

### Report sheet
The printable board report. On screen it is a white page with 10px corners, a Hairline border and the float shadow; in print it is the bare page. The period sits in navy display type over the entity and dates, rising in again when the period changes; then a key-figures strip of five label-over-figure pairs in key-figure type and navy between a 2px navy rule and a Control Rule (Overdue in its text tone only when nonzero), the figures counting to their values; then a ruled table in which only the status cell takes color, its rows rising in.

### Named Rules
**The Two Charts Rule.** The system has two charts, each answering one question: the swimlane timeline (which law is heaviest when, and which filing costs most if late) and the cost-of-delay curve (what one filing costs for each day it is late). The costliest list's 3px bars compare amounts inside a list and are not a chart. No sparklines, rings, gauges or further charts; other surfaces show the same data as ruled tables, the month grid and lists.

**The One Entrance Rule.** Each surface gets at most one authored moment: on the Overview, the timeline's marks assembling outward from Today while the Today line draws itself, in place within 800ms; wherever the cost-of-delay chart appears, its curve drawing once. Everything else enters by rising 8 to 12px into place (320 to 380ms for content, 240ms for small panels and disclosures) in staggers of 18 to 50ms, or by fading, and every element is readable at its end state if the animation never runs.

**The Continuity Rule.** Motion explains change: rows glide from their old places when the order or filters change, figures count to new values, the segmented thumb slides to the new option, marks and ticks glide to a new horizon, a new month slides in from the side it came from, and between pages the masthead holds while the cover morphs and the tab indicator slides. An island that replaces a static page never repeats the entrance it inherits, and the cover's ambient light runs only while the cover is on screen. Under reduced motion, movement goes: entrances become fades of 200ms, transitions keep only color and opacity, loops stop, counts land at once, rows jump and pages crossfade; the filed confirmation keeps its green tint at full length.

## Do's and Don'ts

### Do:
- **Do** open every page with the navy cover under the masthead, and every working section below it with the 2px navy rule, dividing rows with 1px Hairline Rules (#e2e7ee).
- **Do** keep Cobalt (#1d4ed8) for the primary action, links, toggled chips, selection, focus and Today on white, and Cover Blue (#8fb0ff) for selection on navy, with at most one primary button per action group.
- **Do** name a law with its swatch (a square with 2px corners in the law's hue) beside the law's name in ink.
- **Do** set codes, counts and figures in the figure voice (750, -0.02em, tabular figures), keep codes navy on white, and give only the largest lines the 108% width.
- **Do** show state with a pill, a dot or a mark in the state's color, and use the state's text tone (overdue-text, soon-text, extended-text, filed-text, and overdue-on-navy on the cover) for any state-colored text.
- **Do** leave an ordinary upcoming item navy and pill-less in tables and lists; color is for exceptions.
- **Do** put legal text, penalty bases and change notes behind a disclosure, and show every rule's sources with its verified date.
- **Do** draw icons from the Lucide set at 16px with a 1.75 stroke, round caps and joins, in the current text color; the calendar-check mark is the product's own.
- **Do** theme the browser's own surfaces from the palette: #d6e2ff selection, a thin #c3cbd6 scrollbar, a Cobalt caret, 1px Cobalt Line underlines offset 0.2em, and Cobalt checkboxes and sliders.
- **Do** time motion from the scale: 110ms for a press, 160ms for color and hover, 240ms for a change of state, 380ms for entrances and glides and 720ms for the one focal draw, on the ease-out cubic-bezier(0.16, 1, 0.3, 1); exits run faster on cubic-bezier(0.4, 0, 1, 1), and loops on cubic-bezier(0.65, 0, 0.35, 1).
- **Do** start every animation from a readable end state and give every movement a reduced-motion form, a fade or nothing.

### Don't:
- **Don't** bring back a dark ground or the dark catalog look this system replaced; the navy cover is a band at the top of a light page, never a theme.
- **Don't** build metric tiles. Counts and totals set large belong on the navy cover and in the report's key figures, as figures over labels with no box, icon or trend arrow; on white, a large figure is either a chart's readout (the cost of a delay) or a date (the next-due leaves).
- **Don't** use red for anything but overdue, and don't color a count red at zero.
- **Don't** add a second accent hue, or use a state hue as decoration, a section color, a row stripe or a page wash.
- **Don't** set text in a law hue, fill a circle with one, or let a law hue stand for a state.
- **Don't** make cards the page structure or nest boxes; working content lives in ruled sections and hairline rows, and bordered panels stay limited to the cases under Cards / Containers.
- **Don't** add a third chart, sparklines or progress rings.
- **Don't** uppercase or letter-space labels, and don't set numbers in Fragment Mono; it is for code identifiers only.
- **Don't** use Archivo's condensed widths, go wider than the 108% display width, or add a second display face.
- **Don't** lift content with shadow or raise anything on hover that is not itself clickable; only controls, tooltips, the on-screen report sheet, dialogs and a link card under the pointer carry shadow.
- **Don't** add gradient fills, gradient text, glass or blur; the only gradients in the system are functional (the select caret, the loading shimmer, the masthead's scroll fade) and the cover's ambient light.
- **Don't** celebrate a filing with confetti, illustrations or emoji; the check draws itself, a ring settles out of it and the row holds a brief green tint, then the item goes quiet.
- **Don't** set white text on the amber due-soon solid; amber carries text as soon-text on its tint, and cluster counts on amber marks are Ledger Ink.
- **Don't** replay an entrance when an island replaces a static page, keep a decorative loop running off screen, or use bounce, elastic or overshooting curves.
