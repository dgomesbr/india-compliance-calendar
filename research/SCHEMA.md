# Research hand-off schema (rules)

Every research file is a JSON array of **rule** objects. A rule is a recurring
(or event-driven) obligation, never a single dated row. The site expands rules
into dated occurrences for any window up to 24 months ahead, so prefer the
recurring schedule kinds and use `fixed` only for true one-offs.

Write prose in your own words (never copy text from commercial sites), ASCII
only: straight quotes, " - " instead of em-dashes, "Rs" instead of the rupee
sign, "..." instead of the ellipsis character.

```jsonc
{
  "id": "gst-gstr3b-monthly",        // required. kebab-case, unique, stable. Prefix with category.
  "title": "GSTR-3B (monthly filers)",// required. <= 60 chars.
  "form": "GSTR-3B",                  // optional. Official form / return / challan name(s).
  "category": "gst",                  // required. One of:
                                      //   income-tax | gst | mca | sebi | rbi-fema | labour | state | trade | other
  "authority": "CBIC / GSTN",         // required. Who administers it.
  "summary": "...",                   // required. 1-2 sentences: what is filed or paid.
  "applicability": "...",             // required. Who must comply: entity types, thresholds.
  "audience": ["gst"],                // required, 1+ of:
                                      //   company, listed, llp, firm, individual, trust, employer,
                                      //   gst, tds, foreign, audit, importer-exporter
  "frequency": "monthly",             // required: monthly | quarterly | half-yearly | annual |
                                      //   every-n-years | event | one-time
  "schedule": { },                    // required unless frequency is event / one-time. See below.
  "trigger": "...",                   // required for event / one-time, e.g. "Within 30 days of allotment".
  "law": "Section 39(1), CGST Act 2017; Rule 61, CGST Rules 2017", // required.
  "penalty": "...",                   // strongly preferred. Late fee / interest / penalty with section.
  "states": ["MH"],                   // optional. ISO 3166-2:IN codes without "IN-", for state rules only.
  "effective": { "from": "2026-04-01", "to": null }, // optional. Applies to periods STARTING in this
                                      //   window (use it to split old-Act vs new-Act forms).
  "overrides": [ ],                   // optional. Officially notified extensions. See below.
  "sources": [                        // required, 1+. Primary government sources first.
    { "title": "CBIC - Notification 19/2021-CT", "url": "https://...",
      "kind": "act | rules | notification | circular | portal | faq | secondary" }
  ],
  "verified": "2026-10-14",           // date you checked it.
  "confidence": "high",               // high   = confirmed on a primary government source
                                      // medium = statute clear, confirmed only by reputable secondary source
                                      // low    = could not confirm; explain in notes
  "notes": "..."                      // optional. Caveats, recent changes, transition rules.
}
```

## Schedule kinds

All periodic kinds compute the due date relative to the **last month of the
period**: due = `day` of (period's last month + `monthOffset`). `day` may be
`"last"`; days beyond the month length clamp to the last day. Alternatively
give `daysAfter` (calendar days after the period end date).

| kind | periods | example |
|---|---|---|
| `monthly` | each calendar month | GSTR-3B: `{"kind":"monthly","day":20,"monthOffset":1}` |
| `quarterly` | `basis:"fy"` (default) Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar; `basis:"calendar"` Q1 Jan-Mar ... | TDS statement: `{"kind":"quarterly","day":31,"monthOffset":1,"except":{"Q4":{"day":31,"monthOffset":2}}}` |
| `half-yearly` | `basis:"fy"` H1 Apr-Sep, H2 Oct-Mar; `basis:"calendar"` H1 Jan-Jun, H2 Jul-Dec | MSME-1: `{"kind":"half-yearly","day":"last","monthOffset":1}` |
| `annual` | `basis:"fy"` FY Apr-Mar; `basis:"calendar"` Jan-Dec | GSTR-9 (FY ends Mar, due 31 Dec): `{"kind":"annual","day":31,"monthOffset":9}` |
| `every-n-years` | annual periods, one in every `everyYears`, counted from `anchor` (e.g. `"FY2025-26"`) | `{"kind":"every-n-years","everyYears":3,"anchor":"FY2027-28","day":30,"monthOffset":3}` |
| `fixed` | explicit list, only for true one-offs | `{"kind":"fixed","dates":[{"due":"2026-06-15","period":"..."}]}` |

Extra keys for periodic kinds:

- `except`: per-period overrides of `day` / `monthOffset` / `daysAfter`. Keys are
  the month number as a string (`"3"` = March) for monthly, `"Q1".."Q4"` for
  quarterly, `"H1"`/`"H2"` for half-yearly. Example: TDS deposit for March is
  due 30 April, `{"kind":"monthly","day":7,"monthOffset":1,"except":{"3":{"day":30,"monthOffset":1}}}`.
- `skip`: periods with no occurrence, same key format. Example: PMT-06 only in
  the first two months of a quarter, `"skip":["6","9","12","3"]`.
- `workingDaysAfter`: N working days after period end (Mon-Fri, excluding
  central gazetted holidays). Use only when the law says "working days".

Advance tax (15 Jun, 15 Sep, 15 Dec, 15 Mar) is
`{"kind":"quarterly","day":15,"monthOffset":0}`.

## Overrides (extensions)

Only for extensions or changes officially notified for a specific period:

```json
{ "period": "FY2025-26", "due": "2026-10-31", "originalDue": "2026-09-30",
  "reason": "Extended by CBDT Circular No. X/2026 dated DD-MM-2026",
  "source": { "title": "...", "url": "https://..." } }
```

Period keys: monthly `"2026-08"` (the period month), quarterly `"FY2026-27-Q1"`,
half-yearly `"FY2026-27-H1"` (or `"CY2026-H1"` for calendar basis), annual
`"FY2025-26"` (or `"CY2026"`).

## Window

The site needs correct rules for due dates from 2026-04-01 through 2028-10-31.
Today is 2026-10-14. Laws changed a lot in 2025-2026 (for example the
Income-tax Act 2025 took effect on 2026-04-01 and the four Labour Codes took
effect on 2025-11-21), so verify current law on the web; do not rely on memory.
