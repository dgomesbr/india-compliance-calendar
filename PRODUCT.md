# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro static site with small interactive islands, data kept as YAML in the
repo, built and deployed to GitHub Pages by GitHub Actions (user's choice).

## Users

An in-house compliance team: finance, legal and company-secretarial staff at
one Indian company or group. They need their own obligations without client
noise, and they check what is coming up and what is at risk on a regular
cadence (daily or weekly), then file, pay or escalate.

## Product Purpose

India Compliance Calendar is our own version of the corplawupdates.in
compliance calendar: a single pane of glass for Indian statutory deadlines
(income tax, GST, MCA/Companies Act and LLP, SEBI LODR, RBI/FEMA, EPF/ESIC and
labour codes, state professional tax and labour welfare fund, and other
regulators). Impending risks and due dates are shown first. Success means the
team never misses a filing because the deadline, its source and its cost of
delay were in front of them early enough.

## Positioning

- Every due date is source-cited: it links to the act, rule, notification or
  circular it comes from and carries a last-verified date.
- Obligations are structured, recurring rules rather than free-text rows, so
  the calendar can project any horizon up to 24 months and stay correct when an
  extension is notified.
- Results can be ordered by penalty exposure (fine amount, late fee, interest)
  as well as by due date, so the costliest risks surface first.
- The content is machine-readable for other AI agents through an MCP server and
  static JSON, alongside calendar subscriptions and CSV export for people.

## Operating Context

- Horizon-based review: next week, two weeks, month, quarter, to year end, or a
  custom window up to 24 months ahead (user requirement).
- Profile filters: entity type, state and law, saved in the browser.
- Calendar subscriptions (ICS / webcal for Google Calendar and Outlook) and CSV
  export of exactly what is filtered.
- A live regulator feed collected daily by GitHub Actions from official
  sources (SEBI, RBI, CBIC, MCA and others).
- Event-driven obligations (board and AGM dates, allotments, director changes)
  are part of the job, not only fixed calendar dates.
- Used on desktop and phone equally: reviews at the desk, quick checks and
  reminders on the phone.
- Confirmed in-house workflows for the first version: mark an occurrence as
  filed with date, acknowledgement number and owner (stored in the browser,
  shared by JSON export/import); an event trigger planner (enter an AGM,
  allotment, director change or charge date to get every downstream deadline);
  and a printable board compliance report for a period.

## Capabilities and Constraints

- Static hosting only (GitHub Pages): no server, no accounts, no database.
  Anything personal (profile, filters) stays in the browser.
- Data is compiled from primary government sources; content from
  corplawupdates.in or other commercial sites is never copied.
- Information only, not legal advice; the team cross-checks the official portal
  before filing.
- Prose in repo files and data is ASCII only (no em-dashes or smart quotes;
  "Rs" for rupees).
- One entity profile in the first version; multi-entity (group company)
  profiles were offered and deferred.
- The team finds these wrong: alarm red everywhere, walls of legal text, and
  anything playful or gamified.

## Brand Commitments

- Name: India Compliance Calendar.
- Styled with the Impeccable design process (user's instruction).
- Visual register: corporate and clean (user's standing preference, stated
  15 Oct 2026 after trying a dark catalog look). The chosen world is the
  blue-chip annual report.

## Evidence on Hand

No testimonials, customers, usage numbers or endorsements exist. None may be
invented. The obligation data, sources and holiday lists in `data/` are the
real content.

## Product Principles

1. Risk first: what is due soonest and costs most when missed leads every view.
2. Show the source: no date without a citation and a verified-on stamp.
3. Our obligations only: applicability filtering beats completeness.
4. Open by default: people subscribe and export, agents query the same data.
5. Honest about uncertainty: projected, extended or unconfirmed dates say so.
