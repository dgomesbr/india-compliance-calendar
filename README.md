# India Compliance Calendar

A single pane of glass for Indian statutory deadlines, built for an in-house
compliance team: what is due, what is at risk, and what each filing costs if it
is late. Every date cites the act, rule, notification or circular it comes from.

**Live site:** https://dgomesbr.github.io/india-compliance-calendar/

It is our own take on the [corplawupdates.in calendar](https://www.corplawupdates.in/calendar):
the same idea, rebuilt from primary government sources as structured, recurring
rules, with no content copied from any commercial site.

## What it does

- **Risk first.** The overview opens on the chosen horizon with overdue and
  due-this-week items at the top, the counts by state set large on the cover
  (each one filters the table), and the costliest-if-late list beside the table.
- **Any horizon.** 1 week, 2 weeks, 1 month, 1 quarter, to year end, to FY end,
  or a custom window up to 24 months ahead.
- **Order by fine.** Sort by due date, by penalty exposure (the fixed cost of a
  30-day delay: late fees and flat penalties, with interest shown separately),
  or by law.
- **The timeline.** One lane per law across the horizon; each due date is a
  mark sized by its penalty exposure and coloured by its state, so it is clear
  which law is heavy when. Select a mark to filter the table. Keyboard and
  screen-reader accessible.
- **Cost of a delay.** For filings whose late fee grows by the day, the detail
  panel and each entry page chart the fixed cost against days late, with a
  slider, a hover readout and the same values as a table.
- **Our obligations only.** An entity profile (type, GST mode, TDS, employees,
  audit, transfer pricing, foreign investment, import/export, states) filters
  everything, including state professional tax and labour welfare fund.
- **Mark filed, with owner and acknowledgement.** Stored in the browser; teams
  share records by exporting and importing JSON.
- **Event planner.** Enter an AGM, allotment, director change, charge or foreign
  investment date and get every downstream deadline (AOC-4, MGT-7, ADT-1, PAS-3,
  FC-GPR, DIR-12, CHG-1 ...), then add them to the calendar.
- **Board report.** A printable status for any quarter, FY or custom period:
  filed, overdue, pending, not recorded, with CSV export.
- **Regulator feed.** A daily GitHub Actions job collects official RSS feeds into
  an updates page and an RSS feed of its own.
- **Subscribe and export.** ICS feeds for everything, per law and per audience,
  with reminders 7 days and 1 day before; single-event downloads; CSV.
- **Built for agents too.** A static JSON API, `llms.txt`, and an MCP server so
  AI agents can ask what is due and what it costs.

## Data

Rules live in [`data/rules`](data/rules), one YAML file per law area: income tax,
GST, MCA and LLP, SEBI LODR, RBI and FEMA, labour (EPF, ESI, labour codes), state
levies (professional tax, labour welfare fund), foreign trade and other
regulators. Each rule has a schedule, applicability, the law, a structured
penalty model, sources, a verified date and a confidence level. Notified
extensions are recorded per period with their circular. Dates past the verified
window are shown as projected. See [docs/DATA_MODEL.md](docs/DATA_MODEL.md).

Holidays (central gazetted and restricted, exchange and bank holidays where
published) are in [`data/holidays`](data/holidays). The survey of open datasets
and official sources behind the calendar is in
[docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) and on the site's Sources page.

This is information, not legal advice. Laws, forms and portals change; confirm
on the official portal before you file. Found a wrong date?
[Open a correction](https://github.com/dgomesbr/india-compliance-calendar/issues/new?labels=correction)
with the official source.

## API, feeds and MCP

| What | Where |
|---|---|
| Rules, holidays, events in one file | `/api/v1/bundle.json` |
| Dated occurrences, current FY to 25 months ahead | `/api/v1/occurrences.json` |
| Rules, holidays, events, updates, sources, meta | `/api/v1/{rules,holidays,events,updates,sources,meta}.json` |
| Calendar feeds | `/ics/all.ics`, `/ics/<law>.ics`, `/ics/for-<audience>.ics`, `/ics/rules/<id>.ics` |
| Regulator updates | `/updates.xml` |
| Agent orientation | `/llms.txt` |

MCP server (Node 22.18 or later, no dependencies, reads the published data):

```sh
git clone https://github.com/dgomesbr/india-compliance-calendar
claude mcp add india-compliance-calendar -- node ./india-compliance-calendar/mcp/server.ts
```

Tools: `upcoming_obligations`, `get_obligation`, `search_obligations`,
`event_deadlines`, `check_date`, `list_holidays`, `regulatory_updates`. Set
`ICC_DATA_URL` to a fork's `bundle.json` or a local file. See
[mcp/README.md](mcp/README.md).

## Development

```sh
npm ci
npm run dev        # http://localhost:4321/india-compliance-calendar/
npm test           # engine, data validation, feed parser, MCP server
npm run validate   # data checks only
npm run feeds      # collect regulator feeds into data/updates.json
npm run build      # static site in dist/
```

Stack: Astro 7 with Preact islands, TypeScript, YAML data, no backend. The date
engine in `src/lib` is plain erasable TypeScript shared by the build, the browser
and the MCP server.

## Deployment

`.github/workflows/deploy.yml` validates, tests, collects feeds and deploys to
GitHub Pages on every push to `main` and daily at 06:00 IST, so date windows and
feeds stay current. `check-sources.yml` reports dead source links weekly. Forks
can publish elsewhere with `ICC_SITE` and `ICC_BASE`.

## Design

Designed with the Impeccable process: product context in [PRODUCT.md](PRODUCT.md),
the visual system in [DESIGN.md](DESIGN.md). The world is a listed company's
annual report: a navy masthead over white working pages, ruled tables with
tabular figures, one cobalt for actions, state tints only where state is the
message, and two charts: the timeline that tells the year, and the cost of a
delay for a single filing. Each law has its own colour, shown only as a swatch
beside its name. Motion explains change (rows glide, figures count, the timeline
assembles from Today) and gives way to plain fades under reduced motion.

## Licence

Code: MIT. Compiled data in `data/`: CC BY 4.0. Government source material keeps
its own terms. Fonts: Archivo and Fragment Mono, SIL Open Font License.
