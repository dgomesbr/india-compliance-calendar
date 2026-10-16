# Open datasets and data sources

This is the survey behind India Compliance Calendar: 184 official sources, open
datasets, APIs, open-source projects and reference sites for Indian statutory
due dates, holidays and regulatory updates. Every URL was tested on 2026-10-14
from a network outside India (comparable to a GitHub Actions runner); a source
marked blocked may still work from an Indian network. The machine-readable
version is `data/sources.yaml`, served at `/api/v1/sources.json` and rendered on
the site's Sources page.

What the calendar uses today:

- Regulator feed (daily): SEBI RSS, RBI notifications and press releases RSS,
  Income Tax e-filing RSS, GST portal news JSON, BSE notices and NSE circulars
  (filtered to listing compliance). PIB RSS and the Labour ministry's WordPress
  API refuse clients that identify themselves, so they are not collected.
- Holidays: DoPT office memoranda (central gazetted and restricted), the National
  Portal calendar as a cross-check, the RBI holiday matrix (bank holidays by
  state), NSE and BSE holiday lists.
- Due dates: every rule cites its own primary sources; income-tax occurrences were
  cross-checked against the official e-filing tax calendar, GST rules against the
  CBIC notification register.

---

# India Compliance Calendar - open data sources survey

Surveyed 2026-10-14. This catalogue lists 184 distinct sources that could feed the site's due dates, holiday layers and "latest regulatory updates" feed, or that we checked and ruled out. The machine-readable version is `data-sources.json` (same ids, one object per source).

Every URL was tested from a machine in Toronto, Canada (a residential ISP address; GitHub-hosted runners are also outside India, on Azure datacenter addresses that some sites treat more strictly, so treat every "works from here" as "probably works from Actions" and re-check in the first workflow run) with curl, a desktop Chrome User-Agent, redirects followed and a 20 second timeout. For each URL we recorded the HTTP status, content type, size and whether the body was real content or a block, challenge or JavaScript-only shell; RSS and Atom feeds were parsed for item count and newest item date. TLS chains were also checked the way an Ubuntu runner would (OpenSSL with the Mozilla CA bundle and no intermediate fetching), because Windows curl quietly repairs incomplete chains that would break a Linux job. Downloads were kept in a scratch folder and nothing downloaded was executed.

Counts by category: due-dates 5, regulatory-feed 33, holidays 22, legal-text 26, entity-data 13, statistics 12, api 4, open-source 24, reference-site 45 (priorities: P0 27, P1 44, P2 113). Priority means order of adoption: P0 should be wired in for launch, P1 soon after, P2 is optional, reference-only or ruled out; for state PT/LWF portals P0 marks the states whose rules matter most for manual review even when the site is unreachable.

## Recommended ingestion plan

### The short version

Two kinds of official data are genuinely machine-readable and reachable from outside India: the income-tax e-Filing tax calendar and the GST portal's own JSON, and a good set of holiday data (the National Portal of India's holiday CMS, RBI's holiday matrix and NSE's holiday API). Everything else the site needs about due dates has to come from rules we maintain, so the scheduled jobs exist mainly to notice when the government changes something. Several important regulators (MCA, CBDT's incometaxindia.gov.in, EPFO, ESIC, DoPT) are blocked from outside India, which is why the update feed leans on sources that republish their decisions: PIB, the Gazette (through the Internet Archive mirror) and the Ministry of Labour CMS.

### 1. Scheduled regulatory-updates job (GitHub Actions)

One workflow on a 3-hour cron should poll the sources below, normalise each item to `{source, id, date, title, url, regulator, tags}`, dedupe on a stable key (link, PRID, notification number or gazette id), and write the merged feed as a static JSON file for the site. A keyword pass (extend, extension, due date, last date, notification, circular, amendment) decides whether an item also opens a GitHub issue for a human to check against the rule files; rules should never be edited automatically. Each fetch should keep a snapshot of the raw payload so diffs and provenance survive.

| Source (id) | Endpoint and parsing | Cadence |
|---|---|---|
| e-Filing RSS (`it-efiling-rss`) | `https://www.incometax.gov.in/iec/foportal/rss.xml`, RSS 2.0 | 3 h |
| GST portal news (`gst-portal-news`) | `https://www.gst.gov.in/fomessage/newsupdates`, JSON, decode with cp1252 fallback | 3 h |
| CBIC tax information API (`cbic-taxinfo-api`) | anonymous token from `POST /api/authenticate-token`, then `fetchUpdatesByTaxId/1000001` and `1000002` and the Central Tax list; ship the intermediate CA because the chain is incomplete | daily |
| Ministry of Labour CMS (`labour-gov-cms-api`) | WordPress REST `documents` filtered by `documents_category` (gazette notifications, press releases) plus `whats_new` | daily |
| SEBI RSS (`sebi-rss`) | `https://www.sebi.gov.in/sebirss.xml`, classify by link path | 3 h |
| RBI notifications and press releases (`rbi-notifications-rss`, `rbi-press-releases-rss`) | RSS, only 10 items each, so never poll less than daily | 3 h |
| PIB English RSS (`pib-rss`) plus AllRelease page (`pib-all-releases`) | RSS for discovery (no dates in items, dedupe on PRID), AllRelease once a day for ministry and date; use the exact query strings in the catalogue or PIB redirects to the Hindi feed | 1-3 h / daily |
| Gazette of India mirror (`archive-org-gazette-of-india`) | Internet Archive advancedsearch JSON sorted by date, then `/metadata/<id>` for ministry and department | daily |
| NSE circulars (`nse-circulars-api`), BSE notices (`bse-rss-feeds`) | JSON and RSS, filter listing and compliance categories | daily |
| DGFT notices (`dgft-notices`) | scrape three server-rendered listings | daily |
| Sansad bills (`sansad-bills-api`) | JSON sorted by introduction date, filter ministries | weekly, daily in session |
| Peer tip-offs (`corplawupdates-feed`) | headlines only, as a prompt to verify on a primary source; never copy text and respect its no-scraping terms | daily |

Direct eGazette scraping (`egazette`) is a reasonable second path for the Gazette once the CA bundle is in place, but the archive.org mirror is simpler and was current to within a day.

### 2. Sources that feed due dates

Implemented: the source refresher (`scripts/refresh-sources.ts`, run every other day by `refresh-sources.yml`) reads the e-Filing tax calendar for the current financial year and the GST portal's current-period dates, compares them with what the rules produce, and records any official date with no matching obligation in `data/source-status.json`, which the Sources page shows. It reports and never edits a rule. Its first run found two income-tax dates to review: 14 April 2026 (Form 16B, 16C, 16D and 16E) and 29 June 2026 (Form 3CEK and Form 49D).

Income tax is the one area with an authoritative calendar we can read: a weekly `POST` to the e-Filing `taxCalendarServiceImpl` service (`it-efiling-tax-calendar-api`) returns the whole current financial year (353 items for FY 2026-27, each tagged with the 1961 or 2025 Act), and the job should diff it against our expanded income-tax rules and raise an issue on any difference. FY 2027-28 is not published yet, so the rules remain the source for later periods. GST has a smaller signal: `gst-portal-impdts` shows the current period's dates for the main returns, and the CBIC Central Tax notification list (`cbic-taxinfo-api`) is where extension notifications such as 01/2026-Central Tax appear, so both feed the `overrides` mechanism rather than the base rules.

For MCA and LLP, SEBI LODR, RBI/FEMA, EPF, ESIC, the Labour Codes and FSSAI or EPR filings there is no machine-readable official calendar reachable from outside India, so these stay rule-driven, with the update feed above as the change detector. State professional tax and labour welfare fund are the weakest area: none of the 37 state portals surveyed publishes rates or due dates in a machine-readable form, about half are unreachable from outside India (they answered a Mumbai test node but timed out from Toronto, Los Angeles and Nuremberg), and several have broken TLS. The twelve that work from abroad with valid TLS (Karnataka, Tamil Nadu via Greater Chennai Corporation, Gujarat via Surat Municipal Corporation, Telangana, Odisha, Assam, Mizoram, Manipur and Nagaland PT pages, and the Maharashtra, Kerala and Goa LWF pages) are worth a weekly job that hashes the relevant page or PDF and opens an issue when it changes, which is how mid-year changes surface - for example Karnataka's PT (Amendment) Act 2026 and its Removal of Difficulties Order of 2 May 2026 extending the FY 2026-27 payment by enrolled persons to before 5 May 2026. Madhya Pradesh and Puducherry work too once the intermediate CA is supplied. Everything else, including Maharashtra and West Bengal PT, is a manual annual review against state gazettes. Two open-source rule sets are worth seeding from and then verifying line by line: `gh-parinshahaibuilder-indian-compliance-calendar` (MIT, about 60 SEBI, MCA, LLP and tax rules) and `gh-crmleaf-payroll-core` (MIT, PT slabs for 18 states, compiled for FY 2025-26). Frappe's `gh-frappe-india-payroll` has the most complete PT and LWF tables but is GPL-3.0, so use it to check our numbers, not as a data source.

### 3. Sources that feed holidays

Implemented monthly (`scripts/update-holidays.ts`, `update-holidays.yml`, 06:00 IST on the 1st): RBI's holiday matrix for the seventeen state bank lists (one form post per regional office, a second apart, next year as soon as RBI's year list carries it), the National Portal of India's holiday CMS for the central gazetted and restricted lists, and NSE's holiday API for trading and settlement days; abroad, OPM's iCalendar feed, the Labour Program's data file and Payments Canada's closure table, which turns a drafted Canadian year into the published one. Dates are applied, names we curated stay, a list is never cut by a short response (under 60 percent of our entries), and an entry carrying a note - a date someone set from a later order - is never moved or removed by a source; it is reported for review. Changes go to `data/holiday-updates.json` and the Updates page. From outside India the National Portal and NSE refuse some networks; the job reports that and leaves those lists as they are.

For the 15-month look back, `data/holidays/2025.yaml` carries the past year as published: RBI's 2025 matrix for the seventeen state bank lists (read on 16-10-2026; the names are RBI's labels for each date, which can name other states' festivals) and DoPT's 2025 OM for the central gazetted and restricted lists (read from the Internet Archive copy of the official PDF, since the DoPT sites did not answer, and checked against the National Portal calendar). Past years are not updated monthly. The extensions notified for due dates from July 2025 to April 2026 were researched the same way (`research/past-extensions.json`) and recorded on their rules; where a circular could not be read, the confirmed earlier date is shown and the reason names the unconfirmed one.

Reference exchange rates come from the Bank of Canada's Valet API (`FXINRCAD` and `FXUSDCAD`, daily, free to reuse with attribution), fetched by `scripts/fetch-fx.ts` into `data/fx.json` on every build and every refresher run. They only drive the CAD and USD amounts shown beside the rupee figures.

Holidays abroad (implemented in `data/holidays/abroad-YYYY.yaml` and `src/lib/abroad.ts`): Canada federal statutory holidays from the Labour Program's dated list of Canada Labour Code s. 166 general holidays; Ontario public holidays under the Employment Standards Act, 2000; Ontario bank holidays as Payments Canada's Lynx and ACSS closure schedule (the ten federal statutory holidays, a weekend holiday closing the next business day; Family Day, Easter Monday and the Civic Holiday are processing days); United States federal holidays from OPM under 5 U.S.C. 6103; and Federal Reserve holidays from the Board's K.8 table (open the Friday before a Saturday holiday, closed the Monday after a Sunday one). Every other day the refresher checks each list against its statutory rule and against OPM's iCalendar feed, Federal Register closure orders, the Labour Program's data file, Payments Canada's closure table and canada-holidays.ca (MIT) for Ontario, and drafts a coming year from the rule (confidence medium) until its authority publishes it. Nager.Date is not used: its terms bar republishing, its v3 API ends on 2027-01-31, and it does not model statutory or bank calendars.

Central government holidays should come from the National Portal of India's CMS (`indiagov-central-holidays-api`), which republishes the DoPT list as JSON with Gazetted and Restricted flags and already carries 2027; it is an undocumented internal route, so the job should pin the response shape in a test, commit the last good snapshot and have someone confirm the dates against the DoPT Office Memorandum once a year. State and UT holidays come from the same CMS (`indiagov-state-holidays-api`, 1,541 entries for 2026 across 36 states and UTs, 2027 not loaded yet), paged with retries because roughly a third of page requests returned HTTP 504; the linked state GAD notifications (`state-gad-holiday-notifications`) are the check. Bank holidays per state come from RBI's holiday matrix (`rbi-holiday-matrix`), which needs one ASP.NET form post per regional office and year. Exchange holidays come from NSE's holiday API (`nse-holiday-api`), which answered without cookies even though NSE's HTML pages are blocked. The MIT-licensed `gh-vacanza-holidays` library is the fallback and the way to fill years the government has not published yet (marked provisional), and Google's public ICS (`google-india-holidays-ics`) is useful only as a diff signal. Nager.Date and OpenHolidays do not cover India, and Calendarific, Abstract, HolidayAPI and API Ninjas all need keys and come with commercial terms, so none of them is recommended.

### 4. Reference-only sources

Legal text for citations comes from India Code (`indiacode`, now DSpace 9 at indiacode.gov.in), SEBI's regulation listings, RBI master directions, the Union Budget documents and, when reachable, incometaxindia.gov.in and mca.gov.in; these are linked from rule records rather than polled. The professional and commercial sites (ICSI, ICAI, ClearTax, Taxmann, TaxGuru, CAclubindia, CorpLawUpdates, timeanddate, Office Holidays) are human cross-checks only - their calendars and text must not be copied. Open government data adds little to a calendar: data.gov.in returned HTTP 503 from here and api.data.gov.in accepted no connection at all (the open-data survey confirmed through a Mumbai test node that the published sample key works from inside India), and the relevant datasets it found - MCA company master, Udyam counts, a few GST, direct-tax and EPFO tables - are statistics, mostly stale. Entity data (GLEIF's open LEI API with 402,547 Indian records, the NSE listed-company CSV) only matters if the site later adds per-entity views, and the official lookups (MCA master data, GSTIN search, Udyam verification, PAN) are captcha-gated or restricted. For case law, the CC-BY-4.0 Supreme Court and High Court judgment buckets on the AWS Open Data registry are the only bulk open option; the court and tribunal sites themselves are captcha-gated, apart from open NCLT and NCLAT cause lists and the ITAT and NCLT holiday notices.

### 5. Blocked or broken from outside India

| Source | What we saw from Toronto | What to do instead |
|---|---|---|
| incometaxindia.gov.in (CBDT notifications, circulars, Acts, direct-tax data) | Akamai "Access Denied" 403 on every path; multi-location checks saw some US, Canadian and Singapore servers let through while Germany and a Mumbai datacenter were refused (IP reputation, not country) | e-Filing RSS and tax calendar API; cite by hand; test once from the real runner |
| mca.gov.in (all MCA21 pages) | Akamai 403 on every path; efiling.mca.gov.in does not resolve | PIB (Corporate Affairs), Gazette mirror, peer tip-offs |
| epfindia.gov.in / epfo.gov.in | CloudFront 403 "Request blocked" (Toronto edge) | labour.gov.in CMS API, PIB (Labour) |
| esic.gov.in, shramsuvidha.gov.in, dopt.gov.in, doptcirculars.nic.in, finmin.gov.in, einvoice1.gst.gov.in, ewaybillgst.gov.in, foscos.fssai.gov.in | TCP connect timeouts on repeated attempts | National Portal holiday API for DoPT data; GST portal news for e-invoice and e-way bill advisories |
| firms.rbi.org.in | TLS connection reset | deep link only |
| api.bseindia.com, mcxindia.com, www.nseindia.com HTML | Akamai 403 (NSE JSON APIs and BSE RSS still work) | NSE APIs, BSE RSS |
| egazette.gov.in, taxinformation.cbic.gov.in, www.cbic.gov.in, www.icegate.gov.in | reachable, but the server omits its intermediate certificate, so OpenSSL on Ubuntu fails verification | commit the intermediate CA and pass it explicitly; never disable verification |
| www.indiacode.gov.in | TLS hostname mismatch (indiacode.nic.in now redirects to the apex domain) | use https://indiacode.gov.in |
| PIB RSS as documented | redirects to the Hindi feed unless the query string is exactly `ModId=6&Lang=1&Regid=3&reg=3` | use that exact URL |
| timeanddate.com | Cloudflare challenge | not needed |
| www.data.gov.in and api.data.gov.in | portal 503 (also refuses datacenter IPs inside India); API host accepts no TCP connection from outside India | not needed for the calendar; use only from an Indian network |
| State PT and LWF portals (MH and WB PT, AP, JH, TR, PB, SK, ML PT; KA, TN, AP, HR, PB, DL, WB, OD, CH, GJ LWF) | connect timeouts outside India (MahaGST also refused a Mumbai datacenter node, and the Gujarat LWF board did not answer anywhere); Kerala PT certificate expired in 2024; WB PT, Sikkim and Chandigarh fail TLS even from India; Telangana labour returns an F5 403 everywhere; Bihar commercial tax fails DNS | manual annual review; hash-watch the twelve that work |
| itat.gov.in, mptax.mp.gov.in, lad.py.gov.in | incomplete certificate chains | bundle intermediates if used |
| api.mospi.gov.in (eSankhyiki) | needs legacy TLS renegotiation that OpenSSL 3 refuses | not needed |
| sci.gov.in, indiankanoon.org website | IP-reputation blocks or challenges for some regions (the Indian Kanoon API itself works) | AWS open judgment buckets |

The Akamai denials on incometaxindia.gov.in and mca.gov.in covered every path we tried, so they are not about a missing header; the multi-location checks suggest MCA (with api.data.gov.in and EPFO) blocks everything outside India, while incometaxindia.gov.in filters on IP reputation, which means a GitHub runner might get through on some days and not others. If direct polling of those regulators matters, the practical option is a small self-hosted runner (or a scheduled job on a cloud VM in an Indian region) that runs the same fetch scripts and pushes snapshots to the repo; whether an Indian cloud IP passes their filters was not tested here.

### 6. Operating rules for the jobs

Send an identifying User-Agent that names the project and its repository (no browser disguise; a site that refuses it is recorded as refusing, not worked around) and at most about one request per second per host, retry with exponential backoff (the National Portal CMS and IRDAI both failed transiently), and treat any change in the shape of an undocumented endpoint (e-Filing POST, GST `fomessage`, CBIC JHipster API, National Portal `/internal/cms`, NSE `/api/*`) as a failing test rather than silently publishing empty data. Store facts - dates, titles, numbers, links - and attribute the source; do not republish copied text from commercial or peer sites, and treat GPL or unlicensed repositories as reference material. Data taken from data.gov.in carries the GODL-India attribution requirement.

## Catalogue by category

Every entry below is also in data-sources.json with the same id. 'HTTP' is the status seen from this machine (Toronto, Canada) on 2026-10-14 with curl, a browser User-Agent, redirects followed and a 20 s timeout; 0 means no HTTP response at all (connect timeout, reset or DNS failure). Formats use the requested vocabulary (RSS, JSON, CSV, XLSX, PDF, HTML, ICS, API) plus a few extra tokens where nothing fitted (XML, YAML, Atom, Parquet, archives, and the implementation language for code repositories).

### Due dates and tax calendars (5)

Sources that publish actual due dates. Official machine-readable calendars exist only for income tax and the current GST return period; everything else comes from rules we maintain, so these sources are mainly used to detect drift and extensions.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P0 | [GST portal upcoming due dates (impdts JSON)](https://www.gst.gov.in/fomessage/impdts) `gst-portal-impdts` | open | 200 | JSON | Unknown - GoI website, no open licence stated |
| P0 | [e-Filing portal tax calendar API (full financial year)](https://eportal.incometax.gov.in/iec/returnservicesapi/getEntity) `it-efiling-tax-calendar-api` | open | 200 | JSON, API | Unknown - GoI website, no open licence stated (due dates are statutory facts; attribute source) |
| P0 | [Greater Chennai Corporation - Profession Tax press release](https://chennaicorporation.gov.in/gcc/pdf/PT_Press_Release.pdf) `state-pt-tn` | open | 200 | PDF | Unknown |
| P1 | [Odisha CT and GST - Professional Tax page](https://odishatax.gov.in/professional_tax.php) `state-pt-od` | open | 200 | HTML, PDF | Unknown |
| P2 | [Goa Labour Welfare Board (Labour and Employment Commissionerate)](https://labour.goa.gov.in/labour-welfare-board/) `state-lwf-ga` | open | 200 | HTML, PDF | Unknown |

- **GST portal upcoming due dates (impdts JSON)** (`gst-portal-impdts`, P0) - GSTN. Updates: monthly (current return period).
  - Gives us: Current-period due dates shown on the GST portal home page for GSTR-1 (monthly and QRMP), GSTR-3B (monthly and the two QRMP state groups), GSTR-5/5A/6/7/8, CMP-08 and IFF - the quickest signal that a GST date was extended.
  - Ingestion: GET daily. Response is {"data": "<JSON array encoded as a string>"}, so decode twice; entries {f: form and period, d: date text such as 'Oct 22nd, 24th, 2026', t: type, q: QRMP flag}. Parse ordinal dates (two dates mean the two QRMP state groups) and compare with our GST rule output; open an issue on mismatch.
  - Observed: GET 200; application/json; 269 B transferred; JSON object keys data. Endpoint found in static.gst.gov.in landing1.2.js (also /fomessage/msgtckr for the ticker). Returned 12 entries for the Sep 2026 and Jul-Sep 2026 periods, e.g. GSTR-3B (Sep, 2026) Oct 20th, 2026.
- **e-Filing portal tax calendar API (full financial year)** (`it-efiling-tax-calendar-api`, P0) - Income Tax Department (CBDT) - e-Filing portal. Updates: on publication; current FY only (FY 2027-28 not yet published).
  - Gives us: Authoritative list of income-tax, TDS/TCS deposit and return, advance tax, STT/CTT and statutory form due dates for the current FY, with form codes, category and the applicable Act (Income-tax Act 1961 vs 2025). Primary cross-check and override signal for every income-tax rule.
  - Ingestion: POST JSON {"serviceName":"taxCalendarServiceImpl","dueYear":2026,"pan":""} (dueYear = FY start year) with Content-Type application/json. Response is a list of about 350 objects: dueDate (epoch ms at IST midnight), dueDay/dueMonth/dueYear, dueDescription, dueCategory, formCd, dueDateDesc, applicableAct. Poll weekly (daily near deadlines), diff against rule expansion and open an issue on any mismatch. Per-month fallback: GET https://www.incometax.gov.in/iec/foportal/tax-calendar/ajax?month=11&year=2026 (same object shape).
  - Observed: POST 200; application/json; 27 KB transferred; JSON list of 353. Endpoint found in the e-Filing Angular bundle. POST with dueYear 2026 returned 353 items covering Apr 2026 - Mar 2027; dueYear 2027 returned an empty list. The home-page widget endpoint /iec/foportal/tax-calendar/ajax?month=M&year=Y also returned 200 JSON (12-73 items per sampled month from Apr 2026 to Mar 2027, empty from Apr 2027 and without parameters). OpenSSL chain check ok.
- **Greater Chennai Corporation - Profession Tax press release** (`state-pt-tn`, P0) - Revenue Department, Greater Chennai Corporation. Updates: half-yearly (reissued at a stable URL; current release dated 04-08-2026).
  - Gives us: Tamil Nadu PT half-yearly deduction months, the first-half remittance deadline, slab table and Rule 277 citation; second-half deadline to be confirmed from the Rules.
  - Ingestion: Automatable: fetch the stable PDF URL monthly, hash it, run pdftotext on change and flag for review. Rates are statewide; other urban local bodies collect in their own areas.
  - Observed: HTTP 200 application/pdf (1.0 MB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. Text-extractable PDF ref R.D. PT C.No/3555/2026 dated 04-08-2026, citing s.117-C of the TN Urban Local Bodies Act 1998 and Rule 277(2)/(3) of the TN Urban Local Bodies Rules 2023: employers deduct PT from the August and January pay bills, and the August 2026 deduction is remitted by 30 September 2026 with the Form 14 return; half-yearly slab table (nil up to Rs 21,000 half-yearly income, then Rs 180 / 425 / 930 / 1,025 / 1,250 w.e.f. II/2024-25). Linked from the GCC home page; online payment via erp.chennaicorporation.gov.in. No RSS.
- **Odisha CT and GST - Professional Tax page** (`state-pt-od`, P1) - Commissionerate of CT and GST, Finance Department, Government of Odisha. Updates: occasional.
  - Gives us: Odisha PT annual return deadline (three months after year-end; confirm the year basis in the OPT Rules) and rate bands.
  - Ingestion: Automatable: weekly fetch and hash of professional_tax.php and opt_notification.php; review on change.
  - Observed: HTTP 200 (20 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.2. Explains registration and enrolment, rates by annual gross income band (below Rs 1.6 lakh, Rs 1.6-3 lakh, above Rs 3 lakh), and that every registered employer and enrolled person files one online annual return in Form XII within three months of the end of the year; links a return-filing guide PDF (01-01-2024) and OPT Act, Rules and Notification pages (opt_act.php, opt_rules.php, opt_notification.php). No RSS.
- **Goa Labour Welfare Board (Labour and Employment Commissionerate)** (`state-lwf-ga`, P2) - Office of the Commissioner, Labour and Employment, Government of Goa. Updates: on amendment (amendment notification posted Jul 2024).
  - Gives us: Goa LWF half-yearly due dates and rates, directly.
  - Ingestion: Automatable: monthly fetch and hash of the page; manual review on change.
  - Observed: HTTP 200 (13 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. States the Goa LWF Act 1986 contribution rates (employee Rs 10, employer Rs 30, Government Rs 20) and half-yearly deadlines: January-June by 31 July and July-December by 31 January; links worker, department and contribution portals (iwocm.goalwb.in). The 'Amendment of GLWB' notification PDF is linked through a bare IP (http://13.203.245.190/...), which is fragile.

### Regulatory update feeds (33)

Sources for the 'latest regulatory updates' panel and for spotting due-date extensions. Feeds that work from a GitHub-hosted runner are marked open; blocked ones need a tip-off path (PIB, Gazette mirror, peer feeds) or a runner inside India.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P0 | [Internet Archive 'gazetteofindia' collection (central and state gazettes)](https://archive.org/advancedsearch.php?q=collection%3Agazetteofindia+AND+identifier%3Ain.gazette.central*&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=date&sort%5B%5D=date+desc&rows=50&output=json) `archive-org-gazette-of-india` | open | 200 | JSON, API, PDF | Gazette text reusable (Copyright Act 1957 s.52(1)(q)); archive.org terms apply |
| P0 | [CBIC Tax Information Portal API (GST and Customs notifications and circulars)](https://taxinformation.cbic.gov.in/api/cbic-notification-msts/fetchUpdatesByTaxId/1000001) `cbic-taxinfo-api` | open | 200 | JSON, API, PDF | Unknown - GoI website, no open licence stated |
| P0 | [GST portal news and advisories API](https://www.gst.gov.in/fomessage/newsupdates) `gst-portal-news` | open | 200 | JSON | Unknown - GoI website, no open licence stated |
| P0 | [e-Filing portal RSS (news, CBDT circulars, form updates)](https://www.incometax.gov.in/iec/foportal/rss.xml) `it-efiling-rss` | open | 200 | RSS | Unknown - GoI website, no open licence stated |
| P0 | [Ministry of Labour and Employment CMS API (documents, gazette notifications, whats new)](https://www.labour.gov.in/cms/wp-json/wp/v2/documents?per_page=20) `labour-gov-cms-api` | open | 200 | JSON, API | Unknown - GoI website, no open licence stated |
| P0 | [PIB press releases RSS (English, all ministries)](https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3&reg=3) `pib-rss` | open | 200 | RSS | Unknown - GoI website |
| P0 | [RBI notifications RSS](https://www.rbi.org.in/notifications_rss.xml) `rbi-notifications-rss` | open | 200 | RSS | Unknown - RBI website terms |
| P0 | [SEBI RSS feed (press releases, circulars, orders)](https://www.sebi.gov.in/sebirss.xml) `sebi-rss` | open | 200 | RSS | Unknown - GoI regulator website |
| P0 | [Karnataka Labour Welfare Board](https://klwb.karnataka.gov.in/) `state-lwf-ka` | geo-blocked | 0 | HTML, PDF | Unknown |
| P0 | [Karnataka Profession Tax notifications (Commercial Taxes Department)](https://gst.karnataka.gov.in/Profession.aspx) `state-pt-ka` | open | 200 | HTML, PDF | Unknown |
| P1 | [BSE RSS feeds (notices, corporate announcements)](https://www.bseindia.com/data/xml/notices.xml) `bse-rss-feeds` | open | 200 | RSS | Proprietary - exchange website terms of use |
| P1 | [DGFT notifications, public notices and trade notices](https://www.dgft.gov.in/CP/?opt=notification) `dgft-notices` | open | 200 | HTML, PDF | Unknown - GoI website |
| P1 | [eGazette (Gazette of India) recent uploads](https://egazette.gov.in/) `egazette` | open | 200 | HTML, PDF | Gazette text reusable (Copyright Act 1957 s.52(1)(q)); site terms apply |
| P1 | [EPFO website (circulars, ECR due-date extensions)](https://www.epfindia.gov.in/site_en/circulars.php) `epfo-portal` | geo-blocked | 403 | HTML, PDF | Unknown - GoI website |
| P1 | [ESIC website (circulars, contribution periods)](https://www.esic.gov.in/circulars) `esic-portal` | geo-blocked | 0 | HTML, PDF | Unknown - GoI website |
| P1 | [GST Council website](https://gstcouncil.gov.in/) `gst-council` | open | 200 | HTML, PDF | Unknown - GoI website |
| P1 | [MCA21 portal (notifications, circulars, news, forms)](https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/notifications.html) `mca-portal` | geo-blocked | 403 | HTML, PDF | Unknown - GoI website, no open licence stated |
| P1 | [NSE circulars API](https://www.nseindia.com/api/circulars) `nse-circulars-api` | open | 200 | JSON, API | Proprietary - exchange website terms of use |
| P1 | [PIB all releases page (grouped by ministry)](https://www.pib.gov.in/AllRelease.aspx?reg=3&lang=1) `pib-all-releases` | open | 200 | HTML | Unknown - GoI website |
| P1 | [RBI press releases RSS](https://www.rbi.org.in/pressreleases_rss.xml) `rbi-press-releases-rss` | open | 200 | RSS | Unknown - RBI website terms |
| P1 | [Sansad bills API (Lok Sabha and Rajya Sabha)](https://sansad.in/api_rs/legislation/getBills?page=1&size=20&locale=en&sortOn=billIntroducedDate&sortBy=desc) `sansad-bills-api` | open | 200 | JSON, API, PDF | Unknown - Parliament website terms |
| P2 | [DPIIT CMS API (FDI policy, press notes, rules)](https://www.dpiit.gov.in/cms/wp-json/wp/v2/documents?per_page=20) `dpiit-cms-api` | open | 200 | JSON, API | Unknown - GoI website, no open licence stated |
| P2 | [IBBI notifications and whats new](https://ibbi.gov.in/legal-framework/notifications) `ibbi` | open | 200 | HTML, PDF | Unknown - GoI regulator website |
| P2 | [IEPF Authority website](https://www.iepf.gov.in/) `iepf-authority` | geo-blocked | 403 | HTML, PDF | Unknown - GoI website |
| P2 | [IFSCA website (circulars, regulations, press releases)](https://ifsca.gov.in/) `ifsca` | open | 200 | HTML, PDF | Unknown - GoI regulator website |
| P2 | [IRDAI circulars, notifications and whats new](https://irdai.gov.in/circulars) `irdai` | open | 200 | HTML, PDF | Unknown - GoI regulator website |
| P2 | [MeitY CMS API (DPDP, IT Act and CERT-In documents)](https://www.meity.gov.in/cms/wp-json/wp/v2/documents?per_page=20) `meity-cms-api` | open | 200 | JSON, API | Unknown - GoI website, no open licence stated |
| P2 | [Ministry of MSME CMS API](https://www.msme.gov.in/cms/wp-json/wp/v2/documents?per_page=20) `msme-cms-api` | open | 200 | JSON, API | Unknown - GoI website, no open licence stated |
| P2 | [NFRA website](https://nfra.gov.in/) `nfra` | open | 200 | HTML, PDF | Unknown - GoI website |
| P2 | [NSE RSS feeds (circulars, announcements, corporate actions, results)](https://nsearchives.nseindia.com/content/RSS/Circulars.xml) `nse-rss-feeds` | open | 200 | RSS | Proprietary - exchange website terms of use |
| P2 | [PFRDA circulars](https://www.pfrda.org.in/regulatory-framework/circulars/active) `pfrda` | open | 200 | HTML, PDF | Unknown - GoI regulator website |
| P2 | [RBI other RSS feeds (speeches, publications, tenders, bulletin, annual report)](https://www.rbi.org.in/Scripts/rss.aspx) `rbi-other-rss` | open | 200 | RSS, HTML | Unknown - RBI website terms |
| P2 | [Odisha Labour Directorate - OLWF notifications and guidelines](https://labourdirectorate.odisha.gov.in/notifications-guidelines/olwf) `state-lwf-od` | geo-blocked | 0 | HTML, PDF | Unknown |

- **Internet Archive 'gazetteofindia' collection (central and state gazettes)** (`archive-org-gazette-of-india`, P0) - Internet Archive (uploads by Indian Kanoon). Updates: daily.
  - Gives us: Machine-friendly mirror of central and state gazettes with OCR text and ministry/department metadata - the most reliable way for an overseas runner to watch new CBDT, CBIC, MCA and Labour notifications.
  - Ingestion: Daily GET of the advancedsearch API (JSON) sorted by date desc; for new identifiers GET https://archive.org/metadata/<identifier> (description holds Ministry/Department) and optionally the OCR text; filter ministries of interest. Standard TLS, no key.
  - Observed: GET 200; application/json; 7 KB transferred; JSON object keys responseHeader,response. Collection holds 866,903 items (212,641 central); newest central items dated 2026-10-10 and uploaded the same day; newest state items 2026-10-12 (Gujarat). Metadata API 200 with OCR details. Scraper source code: github.com/sushant354/egazette.
- **CBIC Tax Information Portal API (GST and Customs notifications and circulars)** (`cbic-taxinfo-api`, P0) - CBIC, Department of Revenue, Ministry of Finance. Updates: on publication.
  - Gives us: Authoritative CGST/IGST notifications (including due-date extensions such as 01/2026-Central Tax for GSTR-3B), CBIC GST circulars and Customs notifications - the official source for GST overrides.
  - Ingestion: POST https://taxinformation.cbic.gov.in/api/authenticate-token with an empty body to get an anonymous JWT (id_token), then GET with Authorization: Bearer <token>: /api/cbic-notification-msts/fetchUpdatesByTaxId/1000001 (latest GST items), /api/cbic-notification-msts/fetchNotificationByCategory/1000001/Central%20Tax (full Central Tax list), /api/cbic-circular-msts/fetchAllCircularsByTaxId/1000001 (GST circulars). Tax ids: 1000001 GST, 1000002 Customs, 1000003 Central Excise, 1000004 Service Tax. PDF path in docFilePath. Poll daily. The server sends an incomplete certificate chain: ship the intermediate CA in the repo and pass it to curl/requests on Ubuntu runners.
  - Observed: GET 200; application/json; 3 KB transferred; JSON list of 4. JHipster API found in the portal main.js. Token POST returned a ROLE_ANONYMOUS JWT; GST updates returned 4 items; the Central Tax category returned 521 notifications (newest 02/2026-Central Tax dated 2026-05-07); GST circulars returned 272. OpenSSL check: 'unable to get local issuer certificate'.
- **GST portal news and advisories API** (`gst-portal-news`, P0) - GSTN. Updates: several per week.
  - Gives us: GSTN advisories (returns, registration, appeals, e-invoice), GST Council outcomes and monthly revenue releases, each with date and module tag.
  - Ingestion: GET every 3-6 hours; {"data":[{id,title,order,module,content (HTML),date dd/mm/yyyy,IsExternal,linkURl}]} newest 20; item page https://www.gst.gov.in/newsandupdates/read/<id> (detail JSON at /fomessage/newsupdates/<id>). Decode with a cp1252 fallback - smart quotes arrive as non-UTF-8 bytes.
  - Observed: GET 200; application/json; 10 KB transferred; JSON object (data[20]). Newest items dated 13/10/2026 (GSTR-9/9C for FY 2025-26; FAQs on the 57th GST Council meeting of 8 October 2026).
- **e-Filing portal RSS (news, CBDT circulars, form updates)** (`it-efiling-rss`, P0) - Income Tax Department (CBDT) - e-Filing portal. Updates: several times a week.
  - Gives us: Latest e-Filing news and e-campaigns, CBDT circulars (for example Circular No. 07/2026), new form utilities and FAQs, and deadline reminders - feeds the updates panel and flags income-tax extensions.
  - Ingestion: GET every 3-6 hours from Actions; parse RSS 2.0 items (title, link, pubDate); dedupe by link; keyword-tag circular / notification / due date / extended. The human list is https://www.incometax.gov.in/iec/foportal/latest-news.
  - Observed: GET 200; application/rss+xml; 18 KB transferred; feed parses (rss), 10 items, newest 2026-10-08. Drupal node feed, not linked from the site; found by convention.
- **Ministry of Labour and Employment CMS API (documents, gazette notifications, whats new)** (`labour-gov-cms-api`, P0) - Ministry of Labour and Employment. Updates: several per week.
  - Gives us: Labour Code notifications and rules, EPFO and ESIC policy decisions (for example the EPF wage ceiling), amnesty schemes and press releases - the official labour feed now that the EPFO and ESIC sites are blocked abroad.
  - Ingestion: GET daily: WordPress REST /cms/wp-json/wp/v2/documents?per_page=50&documents_category=146 (gazette-notifications), =144 (press-release), =147 (guidelines); category list at /cms/wp-json/wp/v2/documents_category?per_page=100; also /cms/wp-json/wp/v2/whats_new. Fields: id, date, modified, title.rendered, link, acf (attachments). No API key needed; dedupe by id.
  - Observed: GET 200; application/json; 4 KB transferred; JSON list of 20. Site is a Next.js static front end (same build as legislative.gov.in) over a headless WordPress at /cms/ (the client bundle sends an apikey header, but requests without it also returned 200). Newest document 2026-10-13 (PF trust amnesty scheme 2026); gazette-notifications has 32 items. The site's own /cms/feed path returns HTML, not RSS.
- **PIB press releases RSS (English, all ministries)** (`pib-rss`, P0) - Press Information Bureau. Updates: hourly.
  - Gives us: All-ministry press releases (Finance, Corporate Affairs, Labour, Commerce) - early signal for extensions, Cabinet decisions and new rules from sites we cannot reach (MCA, EPFO, ESIC).
  - Ingestion: Poll hourly; items have only title and link (no pubDate), so dedupe on PRID from the link and fetch the release page (or AllRelease) for ministry and date. Use exactly this query string: dropping reg=3 or adding a lowercase lang=1 makes the server redirect to the Hindi feed (Lang=2&reg=48). ModId=8 is photos and ModId=18 features.
  - Observed: GET 200; text/xml; 2 KB transferred; feed parses (rss), 20 items, items carry no dates. The documented URL (ModId=6&Lang=1&Regid=3) 302-redirects to the Hindi feed (Lang=2&reg=48) from Toronto; with reg=3 appended the English feed came back on three of three tries (20 items, no redirect), while adding &lang=1 redirected to Hindi again.
- **RBI notifications RSS** (`rbi-notifications-rss`, P0) - Reserve Bank of India. Updates: daily.
  - Gives us: RBI notifications including FEMA A.P. (DIR) circulars and master-direction amendments - FEMA reporting rules (FC-GPR, FC-TRS, ODI, ECB-2, FLA return).
  - Ingestion: GET every 3-6 hours; RSS 2.0 with only the 10 newest items, so poll at least daily; dedupe by link.
  - Observed: GET 200; text/xml; 26 KB transferred; feed parses (rss), 10 items, newest 2026-10-12. Feed list at https://www.rbi.org.in/Scripts/rss.aspx.
- **SEBI RSS feed (press releases, circulars, orders)** (`sebi-rss`, P0) - Securities and Exchange Board of India. Updates: daily.
  - Gives us: SEBI circulars (LODR, PIT, intermediaries) and press releases for listed-company and intermediary audiences.
  - Ingestion: GET every 3-6 hours; RSS 2.0; classify by link path (/legal/circulars/, /legal/regulations/, /media-and-notifications/press-releases/, /enforcement/orders/) and keep circulars and regulations for the feed.
  - Observed: GET 200; text/xml; 17 KB transferred; feed parses (rss), 30 items, newest 2026-10-14. The only feed SEBI publishes (per https://www.sebi.gov.in/rss.html).
- **Karnataka Labour Welfare Board** (`state-lwf-ka`, P0) - Karnataka Labour Welfare Board, Labour Department, Government of Karnataka. Updates: annual (contribution notice each year) and on extension.
  - Gives us: Karnataka LWF annual contribution due date, any notified extension, and rates.
  - Ingestion: Manual review each December-January; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. klwbapps.karnataka.gov.in behaves the same. Wayback shows storage/pdf-files contribution notices (2023-24 contribution, 'contribution payment date extended' notices including one to 31-01-2022) and news items; the PDFs are scans.
- **Karnataka Profession Tax notifications (Commercial Taxes Department)** (`state-pt-ka`, P0) - Commercial Taxes Department, Government of Karnataka. Updates: on notification (21 rows; newest dated 02-05-2026).
  - Gives us: Annual PT payment date for enrolled persons (30 April) and notified extensions as overrides, amendment Acts that change slabs, source citations for Karnataka PT.
  - Ingestion: Automatable: daily or weekly fetch of Profession.aspx, parse table rows, diff on serial number and date, open a review issue for each new row; encode extensions manually.
  - Observed: HTTP 200 (5.9 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles, TCP ok from Nuremberg. tlscheck: ok TLSv1.2. Server-rendered table (serial, subject, notification no., date, PDF link). Newest rows: Removal of Difficulties Order 01/2026 dated 02-05-2026 extending FY 2026-27 payment by enrolled persons to before 5 May 2026; KTPTC&E (Amendment) Act 2026, No. 22 of 2026 dated 27-03-2026; exemption-documents notification dated 01-04-2026. Sibling page Profession_tax.aspx links the Act, the 2025 amendment and the Rules. Old hosts pt.kar.nic.in and gst.kar.nic.in (still listed in IGOD) are NXDOMAIN. Gazette PDFs have a text layer; the July 2026 PT-portal press release is image-only. No RSS.
- **BSE RSS feeds (notices, corporate announcements)** (`bse-rss-feeds`, P1) - BSE Ltd. Updates: daily.
  - Gives us: BSE notices (trading holidays, listing compliance, buybacks) and corporate announcements.
  - Ingestion: GET daily notices.xml (and announcements.xml if per-company views are built); filter notice titles for holiday / listing / compliance.
  - Observed: GET 200; text/xml; 3 KB transferred; feed parses (rss), 46 items, newest 2026-10-14. notices.xml 46 items (newest 2026-10-14); announcements.xml 965 items (newest 2026-10-15). Both work even though api.bseindia.com is blocked.
- **DGFT notifications, public notices and trade notices** (`dgft-notices`, P1) - Directorate General of Foreign Trade. Updates: several per week.
  - Gives us: Foreign Trade Policy changes and deadlines for importers and exporters (IEC annual update, export obligation, RoDTEP).
  - Ingestion: Daily scrape of ?opt=notification, ?opt=public-notice and ?opt=trade-notice; parse number, date, subject and PDF link; dedupe by number.
  - Observed: GET 200; text/html; 285 KB transferred; HTML, 29098 chars of visible text. Root returns a 'Page Moved' stub pointing to /CP/; the three listings return 200-290 KB of server HTML with dated rows (e.g. 12/10/2026) and PDF links.
- **eGazette (Gazette of India) recent uploads** (`egazette`, P1) - Directorate of Printing, Ministry of Housing and Urban Affairs. Updates: daily.
  - Gives us: Legal publication of every central notification (CBDT, CBIC, MCA, Labour Codes) - authoritative citation and confirmation of overrides.
  - Ingestion: Daily: GET / to capture the cookieless session path (S(...)), then GET <session>/RecentUploads.aspx?Category=1 (extraordinary) and Category=2 (weekly); parse ministry, subject, part/section, issue and publish dates and gazette id; filter ministries of interest. PDFs need a postback, so link to the gazette id instead. The server sends an incomplete certificate chain - bundle the intermediate CA. The archive.org mirror is easier to automate.
  - Observed: GET 200; text/html; 67 KB transferred; final URL https://egazette.gov.in/(S(tthkon4xdiscsr4m33z3ks4t))/default.aspx; HTML, 3240 chars of visible text. Home page lists recent extraordinary gazettes (e.g. CG-DL-E-14102026-277156, 14-Oct-2026). RecentUploads via the session URL returned 20 rows per category; without the session prefix it redirects to error.aspx. OpenSSL check: 'unable to get local issuer certificate'.
- **EPFO website (circulars, ECR due-date extensions)** (`epfo-portal`, P1) - Employees' Provident Fund Organisation. Updates: on publication.
  - Gives us: PF/EDLI payment and ECR due date (15th of the following month), extension circulars and amnesty schemes.
  - Ingestion: Not pollable from GitHub-hosted runners. Watch the labour.gov.in CMS API and PIB (Ministry of Labour) for EPFO decisions; treat peer feeds as tip-offs only and confirm on an Indian connection.
  - Observed: GET 403; text/html; 919 B transferred; final URL https://www.epfo.gov.in:443/site_en/circulars.php; block page: ERROR: The request could not be satisfied; HTML, 553 chars of visible text. Redirects to www.epfo.gov.in, then CloudFront 403 'Request blocked' (POP YTO50, Toronto) for the home page and circulars; the member portal unifiedportal-mem.epfindia.gov.in answered 200 (login page only).
- **ESIC website (circulars, contribution periods)** (`esic-portal`, P1) - Employees' State Insurance Corporation. Updates: on publication.
  - Gives us: ESI contribution due date (15th of the following month), contribution periods and circulars.
  - Ingestion: Not reachable from outside India; use the labour.gov.in CMS API and PIB.
  - Observed: GET failed: connect timeout (curl: (28) Connection timed out after 15016 milliseconds). TCP connect timed out on www.esic.gov.in and esic.gov.in on three attempts.
- **GST Council website** (`gst-council`, P1) - GST Council Secretariat. Updates: per Council meeting.
  - Gives us: Council meeting recommendations, minutes and agenda notes that precede GST law and due-date changes.
  - Ingestion: Weekly scrape of the home-page updates block, or rely on the GST portal news API, which republishes Council outcomes. Ignore /rss.xml (it carries staff profile nodes).
  - Observed: GET 200; text/html; 16 KB transferred; HTML, 6496 chars of visible text. Drupal site; /rss.xml returned 10 items whose titles are person names (apparently staff profile pages, newest 2026-07-27), not notices.
- **MCA21 portal (notifications, circulars, news, forms)** (`mca-portal`, P1) - Ministry of Corporate Affairs. Updates: on publication.
  - Gives us: Authoritative Companies Act and LLP Act notifications and General Circulars (AGM/filing extensions, fee waivers), and the forms behind company/LLP due dates (AOC-4, MGT-7, LLP Form 8 and 11, DIR-3 KYC, MSME-1, DPT-3).
  - Ingestion: Blocked from outside India: every MCA URL tried returned an Akamai Access Denied 403. Capture MCA changes through PIB (Ministry of Corporate Affairs releases), the Gazette (archive.org mirror) and peer feeds; direct polling needs a self-hosted runner with an Indian IP.
  - Observed: GET 403; text/html; 460 B transferred; block page: Access Denied; HTML, 380 chars of visible text. HTTP 403 Akamai 'Access Denied' for https://www.mca.gov.in/, https://mca.gov.in/, the notifications, circulars, latest-news and data-report pages and /mcafoportal/; efiling.mca.gov.in does not resolve.
- **NSE circulars API** (`nse-circulars-api`, P1) - National Stock Exchange of India. Updates: daily.
  - Gives us: Exchange circulars on listing compliance submissions, holidays and settlement changes for listed entities.
  - Ingestion: GET daily (default window is the last 7 days); filter circCategory and circDepartment (Listing, Compliance); dedupe by circNumber; link circFilelink.
  - Observed: GET 200; application/json; 6 KB transferred; JSON object (data[148]). Returned 148 circulars for 08-10-2026 to 15-10-2026 with category, department, number and file link.
- **PIB all releases page (grouped by ministry)** (`pib-all-releases`, P1) - Press Information Bureau. Updates: hourly.
  - Gives us: Ministry and date for each release, enabling a filter to Finance, Corporate Affairs, Labour and Employment, Commerce and MSME.
  - Ingestion: Daily GET of the current month; parse ul.num blocks (h3 = ministry, li = title, PRID link, 'Posted on' date). Ministry ids for postback filtering: Finance 15, Labour 21, Corporate Affairs 66.
  - Observed: GET 200; text/html; 368 KB transferred; flags akamai-bot-manager; HTML, 192134 chars of visible text. 786 KB page listing 758 releases for October 2026 grouped under ministry headings.
- **RBI press releases RSS** (`rbi-press-releases-rss`, P1) - Reserve Bank of India. Updates: daily.
  - Gives us: Policy announcements, holiday notices and draft directions.
  - Ingestion: GET every 3-6 hours; 10 newest items only.
  - Observed: GET 200; text/xml; 11 KB transferred; feed parses (rss), 10 items, newest 2026-10-14. RSS 2.0.
- **Sansad bills API (Lok Sabha and Rajya Sabha)** (`sansad-bills-api`, P1) - Parliament of India (Sansad). Updates: during sessions.
  - Gives us: Track Finance Bills and other bills (tax, labour, company law) that will change due dates once enacted.
  - Ingestion: Weekly GET sorted by billIntroducedDate desc (daily during sessions); filter ministryName (FINANCE, CORPORATE AFFAIRS, LABOUR AND EMPLOYMENT); record introduced and passed dates and PDF links. Lookup endpoints: /api_rs/legislation/getMinistryName, getBillTypes, getBillStatus.
  - Observed: GET 200; application/json; 21 KB transferred; JSON object (records[20]). Endpoint found in the sansad.in Next.js bills chunk. Returned _metadata.totalElements 10,099 with ministry, category, introduced/passed dates and PDF links (newest: Tribunals Reforms Bill 2026, introduced 2026-08-10).
- **DPIIT CMS API (FDI policy, press notes, rules)** (`dpiit-cms-api`, P2) - Department for Promotion of Industry and Internal Trade. Updates: weekly.
  - Gives us: FDI policy press notes and factsheets that change FEMA FDI reporting obligations for foreign-owned companies.
  - Ingestion: GET weekly /cms/wp-json/wp/v2/documents; keep items whose titles mention press note, FDI or rules.
  - Observed: GET 200; application/json; 5 KB transferred; JSON list of 20. Same digifootprint WordPress platform; newest document 2026-09-28 (Gas Cylinders (Third Amendment) Rules, 2026), FDI factsheet for Q1 FY 2026-27 present. OpenSSL check ok.
- **IBBI notifications and whats new** (`ibbi`, P2) - Insolvency and Bankruptcy Board of India. Updates: weekly.
  - Gives us: IBC regulation amendments and insolvency-professional compliance (annual fees, continuing education).
  - Ingestion: Monthly scrape of dated rows; no RSS.
  - Observed: GET 200; text/html; 20 KB transferred; HTML, 5523 chars of visible text. Dated rows in server HTML (newest 08 Jul, 2026); /whats-new also 200.
- **IEPF Authority website** (`iepf-authority`, P2) - Investor Education and Protection Fund Authority (Ministry of Corporate Affairs). Updates: on publication.
  - Gives us: Rules and notices behind IEPF-1 / IEPF-4 transfers of unclaimed dividends and shares and the annual IEPF reporting by companies.
  - Ingestion: Blocked like mca.gov.in; maintain IEPF rules manually and watch the Gazette mirror and PIB (Corporate Affairs).
  - Observed: GET 403; text/html; 371 B transferred; block page: Access Denied; HTML, 291 chars of visible text. Akamai 403 Access Denied, same edge behaviour as mca.gov.in.
- **IFSCA website (circulars, regulations, press releases)** (`ifsca`, P2) - International Financial Services Centres Authority. Updates: weekly.
  - Gives us: GIFT City entity compliance (IFSC units, fund managers) - optional audience.
  - Ingestion: Monthly scrape if the IFSC audience is added; listing URLs use encrypted ids (/Legal/Index/<id>, /PressRelease/Index/<id>); no RSS.
  - Observed: GET 200; text/html; 121 KB transferred; HTML, 10330 chars of visible text. Home 123 KB; legal and press-release listings 200; no feed found.
- **IRDAI circulars, notifications and whats new** (`irdai`, P2) - Insurance Regulatory and Development Authority of India. Updates: weekly.
  - Gives us: Insurer and intermediary compliance deadlines (optional audience).
  - Ingestion: Monthly scrape of dated rows (Liferay pages are about 500 KB); no RSS.
  - Observed: GET 200; text/html; 485 KB transferred; HTML, 6633 chars of visible text. First attempt timed out; later attempts 200 with dated rows (newest 22-09-2026); /notifications and /web/guest/whats-new also 200.
- **MeitY CMS API (DPDP, IT Act and CERT-In documents)** (`meity-cms-api`, P2) - Ministry of Electronics and Information Technology. Updates: several per week.
  - Gives us: Digital Personal Data Protection Act and Rules notifications, IT Act rules and CERT-In directions - inputs for an optional data-protection compliance category.
  - Ingestion: Same headless WordPress platform as labour.gov.in: GET /cms/wp-json/wp/v2/documents (and /documents_category for filters) daily if a data-protection category is added; dedupe by id.
  - Observed: GET 200; application/json; 5 KB transferred; JSON list of 20. Same Next.js plus WordPress (digifootprint) platform as labour.gov.in and legislative.gov.in; newest document 2026-10-12 (CERT-In attached-office declaration). OpenSSL check ok.
- **Ministry of MSME CMS API** (`msme-cms-api`, P2) - Ministry of Micro, Small and Medium Enterprises. Updates: irregular.
  - Gives us: MSMED Act and Udyam notifications that affect MSME payment timelines (45-day rule) and MSME-1 reporting context.
  - Ingestion: Low value today: poll monthly at most; PIB covers Ministry of MSME releases.
  - Observed: GET 200; application/json; 4 KB transferred; JSON list of 20. msme.gov.in redirects to www; the default document listing returned items dated 2025-06-20 (international cooperation pages), so the CMS looks sparsely used. OpenSSL check ok.
- **NFRA website** (`nfra`, P2) - National Financial Reporting Authority. Updates: monthly.
  - Gives us: Auditor obligations such as the annual NFRA-2 return (audit audience).
  - Ingestion: Monthly manual check; the WordPress REST API is locked (401) and /feed/ returns HTTP 500.
  - Observed: GET 200; text/html; 31 KB transferred; HTML, 3948 chars of visible text. WordPress site; /wp-json/wp/v2/posts 401, /feed/ 500.
- **NSE RSS feeds (circulars, announcements, corporate actions, results)** (`nse-rss-feeds`, P2) - National Stock Exchange of India. Updates: daily.
  - Gives us: Fallback feed for exchange circulars and corporate actions.
  - Ingestion: Prefer the circulars JSON API; use Circulars.xml as fallback (no cookies needed on nsearchives). Feed index: https://www.nseindia.com/static/rss-feed.
  - Observed: GET 200; application/xml; 1 KB transferred; feed parses (rss), 20 items, newest 2026-10-14. Circulars.xml 20 items (newest 2026-10-14); Online_announcements.xml 2 items; Corporate_action.xml 9 items; Financial_Results.xml 4 items dated 2026-08-24 (stale); Board_Meetings.xml empty.
- **PFRDA circulars** (`pfrda`, P2) - Pension Fund Regulatory and Development Authority. Updates: weekly.
  - Gives us: NPS corporate-model obligations for employers (contribution remittance timelines).
  - Ingestion: Monthly scrape; no RSS.
  - Observed: GET 200; text/html; 125 KB transferred; final URL https://www.pfrda.org.in/regulatory-framework/circulars/active-circulars; HTML, 2702 chars of visible text. Liferay page with dated rows (newest 08-10-2026).
- **RBI other RSS feeds (speeches, publications, tenders, bulletin, annual report)** (`rbi-other-rss`, P2) - Reserve Bank of India. Updates: weekly.
  - Gives us: Not needed for due dates; listed for completeness.
  - Ingestion: Skip.
  - Observed: GET 200; text/html; 15 KB transferred; HTML, 3770 chars of visible text. Index page links speeches_rss.xml, Publication_rss.xml, tenders_rss.xml, Bulletin_rss.xml and AnnualReportMain_rss.xml.
- **Odisha Labour Directorate - OLWF notifications and guidelines** (`state-lwf-od`, P2) - Labour Directorate, Government of Odisha. Updates: on notification.
  - Gives us: Odisha LWF contribution dates and rates from the Act, Rules and notifications.
  - Ingestion: Manual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. The IGOD-listed labdirodisha.gov.in returns a Drupal 500 page whose body script-redirects to this host. Wayback (2023) shows this OLWF notifications page, an OLWF Act-and-Rules page and a PDF titled 'The OLWF Act, 2005 & Orissa Rules, 2015'.

### Holidays (central, state, bank, exchange) (22)

Holiday layers needed for display and for rolling or counting working days. Official data is reachable through the National Portal CMS, RBI and NSE even though DoPT itself is blocked abroad.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P0 | [National Portal of India holiday API - central government holidays](https://www.india.gov.in/internal/cms) `indiagov-central-holidays-api` | open | 200 | JSON, API | Unknown - GoI website (undocumented internal route) |
| P0 | [National Portal of India holiday API - state and UT holidays](https://www.india.gov.in/internal/cms) `indiagov-state-holidays-api` | open | 200 | JSON, API | Unknown - GoI website (undocumented internal route) |
| P0 | [NSE holiday master API (trading and clearing holidays)](https://www.nseindia.com/api/holiday-master?type=trading) `nse-holiday-api` | open | 200 | JSON, API | Proprietary - exchange website terms of use |
| P0 | [RBI holiday matrix (bank holidays under the NI Act by regional office)](https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx) `rbi-holiday-matrix` | open | 200 | HTML | Unknown - RBI website terms |
| P1 | [DoPT holiday Office Memorandums (central government)](https://dopt.gov.in/) `dopt-holiday-om` | geo-blocked | 0 | HTML, PDF | Unknown - GoI website |
| P1 | [State government holiday notifications (GAD PDFs)](https://www.india.gov.in/calendar) `state-gad-holiday-notifications` | open | 200 | PDF, HTML | Unknown - state government websites |
| P2 | [Abstract API public holidays](https://holidays.abstractapi.com/v1/?country=IN&year=2026) `abstract-holidays-api` | api-key | 400 | JSON, API | Proprietary |
| P2 | [API Ninjas holidays](https://api.api-ninjas.com/v1/holidays?country=IN&year=2026) `api-ninjas-holidays` | api-key | 400 | JSON, API | Proprietary |
| P2 | [BSE trading holidays page](https://www.bseindia.com/static/markets/marketinfo/listholi.aspx) `bse-holidays-page` | open | 200 | HTML | Proprietary - exchange website terms of use |
| P2 | [Calendarific holidays API](https://calendarific.com/api/v2/holidays?country=IN&year=2026) `calendarific-api` | api-key | 401 | JSON, API | Proprietary |
| P2 | [Google Calendar public holidays in India (ICS)](https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics) `google-india-holidays-ics` | open | 200 | ICS | Proprietary - Google terms |
| P2 | [HolidayAPI.com](https://holidayapi.com/v1/holidays?country=IN&year=2025) `holidayapi-com` | api-key | 401 | JSON, API | Proprietary |
| P2 | [ITAT bench-wise holiday lists](https://itat.gov.in/page/holiday_lists) `legal-itat-holiday-lists` | open | 200 | HTML, PDF | Unknown |
| P2 | [NCLT holiday notifications](https://nclt.gov.in/notifcation-holidays) `legal-nclt-holiday-notices` | open | 200 | HTML, PDF | Unknown |
| P2 | [MCX trading holidays](https://www.mcxindia.com/market-operations/trading-survelliance/trading-holidays) `mcx-holidays` | geo-blocked | 403 | HTML | Proprietary - exchange website terms of use |
| P2 | [NCDEX holiday list](https://www.ncdex.com/markets/holiday-list) `ncdex-holidays` | open | 200 | HTML | Proprietary - exchange website terms of use |
| P2 | [Office Holidays - India](https://www.officeholidays.com/countries/india/2026) `officeholidays-india` | open | 200 | HTML | Proprietary |
| P2 | [OpenHolidays API](https://openholidaysapi.org/PublicHolidays?countryIsoCode=IN&validFrom=2026-01-01&validTo=2026-12-31) `openholidays-api` | open | 200 | JSON, API | Open data project (licence not reviewed - India not covered) |
| P2 | [PublicHolidays.in](https://publicholidays.in/2026-dates/) `publicholidays-in` | open | 200 | HTML | Proprietary |
| P2 | [timeanddate.com India holidays](https://www.timeanddate.com/holidays/india/2026) `timeanddate-india` | captcha | 403 | HTML | Proprietary |
| P2 | [Wikidata SPARQL (holiday entities for India)](https://query.wikidata.org/sparql?query=SELECT%20%3Fh%20WHERE%20%7B%20%3Fh%20wdt%3AP17%20wd%3AQ668%20%7D%20LIMIT%201&format=json) `wikidata-sparql` | open | 200 | JSON, API | CC0-1.0 |
| P2 | [Wikipedia - Public holidays in India](https://en.wikipedia.org/wiki/Public_holidays_in_India) `wikipedia-holidays-india` | open | 200 | HTML | CC-BY-SA-4.0 |

- **National Portal of India holiday API - central government holidays** (`indiagov-central-holidays-api`, P0) - NIC / National Portal of India (data from DoPT). Updates: annual (2027 list already loaded).
  - Gives us: Central gazetted and restricted holidays for 2026 and 2027 with type flags - drives workingDaysAfter and the holiday layer.
  - Ingestion: Weekly POST to /internal/cms with JSON {"route":"/api/calendar-holidays?filters[date][$gte]=2027-01-01&filters[date][$lte]=2027-12-31&pagination[pageSize]=100"} for the current and next year; fields title, date, day, holiday_type (Gazetted / Restricted), calendar_year. It is an internal Strapi proxy route, so pin the response shape in tests, commit the last good snapshot and confirm against the DoPT OM.
  - Observed: POST 200; application/json; 2 KB transferred; JSON object keys data. Route found in the calendar page JS (module calls /internal/cms with a Strapi route). 2026 returned 50 holidays and 2027 returned 49, each typed Gazetted or Restricted. Human page https://www.india.gov.in/calendar is 200 and also offers an ICS download (/api/calendar-ics).
- **National Portal of India holiday API - state and UT holidays** (`indiagov-state-holidays-api`, P0) - NIC / National Portal of India (data from state GAD notifications). Updates: annual (2027 not yet loaded).
  - Gives us: State and UT public holidays keyed by state (LGD code) - state closures and state-tax deadline rolling.
  - Ingestion: Weekly; POST route /api/state-holidays?populate=state_dept_org&filters[date][$gte]=YYYY-01-01&filters[date][$lte]=YYYY-12-31&pagination[pageSize]=100&pagination[page]=N, paging to meta.pagination.pageCount with backoff and retries (HTTP 504 is common); map LGD codes to ISO 3166-2:IN; verify against each state's notification PDF linked on the calendar page.
  - Observed: POST 200; application/json; 11 KB transferred; JSON object keys data. 2026 has 1,541 entries in 16 pages across 36 states/UTs (state title, LGD code, holiday_type); 6 of 16 sequential page requests returned HTTP 504 on the first pass; 2027 returned 0 entries.
- **NSE holiday master API (trading and clearing holidays)** (`nse-holiday-api`, P0) - National Stock Exchange of India. Updates: annual (next year's list usually in December) plus ad-hoc closures.
  - Gives us: Exchange trading holidays per segment for the listed and investor audiences, including ad-hoc closures such as the 15 Jan 2026 Maharashtra municipal election.
  - Ingestion: GET monthly (daily during December) with a browser User-Agent and Accept: application/json; if it starts returning 401/403, first GET https://www.nseindia.com/ to obtain cookies. Response keys are segments (CM, FO, CD, COM, IRD, MF, SLBS, ...) each a list of {tradingDate dd-Mon-yyyy, weekDay, description}. Store dates only; ?type=clearing gives settlement holidays.
  - Observed: GET 200; application/json; 1 KB transferred; JSON object (CBM[20], CD[24], CM[20], CMOT[20]). Returned JSON without cookies; CM segment lists 20 dates for 2026 (including weekend dates and the Diwali muhurat note); ?type=clearing also 200. The www.nseindia.com HTML home page returned Akamai 403 at the same time, so blocking there is path or bot based, not purely geographic.
- **RBI holiday matrix (bank holidays under the NI Act by regional office)** (`rbi-holiday-matrix`, P0) - Reserve Bank of India. Updates: annual (next year usually added in December) plus ad-hoc additions.
  - Gives us: State-wise bank holidays (Negotiable Instruments Act) including Banks' Closing of Accounts - needed to roll payment due dates and show bank closures per state.
  - Ingestion: Weekly job: GET the page for __VIEWSTATE, __VIEWSTATEGENERATOR and __EVENTVALIDATION, then POST drRegionalOffice=<id>, drMonth=0, drYear=<yyyy>, btnGo=GO once per regional office (32) and year; parse month headings, day numbers and holiday names; map regional offices to ISO 3166-2:IN codes. Re-run when the next year appears in the year dropdown.
  - Observed: GET 200; text/html; 20 KB transferred; HTML, 10118 chars of visible text. GET shows the current month for all 32 regional offices. A WebForms POST for Mumbai (id 28), all months, 2026 returned the named list (e.g. 15 Jan municipal election holiday, 1 Apr closing of accounts, 10 Nov Diwali Bali Pratipada). The year dropdown currently ends at 2026.
- **DoPT holiday Office Memorandums (central government)** (`dopt-holiday-om`, P1) - Department of Personnel and Training. Updates: annual (OM for next year usually mid-year).
  - Gives us: Authoritative gazetted and restricted holiday list for central government offices in Delhi/New Delhi - basis of 'working day' computations.
  - Ingestion: Not pollable from outside India; use the India Portal holiday API (which republishes this list) and confirm once a year against the OM PDF via an Indian connection.
  - Observed: GET failed: connect timeout (curl: (28) Connection timed out after 15014 milliseconds). dopt.gov.in, www.dopt.gov.in, doptcirculars.nic.in and documents.doptcirculars.nic.in all timed out on connect.
- **State government holiday notifications (GAD PDFs)** (`state-gad-holiday-notifications`, P1) - State General Administration Departments. Updates: annual.
  - Gives us: Authoritative state holiday lists used to verify the India Portal state data.
  - Ingestion: Manual annual verification; store each PDF URL as the source on state holiday records.
  - Observed: GET 200; text/html; 40 KB transferred; HTML, 8094 chars of visible text. The calendar page links 2026 notifications for most states, e.g. gad.gujarat.gov.in, kerala.gov.in, gad.rajasthan.gov.in, goa.gov.in, maids.delhi.gov.in, meghalaya.gov.in, py.gov.in.
- **Abstract API public holidays** (`abstract-holidays-api`, P2) - Abstract API. Updates: continuous.
  - Gives us: Commercial holiday lookup.
  - Ingestion: Not recommended (key and terms).
  - Observed: GET 400; application/json; 133 B transferred; JSON object keys error. 400 validation error 'api_key is required'.
- **API Ninjas holidays** (`api-ninjas-holidays`, P2) - API Ninjas. Updates: continuous.
  - Gives us: Commercial holiday lookup.
  - Ingestion: Not recommended (key and terms).
  - Observed: GET 400; application/json; 29 B transferred; JSON object keys error. 400 without the X-Api-Key header.
- **BSE trading holidays page** (`bse-holidays-page`, P2) - BSE Ltd. Updates: annual.
  - Gives us: Cross-check for exchange holidays (BSE and NSE publish the same trading calendar).
  - Ingestion: Manual cross-check each December; no stable public JSON found (the Angular bundle loads it lazily and api.bseindia.com is blocked).
  - Observed: GET 200; text/html; 4 KB transferred; final URL https://www.bseindia.com/static/markets/marketinfo/listholi; HTML, 112 chars of visible text. Returns the 4 KB Angular shell; table rendered client-side.
- **Calendarific holidays API** (`calendarific-api`, P2) - Calendarific. Updates: continuous.
  - Gives us: Commercial holiday API with India national and state coverage.
  - Ingestion: Not recommended - needs a key (Actions secret) and commercial terms limit redistribution; official sources exist.
  - Observed: GET 401; application/json; 178 B transferred; JSON object (response[0]). 401 'Missing or invalid api credentials' without a key.
- **Google Calendar public holidays in India (ICS)** (`google-india-holidays-ics`, P2) - Google. Updates: continuous.
  - Gives us: Cross-check for central holiday dates and early estimates for future years.
  - Ingestion: Monthly fetch for diffing only; never publish as authoritative (mixes observances with holidays and is not state-specific).
  - Observed: GET 200; text/calendar; 22 KB transferred; ics events=565. 565 events spanning 2021-2031: 167 'Public holiday', 16 marked tentative, 382 'Observance'.
- **HolidayAPI.com** (`holidayapi-com`, P2) - Holiday API. Updates: continuous.
  - Gives us: Commercial holiday lookup.
  - Ingestion: Not recommended (key and terms).
  - Observed: GET 401; application/json; 125 B transferred; JSON object keys status,error. 401 'The API key parameter is required'.
- **ITAT bench-wise holiday lists** (`legal-itat-holiday-lists`, P2) - Income Tax Appellate Tribunal. Updates: yearly per bench (2026 lists uploaded between October 2025 and June 2026).
  - Gives us: Bench-specific non-working days for ITAT appeal reminders; also a cross-check of local holidays observed by central offices in each city.
  - Ingestion: Annual scrape of the table plus manual or OCR extraction of dates from the PDFs; ship the missing intermediate certificate with the job.
  - Observed: Open HTML table (description, PDF link, upload date) with 2026 holiday lists for the Cochin, Bangalore, Guwahati, Surat, Nagpur, Jaipur, Mumbai, Varanasi, Allahabad, Chennai, Jabalpur, Panaji, Jodhpur, Visakhapatnam, Hyderabad, Ahmedabad and Kolkata benches. PDFs vary in quality (some are scans). Same TLS chain problem as legal-itat.
- **NCLT holiday notifications** (`legal-nclt-holiday-notices`, P2) - National Company Law Tribunal. Updates: ad hoc (latest entry issued 09/04/2026 for a holiday on 14 April 2026).
  - Gives us: Mark NCLT-specific closures next to IBC and company-law filing reminders (minor).
  - Ingestion: Optional monthly scrape of the table (title, issue date, PDF link); the holiday date has to be read from the title or PDF.
  - Observed: Open HTML table of 12 holiday declarations with PDFs (Ambedkar Jayanti, a court vacation 23-31 Dec 2024, bench-specific local holidays, the G-20 closure in 2023). Sparse and bench-specific; not a full annual list.
- **MCX trading holidays** (`mcx-holidays`, P2) - Multi Commodity Exchange of India. Updates: annual.
  - Gives us: Commodity market holidays, only if a commodities audience is added.
  - Ingestion: Not reachable; vacanza/holidays or pandas_market_calendars may cover it later.
  - Observed: GET 403; text/html; 441 B transferred; block page: Access Denied; HTML, 361 chars of visible text. Akamai 403 'Access Denied'.
- **NCDEX holiday list** (`ncdex-holidays`, P2) - National Commodity and Derivatives Exchange. Updates: annual.
  - Gives us: Agri-commodity exchange holidays (optional).
  - Ingestion: JavaScript-rendered; skip unless a commodities audience is added.
  - Observed: GET 200; text/html; 4 KB transferred; HTML, 0 chars of visible text. 4 KB JavaScript shell with no server-rendered content.
- **Office Holidays - India** (`officeholidays-india`, P2) - Office Holidays Ltd. Updates: annual.
  - Gives us: Human cross-check only.
  - Ingestion: Reference only.
  - Observed: GET 200; text/html; 19 KB transferred; HTML, 17441 chars of visible text. Server-rendered page.
- **OpenHolidays API** (`openholidays-api`, P2) - OpenHolidays project. Updates: n/a.
  - Gives us: None today - India is not covered.
  - Ingestion: Not usable.
  - Observed: GET 200; application/json; 2 B transferred; JSON list of 0. Returned [] for IN; /Countries lists 36 countries (mostly Europe plus BR, MX, ZA) and no IN.
- **PublicHolidays.in** (`publicholidays-in`, P2) - PublicHolidays.in. Updates: annual.
  - Gives us: Human cross-check for state holidays.
  - Ingestion: Reference only.
  - Observed: GET 200; text/html; 124 KB transferred; final URL https://publicholidays.in/; HTML, 18321 chars of visible text. The 2026 path redirects to the home page.
- **timeanddate.com India holidays** (`timeanddate-india`, P2) - Time and Date AS. Updates: continuous.
  - Gives us: Human cross-check only.
  - Ingestion: Not ingestible (Cloudflare challenge) and proprietary.
  - Observed: GET 403; text/html; 4 KB transferred; block page: Just a moment&hellip;; HTML, 125 chars of visible text. 403 Cloudflare 'Just a moment' challenge page.
- **Wikidata SPARQL (holiday entities for India)** (`wikidata-sparql`, P2) - Wikimedia Foundation. Updates: continuous.
  - Gives us: Optional enrichment - multilingual names and descriptions keyed by holiday.
  - Ingestion: Build-time SPARQL query (instance of public holiday Q1197685, country India Q668); entities lack year-specific dates for lunar festivals, so never use for dates.
  - Observed: GET 200; application/sparql-results+json; 147 B transferred; JSON object keys head,results. A holiday query returned 50 entities (Republic Day, Bihu, Odisha Day, Karnataka Rajyotsava ...).
- **Wikipedia - Public holidays in India** (`wikipedia-holidays-india`, P2) - Wikimedia Foundation (community). Updates: continuous.
  - Gives us: Background descriptions of holidays; not dated per year.
  - Ingestion: Reference only (share-alike text - do not copy into an MIT site).
  - Observed: GET 200; text/html; 53 KB transferred; HTML, 13954 chars of visible text. 55 KB article.

### Legal text (Acts, rules, regulations, bills) (26)

Citation targets for each rule's 'law' and 'sources' fields. Mostly HTML or PDF; India Code is the only structured legal-text API.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P0 | [Maharashtra Labour Welfare Fund Act and Rules (MLWB consolidated English PDF)](https://mlwb.in/react-static-files/pdf/homepage/Quick-Links/MLWB-Fund-Act-and-Rules-english-version.pdf) `state-lwf-mh` | open | 200 | PDF, HTML | Unknown |
| P1 | [Union Budget documents (Finance Bill, memorandum)](https://www.indiabudget.gov.in/doc/Finance_Bill.pdf) `indiabudget` | open | 200 | PDF, HTML | Unknown - GoI website |
| P1 | [India Code (DSpace 9 REST, OAI-PMH, OpenSearch)](https://indiacode.gov.in/server/api/discover/search/objects?query=income-tax&size=3) `indiacode` | open | 200 | JSON, API, RSS, XML, PDF | Acts reusable (Copyright Act 1957 s.52(1)(q)); site terms apply |
| P1 | [Income Tax Department website (CBDT notifications, circulars, Acts, tax calendar)](https://incometaxindia.gov.in/Pages/communications/notifications.aspx) `itd-incometaxindia` | restricted | 403 | HTML, PDF | Unknown - GoI website, no open licence stated |
| P1 | [RBI Master Directions (incl. FEMA)](https://www.rbi.org.in/Scripts/BS_ViewMasterDirections.aspx) `rbi-master-directions` | open | 200 | HTML, PDF | Unknown - RBI website terms |
| P1 | [SEBI circulars and regulations listings (incl. LODR)](https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0) `sebi-legal-listings` | open | 200 | HTML, PDF | Unknown - GoI regulator website |
| P1 | [Punjab Labour Welfare Board (Punjab Labour Department)](https://pblabour.gov.in/) `state-lwf-pb` | geo-blocked | 0 | HTML, PDF, JSON | Unknown |
| P1 | [Telangana Labour Department - Labour Welfare Fund Act 1987](https://labour.telangana.gov.in/content/ActsRules/TELANGANA%20LABOUR%20WELFARE%20FUND%20ACT,%201987.htm) `state-lwf-tg` | restricted | 403 | HTML, PDF | Unknown |
| P1 | [Jharkhand Commercial Taxes - Professional Tax Acts and Rules](https://ctax.jharkhand.gov.in/web/10231/professional-tax-acts) `state-pt-jh` | geo-blocked | 0 | HTML, PDF | Unknown |
| P1 | [Madhya Pradesh Commercial Tax - Profession Tax Act and schedule](https://mptax.mp.gov.in/mpvatweb/requestRedirect.do?dispatch=displayPTActDetails) `state-pt-mp` | open | 200 | HTML, PDF | Unknown |
| P2 | [Competition Commission of India regulations](https://www.cci.gov.in/legal-framwork/regulations) `cci` | open | 200 | HTML, PDF | Unknown - GoI regulator website |
| P2 | [Indian High Court Judgments (Registry of Open Data on AWS)](https://registry.opendata.aws/indian-high-court-judgments/) `legal-aws-hc-judgments` | open | 200 | PDF, JSON, Parquet, TAR | CC-BY-4.0 |
| P2 | [Indian Supreme Court Judgments (Registry of Open Data on AWS)](https://registry.opendata.aws/indian-supreme-court-judgments/) `legal-aws-sc-judgments` | open | 200 | PDF, JSON, Parquet, TAR | CC-BY-4.0 |
| P2 | [CESTAT cause lists and final orders](https://cestat.gov.in/viewcauselist) `legal-cestat` | captcha | 200 | HTML, PDF | Unknown |
| P2 | [eCourts Judgments and Orders portal (Supreme Court and High Courts)](https://judgments.ecourts.gov.in/pdfsearch/index.php) `legal-ecourts-judgments` | captcha | 200 | HTML, PDF | Unknown (court judgments may be reproduced under Copyright Act s.52(1)(q)(iv)) |
| P2 | [eCourts Services (case status, cause lists and orders for district courts and High Courts)](https://services.ecourts.gov.in/ecourtindia_v6/) `legal-ecourts-services` | captcha | 200 | HTML, PDF | Unknown |
| P2 | [Indian Kanoon API and website](https://api.indiankanoon.org/) `legal-indian-kanoon` | api-key | 200 | JSON, XML, HTML, API | Proprietary |
| P2 | [ITAT tribunal orders](https://itat.gov.in/judicial/tribunal_orders) `legal-itat` | captcha | 200 | HTML, PDF | Unknown |
| P2 | [NCLAT daily cause lists, judgments and daily orders](https://nclat.nic.in/daily-cause-list) `legal-nclat` | open | 200 | HTML, PDF | Unknown |
| P2 | [NCLT cause lists, orders and circulars](https://nclt.gov.in/all-cause-list) `legal-nclt` | open | 200 | HTML, PDF | Unknown |
| P2 | [Supreme Court of India website (judgments, cause lists)](https://www.sci.gov.in/judgements-judgement-date/) `legal-sci` | captcha | 200 | HTML, PDF | Unknown (judgments may be reproduced under Copyright Act s.52(1)(q)(iv)) |
| P2 | [Legislative Department CMS API](https://www.legislative.gov.in/cms/wp-json/wp/v2/documents?per_page=20) `legislative-dept-cms-api` | open | 200 | JSON, API | Unknown - GoI website |
| P2 | [Meghalaya Taxation Department - Professions Tax Acts, Rules and forms](https://meggst.gov.in/) `state-pt-ml` | geo-blocked | 0 | HTML, PDF | Unknown |
| P2 | [Manipur Department of Taxes - Professional Tax amendments](https://www.manipurtaxes.gov.in/en/professional-tax/amendment/) `state-pt-mn` | open | 200 | HTML, PDF | Unknown |
| P2 | [Puducherry Local Administration Department - Acts and Rules (municipal profession tax)](https://lad.py.gov.in/acts-rules) `state-pt-py` | open | 200 | HTML, PDF | Unknown |
| P2 | [Tripura Commissionerate of Taxes and Excise - Professions Tax rules and notifications](https://taxes.tripura.gov.in/index.php/profession_rules) `state-pt-tr` | geo-blocked | 0 | HTML, PDF | Unknown |

- **Maharashtra Labour Welfare Fund Act and Rules (MLWB consolidated English PDF)** (`state-lwf-mh`, P0) - Maharashtra Labour Welfare Board. Updates: on amendment (consolidated through MGG Ext. No. 41 dated 18-03-2024).
  - Gives us: Maharashtra LWF half-yearly due dates (15 July and 15 January), current rates and the s.6BB citation.
  - Ingestion: Automatable: monthly hash of this PDF plus the public.mlwb.in notice list (intermediate certificate added); manual review on change.
  - Observed: HTTP 200 application/pdf (3.7 MB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3 (mlwb.in). Text-extractable; s.6BB as substituted in 2024: employee Rs 25 per half-year for employees on the register on 30 June and 31 December, employer three times that, both paid by the employer before 15 July and 15 January. mlwb.in itself is a React SPA (JS-only shell) whose bundle links this PDF and the Notification-6BB gazette (Marathi, font-encoded); adminconsole.mlwb.in/api serves only visitor stats, contacts and scheme counts. The server-rendered portal public.mlwb.in (200, 156 KB) posts notices (e.g. June 2026 unpaid-accumulation notice) but fails tlscheck (unable to get local issuer certificate).
- **Union Budget documents (Finance Bill, memorandum)** (`indiabudget`, P1) - Ministry of Finance. Updates: annual (Budget day, usually 1 February).
  - Gives us: Annual Finance Bill and explanatory memorandum - rate and due-date changes effective each 1 April.
  - Ingestion: Manual review each February; archive the PDFs; the Finance Act as passed comes later via the Gazette.
  - Observed: GET 200; application/pdf; 1741 KB transferred; pdf. Finance_Bill.pdf 200 (1.8 MB) and memo.pdf 200 (3.1 MB) for Budget 2026-27; home page 200.
- **India Code (DSpace 9 REST, OAI-PMH, OpenSearch)** (`indiacode`, P1) - Legislative Department / NIC. Updates: on enactment (currently back-filling history).
  - Gives us: Bare Acts and subordinate legislation (Income-tax Act 2025, CGST Act, Companies Act, Labour Codes, state PT and LWF Acts) for law citations on each rule.
  - Ingestion: Resolve handles per Act at build time via /server/api/discover/search/objects?query=...; OAI-PMH at /server/oai/request and OpenSearch RSS at /server/opensearch/search?query=...&format=rss. Do not treat recently accessioned items as new law - historical ordinances were being back-filled on 2026-10-14.
  - Observed: GET 200; application/json; 3 KB transferred; JSON object keys id,scope,query,appliedFilters,sort. indiacode.nic.in now shows a 'Site Migration' page redirecting to https://indiacode.gov.in (DSpace 9.1, 131,034 items). REST, OAI Identify and OpenSearch RSS all 200. www.indiacode.gov.in fails TLS (hostname mismatch) - use the apex host. indiacode.nic.in OAI timed out.
- **Income Tax Department website (CBDT notifications, circulars, Acts, tax calendar)** (`itd-incometaxindia`, P1) - Income Tax Department / CBDT. Updates: on publication.
  - Gives us: Primary home of CBDT notifications and circulars, the Income-tax Act 2025 and Income-tax Rules text and the department's own tax calendar - the citation targets for income-tax rule sources.
  - Ingestion: Not reliably ingestible from outside India: every path tried from this machine returned an Akamai Access Denied page. Use the e-Filing RSS and tax-calendar API for automation, cite incometaxindia URLs by hand, and test once from the actual Actions runner (the block appears to be IP-reputation based, so a runner may or may not pass); a self-hosted runner is the fallback.
  - Observed: GET 403; text/html; 434 B transferred; final URL https://www.incometaxindia.gov.in/Pages/communications/notifications.aspx; block page: Access Denied; HTML, 354 chars of visible text. Redirects to www.incometaxindia.gov.in then HTTP 403 Akamai Access Denied on every path tried here (/, /Pages/tax-calendar.aspx, notifications, circulars). A parallel multi-location check (check-host.net nodes, run by the open-data survey) saw it answer from some US, Canadian and Singapore servers but refuse Germany and a Mumbai datacenter, so the block looks like IP reputation rather than country.
- **RBI Master Directions (incl. FEMA)** (`rbi-master-directions`, P1) - Reserve Bank of India. Updates: on amendment.
  - Gives us: Citation targets for FEMA reporting rules (FDI and ODI reporting, ECB returns, LRS).
  - Ingestion: Monthly scrape for changed 'updated as on' dates; the notifications RSS catches amendments in between.
  - Observed: GET 200; text/html; 81 KB transferred; HTML, 196609 chars of visible text. Old-style Scripts page still served alongside the redesigned site; a master-direction detail page (BS_ViewMasDirections.aspx?id=11253) also returned 200.
- **SEBI circulars and regulations listings (incl. LODR)** (`sebi-legal-listings`, P1) - Securities and Exchange Board of India. Updates: daily.
  - Gives us: Current LODR Regulations 2015 text and the circulars that set listed-company deadlines (Reg 13, 23, 24A, 27, 31, 33, 34, BRSR).
  - Ingestion: Weekly scrape of the circulars (ssid=7) and regulations (ssid=3) listings; paging is a POST to /sebiweb/ajax/home/getnewslistinfo.jsp. Store links to the latest LODR consolidated text; use the RSS for change detection.
  - Observed: GET 200; text/html; 46 KB transferred; HTML, 5137 chars of visible text. Circulars listing has dated rows (newest Oct 07, 2026); the regulations listing (ssid=3) also 200; a guessed /legal/regulations/ path returned 403.
- **Punjab Labour Welfare Board (Punjab Labour Department)** (`state-lwf-pb`, P1) - Punjab Labour Welfare Board, Labour Department, Government of Punjab. Updates: on notification.
  - Gives us: Punjab LWF contribution rates and due dates from the Act and Rules; the same Act is the basis for Chandigarh.
  - Ingestion: Manual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. Wayback shows uploads of the Punjab Labour Welfare Fund Act 1965 and Rules 1966 PDFs, a PLWB constitution notice, scheme lists, and a JSON endpoint /plwbapi/plwb/schemes/status used by the site (scheme data, not contribution rules).
- **Telangana Labour Department - Labour Welfare Fund Act 1987** (`state-lwf-tg`, P1) - Labour Department, Government of Telangana. Updates: on amendment.
  - Gives us: Telangana LWF contribution rates and annual due date from the Act.
  - Ingestion: Manual only; the WAF rejects automated fetches.
  - Observed: HTTP 403 F5 ASM 'The requested URL was rejected' page from Toronto, and 403 from check-host Mumbai, Los Angeles and Nuremberg for this page and the site root, so the WAF blocks scripted clients regardless of country. tlscheck: ok TLSv1.3. Wayback shows this HTML Act page (2019) and the AP LWF Act 1987 PDF under content/ActsRules.
- **Jharkhand Commercial Taxes - Professional Tax Acts and Rules** (`state-pt-jh`, P1) - Department of Commercial Taxes, Government of Jharkhand. Updates: on notification.
  - Gives us: Jharkhand PT Act and Rules 2012 for slabs and annual payment and return dates.
  - Ingestion: Manual annual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto and Los Angeles, refused from Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. Liferay site; Wayback captures (to Apr 2026) show the PT Acts and PT Rules pages, the Professional Tax Rules 2012 document and a 'Circular regarding Professional Tax'. The older domain jharkhandcomtax.gov.in resolves only from India (geo-DNS).
- **Madhya Pradesh Commercial Tax - Profession Tax Act and schedule** (`state-pt-mp`, P1) - Commercial Tax Department, Government of Madhya Pradesh. Updates: on notification.
  - Gives us: MP PT (Vritti Kar) Act text and schedule, and the notification list for rate or date changes.
  - Ingestion: Weekly fetch with the missing intermediate certificate added to the runner CA bundle; diff the notification list and review new items.
  - Observed: HTTP 200 (56 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: VERIFY-FAIL unable to get local issuer certificate (incomplete chain; a Linux runner fails unless the intermediate is supplied, while Windows curl succeeds via AIA). Menu items are javascript: links that wrap plain GET URLs (PT Act and PT Schedule both map to displayPTActDetails; government notifications at /mpvatweb/circular.do?strType=NOTI&strActionType=LIST). The 'js-required' flag comes from a browser notice; the content is server-rendered. mptaxes.mp.gov.in is NXDOMAIN; the mptax.mp.gov.in root is a meta-refresh to /mpvatweb.
- **Competition Commission of India regulations** (`cci`, P2) - Competition Commission of India. Updates: occasional.
  - Gives us: Combination (merger) filing timelines - event-based rules only.
  - Ingestion: Reference only; list content loads client-side.
  - Observed: GET 200; text/html; 7 KB transferred; HTML, 1114 chars of visible text. Server HTML has almost no list content (one date visible).
- **Indian High Court Judgments (Registry of Open Data on AWS)** (`legal-aws-hc-judgments`, P2) - Dattam Labs (data collected from the eCourts judgments portal). Updates: quarterly per the registry; several 2026 partitions modified 2026-10-14.
  - Gives us: Same as the Supreme Court set; useful for GST and income-tax writ rulings in a curated updates feed.
  - Ingestion: Monthly: list the current-year partitions, download only parquet files whose LastModified or ETag changed, filter by keywords, publish a small JSON; same CC-BY attribution.
  - Observed: Registry page 200. Bucket s3://indian-high-court-judgments (ap-south-1) lists anonymously: 25 High Courts, metadata/parquet/year=YYYY/court=<code>/bench=<bench>/metadata.parquet (56 objects for 2026), metadata/parquet_case_details, JSON and tar bundles plus compressed PDFs.
- **Indian Supreme Court Judgments (Registry of Open Data on AWS)** (`legal-aws-sc-judgments`, P2) - Dattam Labs (data collected from the eCourts judgments portal). Updates: bi-monthly per the registry; metadata/parquet/year=2026/metadata.parquet last modified 2026-10-14.
  - Gives us: Optional 'recent rulings' feed: filter the current-year metadata for tax and company-law matters and link to the PDF.
  - Ingestion: Weekly: GET https://indian-supreme-court-judgments.s3.ap-south-1.amazonaws.com/metadata/parquet/year=<YYYY>/metadata.parquet (about 270 KB), read with pyarrow or duckdb, keep the last 30 days, attribute 'Indian Supreme Court Judgments, Dattam Labs, CC-BY-4.0'.
  - Observed: Registry page 200. Bucket s3://indian-supreme-court-judgments (ap-south-1) lists anonymously over HTTPS with no AWS account: data/pdf, data/tar, metadata/json and metadata/parquet/year=1950 to year=2026. The description covers 1950-2025 with English and regional-language versions; documentation lives in github.com/vanga/indian-supreme-court-judgments.
- **CESTAT cause lists and final orders** (`legal-cestat`, P2) - Customs, Excise and Service Tax Appellate Tribunal. Updates: daily.
  - Gives us: None.
  - Ingestion: None.
  - Observed: Reachable here and from check-host nodes in the US, Germany and India; cause list, order status and final-order searches all require a CSRF token plus an image CAPTCHA.
- **eCourts Judgments and Orders portal (Supreme Court and High Courts)** (`legal-ecourts-judgments`, P2) - e-Committee, Supreme Court of India. Updates: daily.
  - Gives us: None directly.
  - Ingestion: Do not scrape; use legal-aws-sc-judgments and legal-aws-hc-judgments.
  - Observed: Reachable from outside India (and from check-host nodes in the US, Germany and India); full-text search needs an image CAPTCHA per search session. This portal is the upstream of the AWS open datasets below.
- **eCourts Services (case status, cause lists and orders for district courts and High Courts)** (`legal-ecourts-services`, P2) - e-Committee, Supreme Court of India / NIC. Updates: daily.
  - Gives us: None for a compliance calendar.
  - Ingestion: None.
  - Observed: Reachable from outside India; case status, cause list and order searches all require an image CAPTCHA.
- **Indian Kanoon API and website** (`legal-indian-kanoon`, P2) - Indian Kanoon (private legal search service). Updates: daily (new judgments, orders and statutes).
  - Gives us: Optional: link a due-date or penalty explainer to leading judgments on that provision; not needed for dates.
  - Ingestion: Backend or build-time only so the token stays secret: POST https://api.indiankanoon.org/search/?formInput=<q>&pagenum=0 and /doc/<id>/ (as the official ikapi client does), cache results per explainer page, stay within the free non-commercial credit, show the required logo.
  - Observed: api.indiankanoon.org pages (pricing, terms, documentation) returned 200 here after a transient Cloudflare 502 earlier in the day, and 200 from seven check-host nodes in five countries. The public site indiankanoon.org serves a Cloudflare 'Just a moment' challenge (403) to non-Indian datacenter IPs but 200 to the Mumbai node, so scraping is not viable. Pricing: prepaid INR per request - search 0.50, original document 0.50, document 0.20, fragment 0.05, metainfo 0.02; INR 500 free credit on signup; non-commercial use can get INR 10,000 free per month after use-case verification. Terms: a 'powered by IKanoon' logo attribution is mandatory (also for RAG or model-training use), prices can change with one week's notice, data is provided as is. Auth is an 'Authorization: Token' header or signed requests.
- **ITAT tribunal orders** (`legal-itat`, P2) - Income Tax Appellate Tribunal. Updates: daily.
  - Gives us: None.
  - Ingestion: None.
  - Observed: Order search needs a CAPTCHA and CSRF token. TLS: itat.gov.in serves an incomplete certificate chain (VERIFY-FAIL 'unable to get local issuer certificate' against the Mozilla bundle), so Ubuntu runners fail unless the intermediate is supplied; Windows curl passed thanks to AIA fetching. Responses took about 9 seconds.
- **NCLAT daily cause lists, judgments and daily orders** (`legal-nclat`, P2) - National Company Law Appellate Tribunal. Updates: daily.
  - Gives us: Optional link-outs to recent IBC appellate rulings in the updates feed.
  - Ingestion: Optional daily scrape of the homepage 'Judgements' tab (title, date, PDF link).
  - Observed: Cause-list page links 31 PDFs (for example Causelist_II_16.10.2026.pdf, downloadable, Last-Modified 2026-10-13); judgments and daily orders are searchable through forms with a CSRF token but no CAPTCHA, and the homepage lists the latest order PDFs with party names. Material before 31.05.2021 sits in separate archives.
- **NCLT cause lists, orders and circulars** (`legal-nclt`, P2) - National Company Law Tribunal. Updates: daily (next-day cause lists per bench).
  - Gives us: Low: IBC and company-law notices for an updates feed; cause lists are out of scope.
  - Ingestion: Optional weekly scrape of /circulars and homepage notices (title, date, PDF link); no order scraping.
  - Observed: Drupal table without CAPTCHA: title, bench/court, number of entries, date and a PDF under /sites/default/files/pdf_cause_list/ (20 lists dated 15 Oct 2026 on page one; a sampled PDF downloaded with Last-Modified 2026-10-14). Orders and judgements by date (/order-date-wise) need a CAPTCHA. Circulars and public notices are listed on the homepage and /circulars.
- **Supreme Court of India website (judgments, cause lists)** (`legal-sci`, P2) - Supreme Court of India. Updates: daily.
  - Gives us: Rare: landmark tax or corporate rulings for the updates feed.
  - Ingestion: Use legal-aws-sc-judgments instead of scraping.
  - Observed: Akamai-fronted WordPress site: 200 here and from US check-host nodes, 403 from Germany and Mumbai datacenter nodes. Judgment-by-date and cause-list searches require a CAPTCHA; /feed/ and /wp-json/ return 404, so there is no RSS.
- **Legislative Department CMS API** (`legislative-dept-cms-api`, P2) - Legislative Department, Ministry of Law and Justice. Updates: monthly.
  - Gives us: Repealed-law lists, central ordinances and constitution orders - low value for due dates.
  - Ingestion: Monthly poll at most; India Code is the better legal-text source.
  - Observed: GET 200; application/json; 5 KB transferred; JSON list of 20. Same headless WordPress platform as labour.gov.in; sparse content (acts-and-policy 10 items, gazette-notifications 3); newest document 2026-08-24.
- **Meghalaya Taxation Department - Professions Tax Acts, Rules and forms** (`state-pt-ml`, P2) - Taxation Department, Government of Meghalaya. Updates: on amendment (latest seen: amendment Act 2022).
  - Gives us: Meghalaya PT slab and payment rules (Act as amended in 2022).
  - Ingestion: May work from US-based GitHub runners (Los Angeles succeeded); try once from Actions, else manual annual review.
  - Observed: TCP connect timeout from Toronto and Nuremberg, but HTTP 200 from check-host Los Angeles and Mumbai, so the filter is not India-only. tlscheck: CONNECT-FAIL timeout. Wayback shows /ActsRules/ PDFs (Meghalaya professional amendment Act 2022, PT rules, PT notification, 1991 and 2012 amendments) and /forms/ptax/ forms. megtaxes.gov.in and megvat.gov.in are NXDOMAIN.
- **Manipur Department of Taxes - Professional Tax amendments** (`state-pt-mn`, P2) - Department of Taxes, Government of Manipur. Updates: stale (latest item: Ninth Amendment Act 2020).
  - Gives us: Manipur PT Act and amendment citations only.
  - Ingestion: Manual check once a year.
  - Observed: HTTP 200 (9.9 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. Table of PT amendment Acts with PDFs (latest No.2/11/2020-Leg/L dated 06-03-2020, Ninth Amendment Act 2020); sibling pages hold the Manipur Professions Act 1981 and Rules 1982. The PT Notification and Order tables show 'Data Not Available' and the header still shows former office-holders, so the site is not maintained. The older host manipurvat.gov.in has an expired certificate (tlscheck VERIFY-FAIL).
- **Puducherry Local Administration Department - Acts and Rules (municipal profession tax)** (`state-pt-py`, P2) - Local Administration Department, Government of Puducherry. Updates: rarely.
  - Gives us: Legal basis for Puducherry PT as a municipal levy; no schedule or due dates online.
  - Ingestion: Manual annual review; add the intermediate certificate if this is ever automated.
  - Observed: HTTP 200 (115 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: VERIFY-FAIL unable to get local issuer certificate (incomplete chain). The captcha flag comes only from a feedback webform. Lists the Puducherry Municipalities Act 1973 (labelled 'Puducherry Municipal Decree Act-1973') and links the five municipalities (Puducherry, Oulgaret, Karaikal, Mahe, Yanam) and commune panchayats, which levy PT; the tax payment portal lgrams.py.gov.in timed out from Toronto. No PT schedule or due dates found.
- **Tripura Commissionerate of Taxes and Excise - Professions Tax rules and notifications** (`state-pt-tr`, P2) - Commissionerate of Taxes and Excise, Finance Department, Government of Tripura. Updates: on notification (rate notifications uploaded May 2024).
  - Gives us: Tripura PT rate schedule and notifications.
  - Ingestion: Manual annual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto and Los Angeles, DNS failure from Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. Drupal site; Wayback shows the profession_rules listing and May 2024 uploads titled 'Notification on Revision of Rate of Professions Tax' (the one extracted is the 2013 gazette notification under the Tripura PT Act 1997). The separate e-portal ptax.tripura.gov.in (IGOD-listed, also geo-blocked) uses math captchas for enrolment.

### Entity and identifier data (13)

Company, LLP, GSTIN, LEI and similar identifiers. Not needed for the calendar itself; useful only if per-entity views are added. Most official lookups are captcha-gated or restricted.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P1 | [GLEIF LEI Records API](https://api.gleif.org/api/v1/lei-records?filter[entity.legalAddress.country]=IN&page[size]=5) `entity-gleif-lei-api` | open | 200 | JSON, API | CC0-1.0 |
| P1 | [NSE securities available for trading (EQUITY_L.csv) and NSE Emerge SME list](https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv) `entity-nse-equity-list` | open | 200 | CSV | Proprietary (NSE website terms; factual listing data) |
| P2 | [BSE list of scrips (ListofScripData API)](https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active) `entity-bse-scrip-list` | restricted | 403 | JSON, API | Proprietary (BSE website terms; undocumented website API) |
| P2 | [GLEIF Golden Copy and delta files](https://goldencopy.gleif.org/api/v2/golden-copies/publishes/latest) `entity-gleif-golden-copy` | open | 200 | CSV, XML, JSON, ZIP | CC0-1.0 |
| P2 | [GST portal Search Taxpayer (GSTIN lookup)](https://services.gst.gov.in/services/searchtp) `entity-gstin-search` | captcha | 200 | HTML, JSON | Unknown |
| P2 | [Legal Entity Identifier India Ltd (LEIL) - LEI issuer for India](https://www.ccilindia-lei.co.in/) `entity-leil-india` | open | 200 | XML, JSON, HTML | Unknown (the same LEI records are CC0 via GLEIF) |
| P2 | [MCA21 V3 company/LLP master data and monthly incorporation lists](https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html) `entity-mca-master-data` | geo-blocked | 403 | HTML, XLSX | Unknown (government website terms) |
| P2 | [OpenCorporates - India jurisdiction](https://opencorporates.com/companies/in) `entity-opencorporates-india` | api-key | 200 | JSON, HTML, API | ODbL-1.0 (share-alike and attribution; free API use is for qualifying 'Permitted Users', otherwise a paid licence) |
| P2 | [PAN verification channels (e-Filing 'Verify Your PAN', Protean online PAN verification, API Setu PAN APIs)](https://eportal.incometax.gov.in/iec/foservices/#/pre-login/verifyYourPAN) `entity-pan-verification` | restricted | 200 | HTML, API | Proprietary |
| P2 | [RBI bank-wise IFSC and MICR lists](https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=2009) `entity-rbi-ifsc-lists` | open | 200 | XLSX, HTML | Unknown (RBI website terms) |
| P2 | [Udyam Registration Number verification](https://udyamregistration.gov.in/Udyam_Verify.aspx) `entity-udyam-verify` | captcha | 200 | HTML | Unknown |
| P2 | [NSE event calendar, board meeting and announcement APIs](https://www.nseindia.com/api/event-calendar) `nse-corporate-events-api` | open | 200 | JSON, API | Proprietary - exchange website terms of use |
| P2 | [Registrars of Companies (RoC)-wise Company Master Data (resource 4dbe5667-7b6b-41d7-82af-211562424d9a)](https://www.data.gov.in/resource/registrars-companies-roc-wise-company-master-data) `ogd-mca-company-master` | geo-blocked | 503 | JSON, CSV, XML, API | GODL-India |

- **GLEIF LEI Records API** (`entity-gleif-lei-api`, P1) - Global Legal Entity Identifier Foundation (GLEIF). Updates: continuous; golden copy refreshed three times a day.
  - Gives us: LEI renewal is itself a recurring deadline (RBI requires LEIs for some borrowers and for large-value RTGS/NEFT payments by entities, and an LEI lapses unless renewed yearly). A user can enter a CIN or LEI and get registration.nextRenewalDate as a reminder; it also gives a free CIN-to-name check.
  - Ingestion: Client-side fetch from the static site (CORS *) for on-demand lookups: GET /api/v1/lei-records?filter[entity.registeredAs]=<CIN> or /api/v1/lei-records/<LEI>; no server needed. Respect GLEIF fair-use limits.
  - Observed: 402,547 LEI records with legal address country IN (meta.pagination.total, golden copy 2026-10-14 08:00 UTC). Indian records carry registeredAt RA000394 (MCA Companies Register) with the 21-character CIN in registeredAs, or RA000754 (GST Portal) with a GSTIN for proprietorships; lookup by CIN works (filter[entity.registeredAs]=L85110KA1981PLC013115 returns Infosys with next renewal 2027-07-20). No key needed, CORS allows any origin. Square brackets must be URL-encoded for curl.
- **NSE securities available for trading (EQUITY_L.csv) and NSE Emerge SME list** (`entity-nse-equity-list`, P1) - National Stock Exchange of India Ltd. Updates: daily (Last-Modified 2026-10-14).
  - Gives us: Identify listed companies so SEBI LODR deadlines apply (quarterly results within 45 days, shareholding pattern within 21 days of quarter end, and so on); powers a 'listed company' search or toggle.
  - Ingestion: Weekly GitHub Action: GET both CSVs, trim header whitespace, store symbol, ISIN, name and listing date as JSON; fail soft and keep the previous file if a fetch times out.
  - Observed: Plain CSV through Akamai, no cookies or extra headers needed: 2,605 rows (SYMBOL, NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE). The SME list at /emerge/corporates/content/SME_EQUITY_L.csv has 580 rows. check-host nodes in the US got 200, but the Germany and Mumbai nodes timed out, so keep the last good copy.
- **BSE list of scrips (ListofScripData API)** (`entity-bse-scrip-list`, P2) - BSE Ltd. Updates: daily.
  - Gives us: Adds BSE-only listed companies to the listed-company search.
  - Ingestion: Weekly fetch with browser-like headers; fragile under Akamai bot management, so keep the last good copy and alert on failure. Use the NSE list first.
  - Observed: The probe (browser user agent only) got Akamai 'Access Denied' (403). The same URL returned 200 JSON with 5,111 active equity scrips (SCRIP_CD, Scrip_Name, Issuer_Name, ISIN_NUMBER, GROUP, FACE_VALUE, Mktcap) when sent with Referer and Origin https://www.bseindia.com plus Chrome sec-fetch and sec-ch-ua headers; another api.bseindia.com endpoint stayed 403 even then.
- **GLEIF Golden Copy and delta files** (`entity-gleif-golden-copy`, P2) - Global Legal Entity Identifier Foundation (GLEIF). Updates: three publishes a day (00:00, 08:00, 16:00 UTC) plus intraday deltas.
  - Gives us: Bulk route to an India-only LEI index (about 0.4 M rows) for offline search of renewal dates without per-user API calls.
  - Ingestion: Weekly GitHub Action: stream the full CSV zip, keep rows with legal address country IN, write a slim CSV (LEI, name, registeredAs, status, next renewal date) as a release asset rather than committing it.
  - Observed: Latest publish 2026-10-14 16:00 UTC: LEI2 full CSV with 3,462,035 records worldwide (481 MB zipped), plus relationship and reporting-exception files and delta files. GLEIF's terms state the data is provided under CC0 1.0.
- **GST portal Search Taxpayer (GSTIN lookup)** (`entity-gstin-search`, P2) - Goods and Services Tax Network (GSTN). Updates: live.
  - Gives us: Could reveal a taxpayer's filing frequency (monthly or QRMP) and status to pick GSTR-1 and GSTR-3B dates, but cannot be automated from a static site.
  - Ingestion: Do not scrape. Let users choose monthly or QRMP and their state.
  - Observed: Reachable from outside India (also from check-host nodes in the US, Germany and India), but the page is an Angular shell and at times an F5 BIG-IP bot-defence JavaScript challenge ('Please enable JavaScript... support ID'). The lookup itself (POST /services/api/search/taxpayerDetails) needs a solved image CAPTCHA; a bare GET returns 405. Official machine access is the GSTN Tax Payer API on API Setu (partner credentials) or licensed GST Suvidha Providers.
- **Legal Entity Identifier India Ltd (LEIL) - LEI issuer for India** (`entity-leil-india`, P2) - LEIL, a subsidiary of The Clearing Corporation of India Ltd (CCIL). Updates: daily full files (file timestamps between 13:00 and 14:30 server time).
  - Gives us: Same use as GLEIF but limited to LEIs managed by LEIL; GLEIF is the simpler single source.
  - Ingestion: Prefer GLEIF; use LEIL files only as a cross-check.
  - Observed: Website is a React shell, but its public JSON endpoints answer from outside India (also from check-host nodes in the US, Germany and India): /api/public/cds-files-download lists the last eight daily full files (for 2026-10-14: LEIL-CDF2-Full-20261014_142339.zip of 25.6 MB plus relationship and reporting-exception files) and /api/public/datamatrix/get-count reports 147,844 legal entities. /api/public/download-cds-file/<name> returned about 36 MB of JSON (a base64-wrapped zip) and ignores Range requests.
- **MCA21 V3 company/LLP master data and monthly incorporation lists** (`entity-mca-master-data`, P2) - Ministry of Corporate Affairs. Updates: live register; incorporated and closed company/LLP lists monthly.
  - Gives us: Best source for company/LLP status and incorporation dates (AGM, AOC-4, MGT-7, LLP Form 8 and Form 11 timelines), but not reachable or automatable from outside India.
  - Ingestion: None from runners. Ask users for entity type and incorporation date; optionally pre-fill the name from GLEIF (CIN in registeredAs).
  - Observed: Akamai 'Access Denied' for every mca.gov.in path tried, including Data and Reports > incorporated/closed during the month; check-host.net nodes in the US, UK, Germany and Singapore also got 403 (the Mumbai node failed DNS, inconclusive). The Internet Archive has logged 403 for the master-data page since October 2025; its September 2025 copy shows the company/LLP lookup behind a CAPTCHA modal.
- **OpenCorporates - India jurisdiction** (`entity-opencorporates-india`, P2) - OpenCorporates Ltd. Updates: Unknown for India (sourced from MCA records).
  - Gives us: Possible fallback for company status lookups, but share-alike licensing and key handling make it a poor fit for a static open-source site.
  - Ingestion: Not for v1. If ever used: apply for a public-benefit key, query /companies/in/<CIN> on demand from a backend, show OpenCorporates attribution.
  - Observed: Catalogue URL re-probed at build: GET 200; text/html; 5 KB transferred; HTML, 1539 chars of visible text. Earlier check by the survey (status 401, may refer to a related endpoint): API v0.4 (/companies/search?jurisdiction_code=in and /jurisdictions/in) returns 401 'Invalid Api Token' without a token. The website reports 2,715,214 Indian companies; browsing the jurisdiction needs a login and some fields (incorporation date) are hidden from logged-out users, while a company page by CIN loads (200).
- **PAN verification channels (e-Filing 'Verify Your PAN', Protean online PAN verification, API Setu PAN APIs)** (`entity-pan-verification`, P2) - Income Tax Department; Protean eGov Technologies. Updates: live.
  - Gives us: None as a lookup. A PAN's format can be checked locally, and its 4th character (P individual, C company, F firm, H HUF, and so on) can pick the right deadline set without any external call.
  - Ingestion: None. Local format validation only.
  - Observed: The e-Filing portal shell loads from outside India (JavaScript required); its Verify Your PAN flow needs PAN, name, date of birth and a mobile OTP. Protean's online PAN verification is a paid service for registered entities (the old product URL now redirects to the tinpan.proteantech.in React app). API Setu lists an Organization PAN Verification API that needs partner onboarding. There is no open PAN dataset.
- **RBI bank-wise IFSC and MICR lists** (`entity-rbi-ifsc-lists`, P2) - Reserve Bank of India. Updates: periodic; consolidated NEFT list 68774.xlsx Last-Modified 2026-10-07.
  - Gives us: None beyond bank reference; prefer Razorpay's packaged copy.
  - Ingestion: Do not poll; if needed, one slow fetch per month of 68774.xlsx with backoff, or simply consume razorpay/ifsc releases.
  - Observed: Listing page loads (also from check-host nodes in the US, Germany and India) with 235 bank-wise XLSX links on rbidocs.rbi.org.in. During a burst of manual requests rbidocs answered with an F5 image-CAPTCHA page ('What code is in the image?') instead of the XLSX; a later single request returned the consolidated 68774.xlsx (17 MB, about 91,800 rows).
- **Udyam Registration Number verification** (`entity-udyam-verify`, P2) - Ministry of Micro, Small and Medium Enterprises. Updates: live.
  - Gives us: A supplier's MSME status matters for the 45-day payment rule and the half-yearly MSME-1 return, but verification stays manual.
  - Ingestion: None (CAPTCHA). Link out for users.
  - Observed: Without a session the verify URL redirects to Default.aspx (what the probe recorded); with the session cookie and a Referer it serves an ASP.NET form with the Udyam number field and an image CAPTCHA. Reachable from outside India and from check-host nodes in the US, Germany and India. API Setu only offers the Udyam certificate as a consent-based DigiLocker pull.
- **NSE event calendar, board meeting and announcement APIs** (`nse-corporate-events-api`, P2) - National Stock Exchange of India. Updates: daily.
  - Gives us: Optional per-company results and board-meeting dates for a listed-company view; not statutory due dates.
  - Ingestion: Only if a per-company view is built: GET daily /api/event-calendar, /api/corporate-board-meetings?index=equities and /api/corporate-announcements?index=equities; respect exchange terms.
  - Observed: GET 200; application/json; 10 KB transferred; JSON list of 346. event-calendar returned 346 upcoming events (results, dividends); corporate-board-meetings returned 20 recent intimations; corporate-announcements returned 20 items - all without cookies.
- **Registrars of Companies (RoC)-wise Company Master Data (resource 4dbe5667-7b6b-41d7-82af-211562424d9a)** (`ogd-mca-company-master`, P2) - Ministry of Corporate Affairs via OGD Platform India. Updates: portal frequency 'Monthly'; metadata changed 2025-11-14 and 2026-06-11 per archived portal JSON, but the resource note still says data up to 3 Nov 2023.
  - Gives us: Optional entity lookup: company class (private, public, OPC), status and incorporation date would select the right ROC filings (AOC-4, MGT-7/7A, DPT-3, MSME-1) and first-year AGM timing.
  - Ingestion: Not feasible from GitHub-hosted runners. If an India-based job exists: page through with a personal key (about 3.7 M rows), keep CIN, name, class, status, incorporation date and state as a compressed CSV, refresh quarterly. Otherwise ask users for company type.
  - Observed: Catalogue URL re-probed at build: GET 503; text/html; 282 B transferred; HTML, 216 chars of visible text. Earlier check by the survey (status 0, may refer to a related endpoint): Resource id confirmed from an archived copy of the portal backend JSON (March 2026: uuid 4dbe5667-7b6b-41d7-82af-211562424d9a, catalog 'Company Master Data' ec58dab7-d891-4abb-936e-d5d274a6ce9b, created 2015-09-15) and from several 2026 open-source projects, one reporting 3,674,314 rows and another an updated_date of 2026-07-22. One unified resource filterable by CompanyROCcode; fields include CIN, CompanyName, CompanyStatus, CompanyClass, CompanyCategory, AuthorizedCapital, PaidupCapital, CompanyRegistrationdate_date, Registered_Office_Address, Listingstatus, CompanyStateCode and nic_code; exact-match filters only. Two projects treat non-CIN identifiers in it as LLPs, so LLP rows may be included (unverified). API connect timeout from here; a sample-key call returned 200 from the check-host Mumbai node.

### Statistics and open government data (12)

Open government data and statistics. Context only - none of these carry due dates.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P1 | [GST portal statistics workbooks (registrations, GSTR-1 and GSTR-3B filing, state-wise collection, IGST settlement, e-way bills)](https://www.gst.gov.in/download/gststatistics) `ogd-gst-statistics` | open | 200 | XLSX, PDF, HTML | Unknown (government website; no explicit open licence) |
| P2 | [CBDT Direct Taxes Data (time series, collection updates, ITR and PAN statistics)](https://www.incometaxindia.gov.in/direct-taxes-data) `ogd-cbdt-direct-taxes-data` | restricted | 403 | PDF, HTML | Unknown |
| P2 | [Open Government Data (OGD) Platform India - catalog, search and backend JSON](https://www.data.gov.in/) `ogd-data-gov-in-portal` | restricted | 503 | HTML, JSON, CSV, XLSX | GODL-India |
| P2 | [State/UT-wise Direct Tax Collection 2022-23 (resource e3b6c58c-0292-4b1b-b39a-8388a0d4a35b)](https://www.data.gov.in/resource/stateut-wise-details-total-amount-direct-tax-collection-during-2022-23) `ogd-direct-tax-statewise` | geo-blocked | 503 | CSV, JSON, API | GODL-India |
| P2 | [Year-wise Members Registered under EPFO 2018-19 to 2022-23 (resource b42a6d71-554c-49ab-8495-7b08164d788c)](https://www.data.gov.in/resource/year-wise-number-members-registered-under-employees-provident-fund-organisation-epfo-2018) `ogd-epfo-members` | geo-blocked | 503 | CSV, JSON, API | GODL-India |
| P2 | [EPFO payroll data (monthly provisional payroll PDFs)](https://www.epfindia.gov.in/site_en/Estimate_of_Payroll.php) `ogd-epfo-payroll` | geo-blocked | 403 | PDF, HTML | Unknown |
| P2 | [MoSPI eSankhyiki portal, JSON API and MCP server](https://esankhyiki.mospi.gov.in/) `ogd-esankhyiki-api` | open | 200 | JSON, API, HTML | Unknown (MoSPI asks for attribution 'Source: MoSPI'; no explicit open licence found) |
| P2 | [State/UT-wise Gross GST Collection 2020-21 to 2024-25 (resource 5d0b81aa-d513-4dfd-9f57-84571829c049)](https://www.data.gov.in/resource/stateut-wise-details-gross-goods-and-service-tax-gst-collection-2020-21-2024-25) `ogd-gst-collection-statewise` | geo-blocked | 503 | CSV, JSON, API | GODL-India |
| P2 | [GST Council website - GST revenue page](https://gstcouncil.gov.in/gst-revenue) `ogd-gst-council` | open | 200 | HTML, PDF | Unknown |
| P2 | [NITI Aayog National Data and Analytics Platform (NDAP)](https://ndap.niti.gov.in/) `ogd-ndap` | login | 200 | JSON, CSV, XLSX, API | GODL-India (portal cites NDSAP and GODL; attribute the source ministry) |
| P2 | [RBI Database on Indian Economy (DBIE)](https://data.rbi.org.in/) `ogd-rbi-dbie` | open | 200 | HTML, XLSX, CSV | Unknown (RBI asks users to credit 'Database on Indian Economy, Reserve Bank of India') |
| P2 | [District-wise Total MSME Registered Enterprises under Udyam Registration (resource f8cd85a1-f9b8-4ff1-b195-9f75c10eb338)](https://www.data.gov.in/resource/district-wise-total-msme-registered-enterprises-under-udyam-registration-till-last-date) `ogd-udyam-district-msme` | geo-blocked | 503 | JSON, CSV, API | GODL-India |

- **GST portal statistics workbooks (registrations, GSTR-1 and GSTR-3B filing, state-wise collection, IGST settlement, e-way bills)** (`ogd-gst-statistics`, P1) - Goods and Services Tax Network (GSTN). Updates: monthly (page LAST_UPDATED_DATE 10-10-2026; 2026-27 workbooks Last-Modified 2026-09-30).
  - Gives us: Annotate GSTR-1 and GSTR-3B deadlines with real on-time filing rates by state and month; registration counts as context.
  - Ingestion: Monthly GitHub Action: build the current-FY filenames, GET the XLSX files, parse with openpyxl, emit small JSON (per month: eligible, on time, late); alert when a filename 404s because the naming pattern changed.
  - Observed: AngularJS page, but the download links are in the HTML and point to predictable files under https://tutorial.gst.gov.in/offlineutilities/gst_statistics/ (GSTR-3B-2026-2027.xlsx, GSTR-1-2026-2027.xlsx, statewise_GST_collection_2026-27.xlsx, Settlement-of-IGST-to-State-2026-2027.xlsx, ewb-data-2026-27.xlsx, Gross_Net_Tax_collection.xlsx, REGISTRATION.xlsx; one file per FY back to 2017-18). XLSX downloads returned 200 here and from check-host nodes in the US, Germany and India. The GSTR-3B sheet gives, per state, taxpayers eligible to file, filed by due date, filed after due date and total returns.
- **CBDT Direct Taxes Data (time series, collection updates, ITR and PAN statistics)** (`ogd-cbdt-direct-taxes-data`, P2) - Central Board of Direct Taxes, Income Tax Department. Updates: time series yearly (latest seen FY 2000-01 to 2024-25); collection updates roughly monthly; ITR and PAN statistics yearly.
  - Gives us: Background only (advance-tax collection snapshots around 15 June, 15 September, 15 December and 15 March).
  - Ingestion: Skip: PDF-only and unreliable from datacenter IPs.
  - Observed: Akamai 'Access Denied' (403) here for both the new Liferay URL /direct-taxes-data and the old /Pages/Direct-Taxes-Data.aspx (the apex host 302s to www). check-host.net: 200 from Los Angeles, Dallas, Vancouver and Singapore nodes but 403 from Germany and a Mumbai datacenter, so blocking follows IP reputation rather than country and GitHub runners may or may not pass. Content is PDFs only, for example /documents/d/guest/final-time-series-data-pdf and 'Direct Tax Collections for F.Y. 2026-27 as on ...' notes.
- **Open Government Data (OGD) Platform India - catalog, search and backend JSON** (`ogd-data-gov-in-portal`, P2) - National Informatics Centre (NIC), Ministry of Electronics and IT. Updates: varies per dataset; much of the catalog is one-off parliamentary-answer tables or years old.
  - Gives us: Dataset discovery only. No current central-government holiday list, bank holiday list, LLP master or EPFO payroll resource was found (checked the archived catalog index and public code that calls the API); the tax datasets found are one-off Rajya Sabha answer tables.
  - Ingestion: Not usable from GitHub-hosted runners. For one-off discovery from an Indian residential connection, the site's own JSON search is GET /backend/dmspublic/v1/search?query=<q>&filters[type]=resources&filters[domain_visibility]=4&limit=10&offset=0, and resource metadata is GET /backend/dms/v1/resource/<slug>?_format=json, whose uuid field is the API resource id.
  - Observed: Every path tried (home, /search?title=holiday, /Godl, resource pages, /backend/dmspublic/v1/search JSON) returned an Akamai 503 'Reference #102' error page from this Canadian host. check-host.net nodes got 503 from Los Angeles, Dallas and Singapore and 403 from Germany, London, New York and a Mumbai datacenter node, so the portal also refuses datacenter traffic inside India. TLS chain verifies. Internet Archive captures in 2025-2026 are a mix of 200 and 403.
- **State/UT-wise Direct Tax Collection 2022-23 (resource e3b6c58c-0292-4b1b-b39a-8388a0d4a35b)** (`ogd-direct-tax-statewise`, P2) - Ministry of Finance via OGD Platform India (Rajya Sabha Session 262, Unstarred Question 232, answered 5 Dec 2023). Updates: one-off; published 2024-08-27, metadata touched 2025-02-12.
  - Gives us: None.
  - Ingestion: Do not ingest.
  - Observed: Catalogue URL re-probed at build: GET 503; text/html; 282 B transferred; HTML, 216 chars of visible text. Earlier check by the survey (status 0, may refer to a related endpoint): Resource uuid (catalog c87f45f9-6597-41c5-8125-28c5abf93116) read from an archived resource page dated 2026-08-12; columns Sl. No., State/UT, Gross Collection, Refund, Net Collection. No maintained CBDT direct-tax time series exists on data.gov.in; CBDT's own PDFs are on incometaxindia.gov.in (see ogd-cbdt-direct-taxes-data). API connect timeout from here.
- **Year-wise Members Registered under EPFO 2018-19 to 2022-23 (resource b42a6d71-554c-49ab-8495-7b08164d788c)** (`ogd-epfo-members`, P2) - Ministry of Labour and Employment via OGD Platform India (Rajya Sabha Session 263, Unstarred Question 753, answered 8 Feb 2024). Updates: one-off; stale since April 2024.
  - Gives us: None.
  - Ingestion: Do not ingest.
  - Observed: Catalogue URL re-probed at build: GET 503; text/html; 282 B transferred; HTML, 216 chars of visible text. Earlier check by the survey (status 0, may refer to a related endpoint): Resource uuid read from an archived resource page (April 2024). No EPFO monthly payroll resource was found on data.gov.in; EPFO's payroll PDFs live on epfindia.gov.in (see ogd-epfo-payroll). API connect timeout from here.
- **EPFO payroll data (monthly provisional payroll PDFs)** (`ogd-epfo-payroll`, P2) - Employees' Provident Fund Organisation. Updates: monthly (files named site_docs/exmpted_est/Payroll_Data_EPFO_<Month>_<YYYY>.pdf; the archive shows releases through mid-2025).
  - Gives us: None directly; EPF due dates (ECR filing and payment by the 15th) come from the regulatory slice.
  - Ingestion: Skip; geo-blocked from runners and PDF-only.
  - Observed: epfindia.gov.in 301-redirects to www.epfo.gov.in, which serves a CloudFront 403 'Request blocked' page here, including for a direct payroll PDF; check-host.net nodes in the US, UK, Germany and Singapore also got 403, while the Mumbai node reached the origin (404 for this old page path, so the listing URL has changed). The Internet Archive fetched these PDFs with 200 in late 2025.
- **MoSPI eSankhyiki portal, JSON API and MCP server** (`ogd-esankhyiki-api`, P2) - Ministry of Statistics and Programme Implementation (MoSPI). Updates: release-driven: CPI and IIP monthly, PLFS monthly and quarterly, NAS quarterly.
  - Gives us: Optional context such as CPI release dates or index values; not a source of compliance due dates.
  - Ingestion: If used: monthly GET of specific indicator endpoints with an SSL context that sets OP_LEGACY_SERVER_CONNECT (or an OpenSSL config enabling UnsafeLegacyRenegotiation); cache JSON in the repo.
  - Observed: Unauthenticated JSON at https://api.mospi.gov.in/api (for example /cpi/getCpiBaseYear, /rbi/getRbiIndicatorList, /wpi/getWpiBaseYear) answered 200 here; the portal also publishes llms.txt, ai-catalog.json and an MCP server at https://mcp.mospi.gov.in (tools list_datasets, get_indicators, get_metadata, get_data). TLS trap: api.mospi.gov.in needs legacy TLS renegotiation, and OpenSSL 3 clients (Python here, and check-host nodes in the US, Germany and India) fail with 'unsafe legacy renegotiation disabled', so stock Ubuntu runners will fail; it worked with Python ssl.OP_LEGACY_SERVER_CONNECT. Windows Schannel curl was unaffected.
- **State/UT-wise Gross GST Collection 2020-21 to 2024-25 (resource 5d0b81aa-d513-4dfd-9f57-84571829c049)** (`ogd-gst-collection-statewise`, P2) - Ministry of Finance via OGD Platform India (Rajya Sabha Session 266, Unstarred Question 881, answered 3 Dec 2024). Updates: one-off; 2024-25 only up to October 2024; metadata dated 2025-04-15.
  - Gives us: None; the GST portal's monthly statistics workbooks (ogd-gst-statistics) are fresher and reachable.
  - Ingestion: Do not ingest; use ogd-gst-statistics.
  - Observed: Catalogue URL re-probed at build: GET 503; text/html; 282 B transferred; HTML, 216 chars of visible text. Earlier check by the survey (status 0, may refer to a related endpoint): Resource uuid read from an archived copy of the resource page (October 2025); catalog 'Answers Data of Rajya Sabha Questions Session 266' (78889f83-0f96-484b-9fbc-5be92454446f). API connect timeout from here; a sample-key call returned 200 from the check-host Mumbai node. Typical of GST data on data.gov.in: parliamentary-answer snapshots, not a maintained series.
- **GST Council website - GST revenue page** (`ogd-gst-council`, P2) - GST Council Secretariat. Updates: stale: linked revenue PDFs and newsletters were uploaded in February 2024 (latest revenue item September 2023).
  - Gives us: Not for statistics; the same site's Council meeting recommendations matter for the regulatory feed (other slice).
  - Ingestion: Skip for statistics; use ogd-gst-statistics.
  - Observed: Drupal site reachable from outside India; the revenue page links a handful of 2023 PDFs (a monthly revenue note, newsletters, early GST discussion papers). Not a live statistics source.
- **NITI Aayog National Data and Analytics Platform (NDAP)** (`ogd-ndap`, P2) - NITI Aayog. Updates: per dataset; 'Goods and Service Tax (GST) - Registration' (id 7103) shows LastUpdatedDate 2026-10-14, MCA 'Registration of New Companies' (id 3355) 2025-11-10.
  - Gives us: Background statistics only (GST registrations and returns, monthly company registrations); no due dates.
  - Ingestion: Optional: register, obtain an API key, POST /v1/openapi/getdetails per dataset id monthly. Not needed for v1.
  - Observed: React shell on CloudFront; backend https://loadqa.ndapapi.com. Anonymous GET /v1/search/catalogue?query=gst returned 78 results when sent with Origin and Referer https://ndap.niti.gov.in; without those headers it answers Message 'Invalid Request', which is what the probe recorded. Dataset detail and download calls (POST /v1/dataset/details, /v1/dataset/download) answer 'Token Required' (Cognito login), and the open API (/v1/openapi/getdetails) needs an API key from a registered account. Collections include GST Statistics (returns, registrations, collections, e-way bills) and the MCA Monthly Information Bulletin; nothing on holidays.
- **RBI Database on Indian Economy (DBIE)** (`ogd-rbi-dbie`, P2) - Reserve Bank of India. Updates: daily to annual depending on series.
  - Gives us: Low: reference rates or policy-rate history for context; RBI due dates come from RBI notifications (regulatory slice).
  - Ingestion: Not recommended; manual download of specific tables if ever needed.
  - Observed: Angular single-page app (8 KB shell, no content without JavaScript); data calls go to /CIMS_Gateway_DBIE/GATEWAY/SERVICES and related gateways with client-side crypto, and no documented public API was found. Reachable from outside India.
- **District-wise Total MSME Registered Enterprises under Udyam Registration (resource f8cd85a1-f9b8-4ff1-b195-9f75c10eb338)** (`ogd-udyam-district-msme`, P2) - Ministry of Micro, Small and Medium Enterprises via OGD Platform India. Updates: rolling cumulative counts; a third-party API response shows updated_date 2026-08-13.
  - Gives us: Context only (MSME density by district); adds no dates.
  - Ingestion: Skip for v1; if wanted later, a quarterly pull from an India-based job into a static CSV.
  - Observed: Catalogue URL re-probed at build: GET 503; text/html; 282 B transferred; HTML, 216 chars of visible text. Earlier check by the survey (status 0, may refer to a related endpoint): Resource id and the sibling services-only resource c3dfe7e6-0cfd-4ddb-8f79-9cb3695d9866 come from open-source projects that called the API in 2026 (788 rows: state_name, state_id, district_name, lg_dt_code as an LGD district code, micro, small, medium, total; catalog uuid 0536e86e-3751-4054-84e5-e257d4c94477). API connect timeout from here; a sample-key call returned 200 from the check-host Mumbai node.

### APIs (restricted, keyed or blocked) (4)

Programmatic interfaces that need registration, keys or an Indian network path.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P2 | [BSE JSON API (api.bseindia.com)](https://api.bseindia.com/BseIndiaAPI/api/Corpforthresults/w) `bse-json-api` | geo-blocked | 403 | JSON, API | Proprietary - exchange website terms of use |
| P2 | [e-Filing API specifications (ERI and third-party APIs)](https://www.incometax.gov.in/iec/foportal/api-specifications) `it-efiling-eri-api` | restricted | 200 | HTML, PDF, API | Unknown - GoI website |
| P2 | [API Setu - Government of India API directory](https://directory.apisetu.gov.in/) `ogd-api-setu-directory` | restricted | 200 | JSON, YAML, HTML, API | Proprietary (API Setu terms of use; OpenAPI specs are public) |
| P2 | [OGD Platform India REST API (api.data.gov.in)](https://api.data.gov.in/resource/{resource-id}?api-key={key}&format=json&limit=10) `ogd-data-gov-in-api` | geo-blocked | 0 | JSON, CSV, XML, API | GODL-India |

- **BSE JSON API (api.bseindia.com)** (`bse-json-api`, P2) - BSE Ltd. Updates: daily.
  - Gives us: Forthcoming results, announcements and other market data (if reachable).
  - Ingestion: Not usable from outside India; use the BSE RSS feeds and NSE APIs instead.
  - Observed: GET 403; text/html; 414 B transferred; block page: Access Denied; HTML, 334 chars of visible text. Akamai 403 'Access Denied' for Corpforthresults, AnnSubCategoryGetData and a guessed holiday endpoint, with and without Referer/Origin headers.
- **e-Filing API specifications (ERI and third-party APIs)** (`it-efiling-eri-api`, P2) - Income Tax Department - e-Filing portal. Updates: occasional.
  - Gives us: Documents the APIs open only to registered e-Return Intermediaries; explains why PAN-level data stays out of scope for a public static site.
  - Ingestion: Reference only - the APIs need ERI registration, client credentials and taxpayer consent.
  - Observed: GET 200; text/html; 28 KB transferred; HTML, 7248 chars of visible text. Public page listing the API specification documents.
- **API Setu - Government of India API directory** (`ogd-api-setu-directory`, P2) - National e-Governance Division (NeGD), Ministry of Electronics and IT. Updates: continuous (a GSTN registration-certificate collection was added 2026-09-21).
  - Gives us: Shows which official verification APIs exist; none can be called from a public static site.
  - Ingestion: No scheduled ingestion. A future backend would onboard as an API Setu consumer (organisation registration, per-API access approved by the publisher, client id and API key kept server-side).
  - Observed: Next.js directory; its search JSON (/api/list?q=<JSON>) works after fetching one-time headers from /api/auth/generate-headers. Compliance-relevant listings: GSTN Tax Payer Details API v1/v2 (GET /gstn/v2/taxpayers/{gstin}) and GST registration certificate (OTP flow); Income Tax Department Organization PAN Verification API (POST /verify/v1/pan/org) and Track PAN; MSME Udyam Certificate and EPFO UAN Card as DigiLocker document pulls that need the holder's consent. No MCA company-master, eCourts or CBDT statistics API is listed. Specs sit on cf-media.api-setu.in (gstn-v2.yaml: server https://apisetu.gov.in, headers X-APISETU-CLIENTID and X-APISETU-APIKEY).
- **OGD Platform India REST API (api.data.gov.in)** (`ogd-data-gov-in-api`, P2) - National Informatics Centre (NIC), Ministry of Electronics and IT. Updates: per resource.
  - Gives us: Indirect only: entity enrichment (MCA company master) and context statistics. Nothing date-critical depends on it.
  - Ingestion: Needs an India-hosted job or proxy: GET /resource/<id>?api-key=<personal key>&format=json&limit=1000&offset=N until offset >= total, tolerate empty pages mid-run (a reported quirk), and use exact-match keyword filters (filters[Field]=VALUE). Do not ship the shared sample key.
  - Observed: api.data.gov.in resolves to 164.100.61.198 (NIC) but TCP connects on 443 and 80 time out from this host; check-host.net nodes in the US, UK, Germany and Singapore got 'no route to host', 'connection refused' or timeouts. From the check-host Mumbai node the documented sample key 579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b returned HTTP 200, a bogus key 403 and no key 400, so the sample key is accepted from India. A made-up resource id also returned 200, so a 200 alone does not prove a resource exists. Open-source projects report the sample key caps responses at 10 records and is rate-limited (HTTP 429); personal keys need a data.gov.in account.

### Open-source projects and community datasets (24)

Community code and data on GitHub and package registries. Licence matters: GPL or unlicensed data is reference-only for an MIT-style static site.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P0 | [gstfeed - GST portal news and updates as an Atom feed](https://github.com/kskarthik/gstfeed) `gh-kskarthik-gstfeed` | open | 200 | Atom, JSON, TypeScript | GPL-3.0 |
| P0 | [egazette - Gazette of India and state gazette downloader (archive.org gazetteofindia collection)](https://github.com/sushant354/egazette) `gh-sushant354-egazette` | open | 200 | Python, JSON, RSS, PDF | Apache-2.0 |
| P0 | [holidays (python-holidays) - India, NSE and BSE calendars](https://github.com/vacanza/holidays) `gh-vacanza-holidays` | open | 200 | Python, JSON | MIT |
| P1 | [Compliance Grid - India regulatory source index and obligations graph](https://github.com/akshay93aditya/compliance-grid) `gh-akshay93aditya-compliance-grid` | open | 200 | YAML, JSONL, TypeScript | CC0-1.0 (data) AND MIT (code) |
| P1 | [CRMLeaf payroll-core rate tables - state professional tax slabs and payroll due dates](https://github.com/CrmLeaf/payroll-core) `gh-crmleaf-payroll-core` | open | 200 | JSON, PHP | MIT |
| P1 | [India Payroll (Frappe HR extension) - PT and LWF state tables](https://github.com/frappe/india-payroll) `gh-frappe-india-payroll` | open | 200 | Python | GPL-3.0 |
| P1 | [indian-compliance-calendar - SEBI LODR, MCA, LLP, tax and labour due-date rules](https://github.com/parinshahAIbuilder/indian-compliance-calendar) `gh-parinshahaibuilder-indian-compliance-calendar` | open | 200 | JavaScript, Markdown | MIT |
| P1 | [India Compliance (Frappe/ERPNext app) - GST and TDS reference data](https://github.com/resilient-tech/india-compliance) `gh-resilient-tech-india-compliance` | open | 200 | JSON, Python | GPL-3.0 |
| P1 | [pandas_market_calendars - NSE and BSE exchange calendars](https://github.com/rsheftel/pandas_market_calendars) `gh-rsheftel-pandas-market-calendars` | open | 200 | Python | MIT |
| P2 | [nsepython - unofficial NSE API wrapper](https://github.com/aeron7/nsepython) `gh-aeron7-nsepython` | open | 200 | Python | GPL-3.0 |
| P2 | [date-holidays (npm) - India data](https://github.com/commenthol/date-holidays) `gh-commenthol-date-holidays` | open | 200 | YAML, JavaScript | ISC AND CC-BY-SA-3.0 |
| P2 | [HolidayLens - official holiday reference sets and python-holidays audit tool](https://github.com/Drona-jadhav7/HolidayLens) `gh-drona-jadhav7-holidaylens` | open | 200 | CSV, Python | MIT |
| P2 | [Frappe HR (hrms) - India regional data](https://github.com/frappe/hrms) `gh-frappe-hrms` | open | 200 | JSON, Python | GPL-3.0 |
| P2 | [exchange_calendars - XBOM (BSE) calendar](https://github.com/gerrymanoim/exchange_calendars) `gh-gerrymanoim-exchange-calendars` | open | 200 | Python | Apache-2.0 |
| P2 | [jugaad-data - NSE/BSE data library (documents the NSE holiday API)](https://github.com/jugaad-py/jugaad-data) `gh-jugaad-py-jugaad-data` | open | 200 | Python, JSON | Unknown |
| P2 | [Indian Bank Holiday Calendar app data (RBI 2026 scrape and captured RBI XHR responses)](https://github.com/mahatosoftware/IndianBankHolidayCalendar) `gh-mahatosoftware-indianbankholidaycalendar` | open | 200 | JSON | None (no licence file - all rights reserved by default) |
| P2 | [india-merchant-data-api - RBI holiday matrix scraper](https://github.com/MohitGoyal09/india-merchant-data-api) `gh-mohitgoyal09-india-merchant-data-api` | open | 200 | Python | None (no licence file - all rights reserved by default) |
| P2 | [Nager.Date public holiday API](https://github.com/nager/Nager.Date) `gh-nager-nager-date` | open | 200 | JSON, C# | MIT |
| P2 | [peopleandlaws compliance-calendar-csv - state labour return calendars](https://github.com/peopleandlaws/compliance-calendar-csv) `gh-peopleandlaws-compliance-calendar-csv` | open | 200 | CSV | None (no licence file - all rights reserved by default) |
| P2 | [Razorpay IFSC dataset](https://github.com/razorpay/ifsc) `gh-razorpay-ifsc` | open | 200 | JSON, CSV | MIT |
| P2 | [gst-states - GST state code map](https://github.com/refrens/gst-states) `gh-refrens-gst-states` | open | 200 | JSON | MIT |
| P2 | [Stock Market Circulars living dataset (exchangecirculars.com)](https://github.com/rhnvrm/stock-market-circulars) `gh-rhnvrm-stock-market-circulars` | open | 200 | RSS, Markdown | None (no licence file - all rights reserved by default) |
| P2 | [nselib - NSE data library](https://github.com/RuchiTanmay/nselib) `gh-ruchitanmay-nselib` | open | 200 | Python | Apache-2.0 |
| P2 | [IKAPI - Indian Kanoon API client](https://github.com/sushant354/IKAPI) `gh-sushant354-ikapi` | api-key | 200 | Python, Java | MIT |

- **gstfeed - GST portal news and updates as an Atom feed** (`gh-kskarthik-gstfeed`, P0) - kskarthik. Updates: code last changed 2024-11-27, but the scheduled 'Refresh Feed' workflow is active and last succeeded 2026-10-14 (runs every 12 hours).
  - Gives us: GSTN portal news and advisories (returns, e-invoice, GSTR-9/9C enablement, due-date extension advisories) for the GST part of the regulatory-updates feed. Its main value is revealing the portal's JSON endpoint.
  - Ingestion: Poll the upstream GST portal JSON directly at build time every 6-12 hours, build links as https://www.gst.gov.in/newsandupdates/read/<id>, keep id/title/date/module and strip the HTML body. Use the GitHub Pages Atom feed only as a fallback: the GPL covers the script, and the feed depends on one maintainer's workflow staying enabled.
  - Observed: https://kskarthik.github.io/gstfeed/feed.xml 200 application/xml (41 KB, 20 entries, newest 2026-10-13, Last-Modified 2026-10-14, CORS *); upstream https://www.gst.gov.in/fomessage/newsupdates 200 application/json (33 KB, 20 items with id, title, module, content HTML, date DD/MM/YYYY, linkURl; CORS *); raw main.ts 200
- **egazette - Gazette of India and state gazette downloader (archive.org gazetteofindia collection)** (`gh-sushant354-egazette`, P0) - sushant354 (Sushant Sinha, Indian Kanoon). Updates: active - last push 2026-10-11 (34 stars); archive.org uploads are continuous, newest item uploaded 2026-10-14 23:57 UTC.
  - Gives us: Regulatory-updates feed straight from the Gazette: central extraordinary and weekly gazettes whose item metadata carries Ministry, Department, Subject, Office and Gazette ID, so items can be filtered to CBDT, CBIC, Ministry of Corporate Affairs, Ministry of Labour and Employment, etc. Also about 35 state gazettes, useful for state holiday, PT and LWF notifications.
  - Ingestion: Daily build job: query archive.org advancedsearch (q=collection:gazetteofindia AND identifier:in.gazette.central* plus a recent date range; fields identifier, title, date, description), parse Ministry/Department/Subject/Office out of the description HTML, link to the archive.org item and the egazette.gov.in source. Filter and sort on the gazette date, not publicdate, because old backfills are uploaded too (2019 items appeared in 2026-09). Store only metadata and links. We do not need to run egazette itself. NakliTechie/sansadsaar-gazettes (no license) publishes a derived daily JSON index of the same central corpus.
  - Observed: raw srcs/central.py 200 (18 KB); archive.org advancedsearch JSON 200 with CORS * (collection:gazetteofindia 866,902 items; identifier in.gazette.central* 212,640 items); collection RSS 200 (50 newest items, all 2026-10-14); a description:"Department of Revenue" filter returned 12,586 central items, newest a CBDT notice dated 2026-10-08 (Income-tax Form No. 161 amendment after Finance Act 2026) uploaded 2026-10-09
- **holidays (python-holidays) - India, NSE and BSE calendars** (`gh-vacanza-holidays`, P0) - vacanza. Updates: active - last push 2026-10-14; PyPI 0.106 released 2026-10-05, releases roughly every two weeks.
  - Gives us: Backbone for central and state public holidays: India module at holidays/countries/india.py covers all 36 states/UTs (codes AN..WB; TS for Telangana with TG alias, OD Odisha, UK Uttarakhand, DH for merged DNH and DD), categories PUBLIC, GOVERNMENT, OPTIONAL (restricted) and OPTIONAL_WOMEN (Himachal), from 1948, names in 11 languages. Also ships NSE (XNSE, holidays/financial/national_stock_exchange_of_india.py) and BSE (XBOM, subclass of NSE) trading-holiday calendars from 2001. ERPNext's Holiday List uses this package.
  - Ingestion: Build time in GitHub Actions: pip install a pinned holidays version, generate per-state JSON for the current and next year with explicit categories (the committed snapshot files merge all categories, so they cannot separate gazetted from restricted days). Raw or jsDelivr snapshot JSON is a zero-code fallback for prototyping. Label future lunar and Islamic dates as provisional until DoPT/state notifications confirm them (the library itself tags some as '(estimated)'). Caveats found: XNSE misses ad-hoc closures (2026-01-15 Maharashtra municipal election closure is absent, while the NSE API and pandas_market_calendars have it), XNSE omits weekend holidays, and India has no bank/NI Act category. Bump the pin on each release via Dependabot.
  - Observed: raw snapshots/countries/IN_COMMON.json 200 (119 KB, flat date-to-name map 1950-2050); IN_MH.json 200 (130 KB); snapshots/financial/XNSE.json and XBOM.json 200 (21 KB, 2001-2050); holidays/countries/india.py 200 (62 KB); jsDelivr mirror (also pinned @v0.106) 200 application/json with CORS *; PyPI JSON 200 (0.106, MIT, Python >=3.10)
- **Compliance Grid - India regulatory source index and obligations graph** (`gh-akshay93aditya-compliance-grid`, P1) - akshay93aditya. Updates: slow - v0.1.0 public release 2026-06-08 (last main commit), last push 2026-08-31 (6 stars).
  - Gives us: CC0 registry of 436 official source portals (159 central, the rest per state/UT) across tax, labour, legal, industry and other domains, with fetch-recipe and access-status notes; directly useful for building our state PT/LWF/labour and gazette source lists. The Karnataka seed shows one way to structure labour-code (OSH Rules 2021) obligations with deadline rules.
  - Ingestion: Vendor the sources/**/*.yaml index as the seed of our source registry (CC0, no attribution needed) and re-sync monthly. Treat the obligations as unverified: they carry machine-extraction confidence scores and cover only Karnataka labour rules.
  - Observed: raw sources/IN-AP/tax/apct-gov-in.yaml 200 (1 KB source card); seed/IN-KA/labour/obligations.jsonl 200 (150 KB, 163 Karnataka labour-code obligations with frequency, deadline_rule, penalty, source_refs, confidence); DATA-LICENSE.md 200 (CC0 for sources/ and seed/)
- **CRMLeaf payroll-core rate tables - state professional tax slabs and payroll due dates** (`gh-crmleaf-payroll-core`, P1) - CrmLeaf. Updates: recent - last commit 2026-08-13 (0 stars); sibling CrmLeaf/payroll-js pushed 2026-10-13.
  - Gives us: The only permissively licensed, machine-readable PT slab table found, with a versioned schema (effective_from/effective_to) worth copying for our own data. The due-date file is a usable seed for payroll obligations.
  - Ingestion: Seed, then verify: vendor a pinned copy with attribution (MIT) or fetch the raw JSON at build time. Caveats: compiled 'as at FY 2025-26' by a small vendor; the calendar still cites Income-tax Rules 1962 and the 1961 Act, so TDS and ITR rules must be re-based on the Income-tax Act 2025 for FY 2026-27; PT_PAY is a flat 20th for every state, which is wrong for several states; no coverage for some PT states such as Manipur, Mizoram and Nagaland.
  - Observed: raw resources/rates/professional-tax.json 200 (12 KB; 18 states, slabs in paise, frequency, special_month, gender_exemption, versioned effective_from 2025-04-01); resources/rates/compliance-calendar.json 200 (7 KB; 13 recurring obligations: PF_ECR, ESI_PAY, TDS_PAY, 24Q, Form 16, GSTR-1, GSTR-3B, PT_PAY, advance tax, ITR non-audit/audit, tax audit, LWF)
- **India Payroll (Frappe HR extension) - PT and LWF state tables** (`gh-frappe-india-payroll`, P1) - frappe. Updates: active - last push 2026-10-13 (24 stars).
  - Gives us: This is where Frappe keeps PT and LWF data (not frappe/hrms, not india-compliance). It tells us which states levy PT/LWF and the deduction frequency, which drives when PT/LWF items appear (for example June/December half-yearly LWF states, December-only annual states).
  - Ingestion: Reference only: GPL-3.0 with no separate data license, and the data is Python dicts. Use it to cross-check our own state PT/LWF table built from state notifications, and watch commits to these two files as a signal that a state changed rates. It holds amounts, not due dates; due-date rules still need state sources.
  - Observed: raw india_payroll/india_payroll/professional_tax.py 200 (14 KB; STATE_PT_CONFIG for 16 states with monthly, half-yearly or yearly slabs, February/March top-up months, Maharashtra women exemption, optional dated revisions); lwf.py 200 (4.5 KB; LWF_STATE_CONFIG for 16 states/UTs 'as of May 2026' with employee/employer amounts and monthly, half-yearly or annual frequency)
- **indian-compliance-calendar - SEBI LODR, MCA, LLP, tax and labour due-date rules** (`gh-parinshahaibuilder-indian-compliance-calendar`, P1) - parinshahAIbuilder. Updates: active - last push 2026-10-05 (1 star, new project).
  - Gives us: Closest existing analogue to this product. Rules for SEBI LODR equity and debt (Reg 14, 24A, 27(2) and 13(3) integrated filing, 29, 30, 31, 34, 40(9), 44(3), BRSR, debt Regs 52/53/54/57), SEBI PIT/SAST/DP/ICDR, Companies Act forms (AOC-4, MGT-7, ADT-1, DIR-3 KYC, DPT-3, MSME-1, PAS-6, CSR-2, CRA-2/CRA-4, MBP-1, MGT-15, MR-3, AGM), LLP-8/LLP-11, and GSTR-1/3B/9, TDS payment and returns, advance tax, ITR, tax audit, PF/ESI. Its notes record that BSE APIs sit behind Akamai and started blocking non-browser clients in Oct 2026, and that NSE needs a session cookie.
  - Ingestion: Port the rule set into our own data format with attribution (MIT) and verify each rule against the cited regulation, starting with the verify:true items. It is code (JS functions), not a data file, so there is nothing to poll; watch the repo and re-diff master.js on new commits.
  - Observed: raw assets/app/lib/master.js 200 (34 KB; about 60 compliance templates with kind Q/H/A/M/E, regulation reference, timeline text, due-date functions, BSE auto-detect rules, 8 items flagged verify:true); references/data-sources.md 200 (7 KB, documents BSE/NSE/SEBI endpoints and blocking behaviour)
- **India Compliance (Frappe/ERPNext app) - GST and TDS reference data** (`gh-resilient-tech-india-compliance`, P1) - resilient-tech. Updates: active - last push 2026-10-14 (274 stars).
  - Gives us: Reference for TDS section labels under the new Act (old 194x sections to new 392/393 table entries with section codes) and for GST state codes; tds_details_old.json covers the 1961 Act. It ships no due-date or holiday data: GST returns are handled only through return-period keys (MMYYYY).
  - Ingestion: Reference only: GPL-3.0 with no separate data license, so do not copy the JSON into an MIT site. Cross-check our own TDS section table compiled from CBDT notifications against it, and use commits to tds_details.json as a change signal (repo commits Atom feed).
  - Observed: raw income_tax_india/data/tds_details.json 200 (67 KB, 127 TDS category rows keyed to Income-tax Act 2025 sections 392/393 with rates effective 2026-04-01 to 2027-03-31); gst_india/data/hsn_codes.json 200 (4.2 MB, 18,687 HSN/SAC rows); gst_india/constants/__init__.py 200 (45 KB: STATE_NUMBERS GST state codes, STATE_PINCODE_MAPPING, PORT_CODES, UOMs, GSTIN regexes); income_tax_india/constants/__init__.py 200 (OLD_TDS_SECTIONS and NEW_TDS_SECTIONS with 4-digit section codes from 1001)
- **pandas_market_calendars - NSE and BSE exchange calendars** (`gh-rsheftel-pandas-market-calendars`, P1) - rsheftel. Updates: active - last push 2026-10-05; PyPI 5.5.0 released 2026-10-05 (1.0k stars).
  - Gives us: Independent cross-check of NSE and BSE trading holidays, including ad-hoc closures (it has 2026-01-15, which vacanza lacks) and special sessions such as Muhurat trading.
  - Ingestion: Extract the date literals from holidays/nse.py and calendars/bse.py with a regex at build time (no import needed), diff against the NSE holiday-master API and alert on mismatch. No 2027 data yet; NSE usually publishes next year's list in December and maintainers add it afterwards.
  - Observed: raw pandas_market_calendars/holidays/nse.py 200 (18 KB, hardcoded NSE closed days 1996-2026); calendars/bse.py 200 (20 KB, BSE list with per-date comments such as 2026-01-15 Maharashtra Municipal Elections); PyPI JSON 200
- **nsepython - unofficial NSE API wrapper** (`gh-aeron7-nsepython`, P2) - aeron7. Updates: active - last push 2026-10-07; PyPI 2.101 on 2026-10-07 (370 stars).
  - Gives us: Endpoint documentation for NSE trading and clearing holidays; same data as jugaad-data.
  - Ingestion: Reference only (GPL-3.0). Call the NSE endpoint ourselves.
  - Observed: raw nsepython/rahu.py 200 (131 KB); nse_holidays() and holiday_master() call https://www.nseindia.com/api/holiday-master with type=trading or type=clearing, and its comments note that any other type returns an empty 200
- **date-holidays (npm) - India data** (`gh-commenthol-date-holidays`, P2) - commenthol. Updates: active - last push 2026-09-20; npm 3.37.0 published 2026-09-20 (1.1k stars).
  - Gives us: Very thin for India: 6 national fixed-date days (Republic Day, Ambedkar Jayanti, Good Friday, Independence Day, Gandhi Jayanti, Christmas) plus mostly fixed-date state days for 35 region codes. No Diwali, Holi, Eid or other lunar festivals; uses outdated codes (OR, UT, CT, separate DD/DN) and has no JH or LA.
  - Ingestion: Do not use as an India source. Share-alike data would push CC BY-SA terms onto any derived holiday dataset we publish, and the license metadata is inconsistent. Reference only.
  - Observed: raw data/countries/IN.yaml 200 (16.7 KB); LICENSE 200 (holiday data CC BY-SA 3.0 from Wikipedia, code ISC); npm registry JSON 200 (latest 3.37.0, license field '(ISC AND CC-BY-3.0)', which disagrees with the LICENSE file)
- **HolidayLens - official holiday reference sets and python-holidays audit tool** (`gh-drona-jadhav7-holidaylens`, P2) - Drona-jadhav7. Updates: active - last push 2026-10-06 (0 stars).
  - Gives us: Small hand-checked 2026 reference sets with per-row source URLs, plus a CLI that diffs official lists against python-holidays and reports MISSING/EXTRA days - a ready QA pattern for our holiday pipeline.
  - Ingestion: Do not ingest the data (one year, a handful of states). Reuse the approach or the MIT code to run a yearly diff between our generated holidays and official notifications.
  - Observed: raw data/official/IN/bank/2026.csv 200 (2 KB; date, name, category, source, citing RBI HolidayMatrixDisplay); data/official/IN/stock/2026.csv 200 (2 KB, citing the NSE holidays page); 2026 CSVs also exist for IN/AS, IN/MH, IN/MP, IN/UK
- **Frappe HR (hrms) - India regional data** (`gh-frappe-hrms`, P2) - frappe. Updates: active - last push 2026-10-14 (8.9k stars).
  - Gives us: Nothing direct. India data is limited to salary component names, a standard gratuity rule and an income-tax-slab doctype; PT and LWF slabs live in frappe/india-payroll. Holiday lists are user-maintained.
  - Ingestion: Skip; use frappe/india-payroll as the PT/LWF reference.
  - Observed: raw hrms/regional/india/data/salary_components.json 200 (1.2 KB, six salary components including a 'Professional Tax' placeholder; no slabs)
- **exchange_calendars - XBOM (BSE) calendar** (`gh-gerrymanoim-exchange-calendars`, P2) - gerrymanoim. Updates: active - last push 2026-10-12; PyPI 4.13.2 released 2026-03-10 (680 stars).
  - Gives us: A third opinion for BSE closures; there is no separate NSE calendar (XBOM only).
  - Ingestion: Optional regex extraction of the XBOM date list for a three-way diff with the NSE API and pandas_market_calendars. Low marginal value; the data is just dates.
  - Observed: raw exchange_calendars/exchange_calendar_xbom.py 200 (12.6 KB; precomputed BSE holiday list through 2026, includes 2026-01-15); PyPI JSON 200
- **jugaad-data - NSE/BSE data library (documents the NSE holiday API)** (`gh-jugaad-py-jugaad-data`, P2) - jugaad-py. Updates: active - last push 2026-10-06; PyPI 0.35.10 on 2026-10-06 (585 stars).
  - Gives us: Points to the official NSE trading and clearing holiday API, which is the primary source for NSE holidays. Fields: tradingDate (DD-Mon-YYYY), weekDay, description, morning_session, evening_session, Sr_no. The companion jugaad-py/master-data repo (holidays.csv) has been stale since 2020.
  - Ingestion: Do not depend on the library: its license is LICENSE.YOLO.md (PyPI says 'YOLO'), which is not an OSI license. Call the NSE endpoint directly at build time (not from the browser, because of CORS), keeping a cookie warm-up as fallback in case NSE starts rejecting cold requests. Re-fetch weekly and in mid-December for next year's list.
  - Observed: raw jugaad_data/nse/live.py 200 (15 KB) maps holiday_list to /api/holiday-master?type=trading on www.nseindia.com. That endpoint answered 200 application/json (34 KB; segments CBM, CD, CM, CMOT, COM, EGR, FO, IRD, MF, NDM, NTRP, SLBS; CM has 20 rows for 2026 including the 15-Jan election closure and weekend holidays) with a browser user agent and no cookie warm-up; type=clearing also 200 (24 KB). CORS is limited to nseindia.com.
- **Indian Bank Holiday Calendar app data (RBI 2026 scrape and captured RBI XHR responses)** (`gh-mahatosoftware-indianbankholidaycalendar`, P2) - mahatosoftware. Updates: recent - last push 2026-09-02.
  - Gives us: Cross-check for 2026 bank holidays per RBI regional office, and evidence that RBI's site has a JSON holiday API separating NI Act, RTGS and closing-of-accounts holidays.
  - Ingestion: Reference only (no license). Go to RBI directly: the legacy https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx answered 200 (136 KB HTML, ASP.NET postback form), while https://website.rbi.org.in/web/rbi/bank-holidays now redirects to the www.rbi.org.in home page, so the captured XHR paths need re-discovery.
  - Observed: raw assets/2026.json 200 (438 KB; 3,279 rows of state, region, date, holiday_name for 34 RBI regional offices, about 2,584 of them Sundays or 2nd/4th Saturdays). The repo also holds captured RBI XHR responses showing the RBI site's JSON shape: legends 'Holiday under Negotiable Instruments Act', the same 'and Real Time Gross Settlement Holiday', and 'Banks' Closing of Accounts Holiday'; 30 state/office entries; years 2001-2026.
- **india-merchant-data-api - RBI holiday matrix scraper** (`gh-mohitgoyal09-india-merchant-data-api`, P2) - MohitGoyal09. Updates: active - last push 2026-10-02 (new project).
  - Gives us: The best-documented approach found for scraping RBI bank holidays by regional office, including the NI Act vs RTGS distinction.
  - Ingestion: Reference only (no license). Re-implement the postback flow ourselves and refresh monthly, since RBI updates the matrix during the year.
  - Observed: raw src/imda/sources/rbi/holidays.py 200 (11.6 KB): ASP.NET postback scraper for https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx with matrix and office-list modes, marker parsing for NI Act vs RTGS-only days and completeness checks; tests include fixtures for 2026-03, 2026-04, 2026-10 and Mumbai 2026
- **Nager.Date public holiday API** (`gh-nager-nager-date`, P2) - nager. Updates: active - last push 2026-10-14 (1.4k stars).
  - Gives us: None - India is not supported.
  - Ingestion: Do not use. Listed so it is not proposed again; drop it from smoke and probe lists.
  - Observed: Catalogue URL re-probed at build: GET 200; text/html; 58 KB transferred; HTML, 38795 chars of visible text. Earlier check by the survey (status 204, may refer to a related endpoint): API /api/v3/PublicHolidays/2026/IN returned 204 No Content; /api/v3/AvailableCountries 200 lists 204 countries without IN; none of the 214 HolidayProviders is for India (raw src/Nager.Date/CountryCode.cs 200)
- **peopleandlaws compliance-calendar-csv - state labour return calendars** (`gh-peopleandlaws-compliance-calendar-csv`, P2) - peopleandlaws. Updates: stale - last push 2025-09-01.
  - Gives us: Month-by-month state labour filings per state: PT annual returns, LWF statements, ESI/EPF challans, shops and factories returns, ER-1/ER-2 employment exchange returns.
  - Ingestion: Cross-check only: there is no license file (all rights reserved by default), so do not copy. It cites pre-Labour-Code central Acts (Payment of Wages Act 1936, Minimum Wages Act 1948 and others) that the four Labour Codes replaced from 21 Nov 2025, so many rows are outdated. The companion peopleandlaws/minimum-wages-india repo (per-state wage CSVs) is also unlicensed.
  - Observed: raw shops/shops_karnataka.csv 200 (3 KB) and factories/factories_maharashtra.csv 200 (3 KB); 74 CSVs (factories and shops for 37 states/UTs) with columns State, Business, Laws, Jan..Dec holding free-text cells such as 'Annual return by 30-May'
- **Razorpay IFSC dataset** (`gh-razorpay-ifsc`, P2) - razorpay. Updates: active - release v2.0.62 on 2026-09-01, last push 2026-10-04 (395 stars).
  - Gives us: Tangential. The bank master (names, codes, NEFT/RTGS/IMPS/UPI flags) could label bank-holiday content, but a due-date calendar does not need branch data.
  - Ingestion: Not needed for v1. If wanted, pull banks.json from the latest release monthly; the README states the code is MIT and the dataset itself is public domain.
  - Observed: raw src/banks.json 200 (299 KB); release asset IFSC.json 200 application/octet-stream (1.09 MB); IFSC.csv is 36 MB in the release; hosted API https://ifsc.razorpay.com/<IFSC> 200 JSON
- **gst-states - GST state code map** (`gh-refrens-gst-states`, P2) - refrens. Updates: active - last push 2026-10-06 (2 stars).
  - Gives us: GST state code to name mapping, needed to place states in the two QRMP GSTR-3B groups (22nd vs 24th) and to label state-specific items.
  - Ingestion: Vendor once with attribution (MIT) or hand-maintain; it is tiny and rarely changes. Cross-check against india-compliance STATE_NUMBERS (GPL, reference only).
  - Observed: raw index.json 200 (0.9 KB, 40 code-to-name pairs: 01 to 38 plus 97 and 99)
- **Stock Market Circulars living dataset (exchangecirculars.com)** (`gh-rhnvrm-stock-market-circulars`, P2) - rhnvrm. Updates: active - last push 2026-10-14; pipeline runs every 3 hours (11 stars).
  - Gives us: Aggregated NSE, BSE and SEBI circulars with categories for the regulatory-updates section, including BSE, which is hard to fetch directly now that BSE APIs block non-browser clients. Per-source and per-tag feeds exist (/circulars/{nse/bse/sebi}/feed.xml, /tags/{tag}/feed.xml).
  - Ingestion: Discovery and cross-check only: no license, and descriptions are AI-generated (Gemini). Keep only title, date, source and the official PDF/guid link, and prefer the official SEBI RSS and NSE RSS (nsearchives.nseindia.com/content/RSS/Circulars.xml answered 200 with 2026-10-14 items). Filter out SEBI enforcement items, which include individuals' PAN details.
  - Observed: https://exchangecirculars.com/feed.xml 200 application/rss+xml (152 KB, 50 items, newest 2026-10-14) and /circulars/sebi/feed.xml 200 (158 KB); items carry source, category, impact and the official pdfUrl; raw hugo-site/content/circulars/sebi/2026/*.md 200 with YAML frontmatter (date, pdf_url, guid on sebi.gov.in)
- **nselib - NSE data library** (`gh-ruchitanmay-nselib`, P2) - RuchiTanmay. Updates: active - last push 2026-07-18; PyPI 2.5.1 on 2026-05-01 (181 stars).
  - Gives us: Permissively licensed reference implementation of the NSE holiday fetch with cookie handling.
  - Ingestion: If cookie handling becomes necessary, adapt its short session pattern (Apache-2.0, keep the notice); otherwise reference only. Other wrappers using the same endpoint: BennyThadikaran/NseIndiaApi (GPL-3.0, ships a sample holidays.json), hi-imcodeman/stock-nse-india (MIT, npm 1.4.0), bshada/nse-bse-api (MIT, npm).
  - Observed: raw nselib/libutil.py 200 (8 KB): trading_holiday_calendar() does a cookie warm-up GET on nseindia.com, fetches holiday-master?type=trading and flattens the per-segment lists into rows (Product, tradingDate, weekDay, description, Sr_no)
- **IKAPI - Indian Kanoon API client** (`gh-sushant354-ikapi`, P2) - sushant354. Updates: recent - last push 2026-07-02 (4 stars).
  - Gives us: Marginal: search judgments and orders that mention a provision. Not needed for due dates or holidays.
  - Ingestion: Skip for v1. Indian Kanoon's API is token-based and metered, and its terms would need review before showing results on a public site.
  - Observed: raw python/ikapi.py 200 (21 KB). A GET to api.indiankanoon.org/search without a token returned 502 (Cloudflare bad gateway); the API expects POST with an API token.

### Reference and peer sites (reference only, never copy) (45)

Commercial and professional sites useful as human cross-checks or tip-offs. Their text and calendars must not be copied.

| Pri | Source | Access | HTTP | Format | Licence |
|---|---|---|---|---|---|
| P0 | [Haryana Labour Welfare Board (Labour Department portal)](https://hrylabour.gov.in/) `state-lwf-hr` | geo-blocked | 0 | HTML, PDF | Unknown |
| P0 | [Tamil Nadu Labour Welfare Board](https://lwb.tn.gov.in/) `state-lwf-tn` | geo-blocked | 0 | HTML, PDF | Unknown |
| P0 | [Gujarat Profession Tax - Surat Municipal Corporation PT department](https://www.suratmunicipal.gov.in/Departments/ProfessionalTaxHome) `state-pt-gj` | open | 200 | HTML | Unknown |
| P0 | [Maharashtra Profession Tax (MahaGST)](https://www.mahagst.gov.in/en/profession-tax-and-other-rate-schedule) `state-pt-mh` | geo-blocked | 0 | HTML, PDF | Unknown |
| P0 | [Telangana Commercial Taxes - Profession Tax schedule and GOs](https://www.tgct.gov.in/tgportal/AllActs/APPT/APPTSchedule.aspx) `state-pt-tg` | open | 200 | HTML, PDF | Unknown |
| P0 | [West Bengal Profession Tax portal](https://professiontax.wb.gov.in/) `state-pt-wb` | geo-blocked | 0 | HTML | Unknown |
| P1 | [CorpLawUpdates.in RSS feed](https://www.corplawupdates.in/api/feed.xml) `corplawupdates-feed` | open | 200 | RSS, HTML | Proprietary - terms forbid automated bulk scraping |
| P1 | [Andhra Pradesh Labour Welfare Board](https://aplabourwelfareboard.ap.gov.in/) `state-lwf-ap` | geo-blocked | 0 | HTML, PDF | Unknown |
| P1 | [Delhi Labour Welfare Board](https://dlwb.delhi.gov.in/) `state-lwf-dl` | geo-blocked | 0 | HTML, PDF | Unknown |
| P1 | [Gujarat Labour Welfare Board](https://glwb.gujarat.gov.in/index.htm) `state-lwf-gj` | geo-blocked | 0 | HTML | Unknown |
| P1 | [Kerala Labour Welfare Fund Board](https://labourwelfarefund.in/) `state-lwf-kl` | open | 200 | HTML, PDF | Unknown |
| P1 | [Madhya Pradesh Shram Kalyan Mandal (Labour Welfare Board)](https://shramkalyanmandal.mp.gov.in/SKM/) `state-lwf-mp` | open | 200 | HTML | Unknown |
| P1 | [West Bengal Labour Welfare Board (Labour Department portal)](https://labour.wb.gov.in/welfare_board/) `state-lwf-wb` | geo-blocked | 0 | HTML, PDF | Unknown |
| P1 | [Andhra Pradesh Commercial Taxes portal - Profession Tax](https://apct.gov.in/apportal/) `state-pt-ap` | geo-blocked | 0 | HTML, PDF | Unknown |
| P1 | [Assam Commissionerate of Taxes - Professional Tax](https://comtax.assam.gov.in/information-and-services/assam-professional-tax) `state-pt-as` | open | 200 | HTML, PDF | Unknown |
| P1 | [Bihar Commercial Taxes Department portal - Professional Tax](https://www.biharcommercialtax.gov.in/bweb/) `state-pt-br` | open | 0 | HTML, PDF | Unknown |
| P1 | [Kerala LSGD Profession Tax portal](https://professiontax.lsgkerala.gov.in/) `state-pt-kl` | open | 0 | HTML | Unknown |
| P1 | [Punjab State Development Tax (Excise and Taxation Department)](https://taxation.punjab.gov.in/) `state-pt-pb` | geo-blocked | 0 | HTML, PDF | Unknown |
| P2 | [CAclubindia RSS feed](https://www.caclubindia.com/rss.xml) `caclubindia-feed` | open | 200 | RSS | Proprietary |
| P2 | [Legacy CBIC GST site (cbic-gst.gov.in)](https://cbic-gst.gov.in/) `cbic-gst-legacy` | open | 200 | HTML, PDF | Unknown - GoI website |
| P2 | [CBIC main website (cbic.gov.in)](https://www.cbic.gov.in/) `cbic-website` | open | 200 | HTML | Unknown - GoI website |
| P2 | [ClearTax income tax calendar](https://cleartax.in/s/income-tax-calendar) `cleartax-calendar` | open | 200 | HTML | Proprietary |
| P2 | [CPCB EPR portals (plastic packaging, battery, e-waste)](https://eprplastic.cpcb.gov.in/) `cpcb-epr-portals` | login | 200 | HTML | Unknown - GoI website |
| P2 | [Department of Revenue website](https://dor.gov.in/) `dor` | open | 200 | HTML, PDF | Unknown - GoI website |
| P2 | [Ministry of Finance website](https://www.finmin.gov.in/) `finmin` | geo-blocked | 0 | HTML | Unknown - GoI website |
| P2 | [FSSAI website and FoSCoS](https://www.fssai.gov.in/) `fssai` | open | 200 | HTML | Unknown - GoI website |
| P2 | [GST e-invoice portal (IRP)](https://einvoice1.gst.gov.in/) `gst-einvoice-portal` | geo-blocked | 0 | HTML | Unknown - GoI website |
| P2 | [GST e-way bill portal](https://ewaybillgst.gov.in/) `gst-ewaybill-portal` | geo-blocked | 0 | HTML | Unknown - GoI website |
| P2 | [GST user manuals and tutorials (tutorial.gst.gov.in)](https://tutorial.gst.gov.in/) `gst-tutorial` | open | 200 | HTML, PDF | Unknown - GoI website |
| P2 | [ICAI announcements](https://www.icai.org/category/announcements) `icai` | open | 200 | HTML, PDF | Proprietary |
| P2 | [ICEGATE advisories](https://www.icegate.gov.in/) `icegate` | open | 200 | HTML, PDF | Unknown - GoI website |
| P2 | [ICSI website and latest-updates API](https://www.icsi.edu/api/home/latest-updates/) `icsi` | open | 200 | JSON, HTML, PDF | Proprietary |
| P2 | [Government Open Data License - India (GODL-India)](https://www.data.gov.in/Godl) `ogd-godl-india-license` | restricted | 503 | HTML, PDF | GODL-India |
| P2 | [Protean (formerly NSDL e-Gov) TIN and PAN services](https://www.protean-tinpan.com/) `protean-tin-pan` | open | 200 | HTML | Proprietary |
| P2 | [PRS Legislative Research bill tracker](https://prsindia.org/billtrack) `prs-billtrack` | open | 200 | HTML, PDF | Unknown - PRS terms |
| P2 | [RBI FIRMS portal (FEMA reporting forms)](https://firms.rbi.org.in/) `rbi-firms-portal` | geo-blocked | 0 | HTML | Unknown - RBI website terms |
| P2 | [Shram Suvidha portal (unified labour returns)](https://shramsuvidha.gov.in/) `shram-suvidha` | geo-blocked | 0 | HTML | Unknown - GoI website |
| P2 | [Chhattisgarh Shram Kalyan Mandal (Labour Department portal)](https://shramevjayate.cg.gov.in/shramik/Lwb/) `state-lwf-cg` | open | 200 | HTML | Unknown |
| P2 | [Chandigarh Labour Department - Deposit of Labour Welfare Fund](https://labour.chd.gov.in/PublicPages/deposit-of-labour-welfare-fund.aspx) `state-lwf-ch` | geo-blocked | 0 | HTML | Unknown |
| P2 | [Mizoram Taxation Department - downloads (PT Act and slabs)](https://zotax.nic.in/download.html) `state-pt-mz` | open | 200 | HTML, PDF | Unknown |
| P2 | [Nagaland Department of Taxes - Professional Tax](https://nagalandtax.nic.in/) `state-pt-nl` | open | 200 | HTML, PDF | Unknown |
| P2 | [Sikkim Commercial Taxes - Professional Tax](https://sikkimtax.gov.in/) `state-pt-sk` | geo-blocked | 0 | HTML, PDF | Unknown |
| P2 | [TaxGuru RSS feed](https://taxguru.in/feed/) `taxguru-feed` | open | 200 | RSS | Proprietary |
| P2 | [Taxmann](https://www.taxmann.com/) `taxmann` | login | 200 | HTML | Proprietary |
| P2 | [TRACES (TDS CPC portal)](https://www.tdscpc.gov.in/app/login.xhtml) `traces-tdscpc` | login | 200 | HTML | Unknown - GoI website |

- **Haryana Labour Welfare Board (Labour Department portal)** (`state-lwf-hr`, P0) - Haryana Labour Welfare Board, Labour Department, Government of Haryana. Updates: on notification.
  - Gives us: Haryana LWF contribution rate and deposit dates, with Act and Rules citations.
  - Ingestion: Manual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. Wayback shows HLWB pages (hlwbmedia, welfare media, employer pamphlet, FAQ material) and the Punjab Labour Welfare Fund Act 1965 and Rules as applied to Haryana under staticdocs.
- **Tamil Nadu Labour Welfare Board** (`state-lwf-tn`, P0) - Tamil Nadu Labour Welfare Board, Government of Tamil Nadu. Updates: on GO.
  - Gives us: Tamil Nadu LWF annual contribution date and rates, with Act and Rules citations.
  - Ingestion: Manual annual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. Wayback shows the Tamil Nadu Labour Welfare Fund Act 1972 and Rules 1973 PDFs, contribution Forms A, B and C, and GOs (e.g. GO_Ms_13_G2_2022, Gazette_538); the contact form uses a captcha.
- **Gujarat Profession Tax - Surat Municipal Corporation PT department** (`state-pt-gj`, P0) - Surat Municipal Corporation (designated PT authority under the Gujarat PT Act). Updates: rarely (newest notification listed is from 2013).
  - Gives us: Gujarat PT rate notifications and the local-body collection model (corporations as designated authorities); any post-2013 slab change must be confirmed from the state gazette.
  - Ingestion: Weekly fetch and hash of the SMC page with manual review on change; the state CT portal needs the missing intermediate certificate added to the runner trust store.
  - Observed: HTTP 200 (14.5 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. Lists the Gujarat Finance Department PT notifications: 2008 implementation of the amended Act, appointment of designated authorities, 2008 rate notifications, and the 2013 revised employee rate; plus a PT FAQ page and RC/EC enrolment services. The state portal commercialtax.gujarat.gov.in/vatwebsite (PT registration guidelines, PT dashboard) timed out intermittently from Toronto (200 on retry; 200 from Mumbai, Los Angeles and Nuremberg) and fails tlscheck (unable to get local issuer certificate). Ahmedabad (ahmedabadcity.gov.in) PT pages fail OpenSSL 3 with unsafe legacy renegotiation; Rajkot (rmc.gov.in, TLS ok) has PT forms.
- **Maharashtra Profession Tax (MahaGST)** (`state-pt-mh`, P0) - Maharashtra Goods and Services Tax Department, Government of Maharashtra. Updates: on notification; rate schedule revised through state Finance Acts (current PDF dated 01.04.2023).
  - Gives us: PT slab table for salaried employees, PTRC return periodicity per FY, late-fee rules and notified return-date extensions (trade circulars) for Maharashtra.
  - Ingestion: Not fetchable from GitHub-hosted runners or Indian datacenters. Manual review each April and on news of extensions (person in India or Wayback snapshots); record trade circular numbers as overrides.
  - Observed: TCP connect timeout from this machine (Toronto, CA) and from check-host Los Angeles and Nuremberg; check-host Mumbai got 'connection reset by peer' for www.mahagst.gov.in and mahagst.gov.in, so Indian datacenter IPs are refused too. tlscheck: CONNECT-FAIL timeout. Content seen only through Wayback captures (up to Apr 2026): PT section with Acts, Rules, Notifications (PT late-fee notifications, Rule 32 amendment, PT Amendment Act 2023), G.R.s, Rate Schedule (PDF 'PT Rate Schedule updated 01.04.2023'), Trade Circulars (e.g. 17T of 2025 extending VAT-CST-PT returns), Forms, and a yearly PTRC return-periodicity list. No RSS seen.
- **Telangana Commercial Taxes - Profession Tax schedule and GOs** (`state-pt-tg`, P0) - Commercial Taxes Department, Government of Telangana. Updates: on notification (latest PT GO listed: G.O. 30 dated 08-03-2021).
  - Gives us: Telangana PT slab table plus the GO list for change detection; Act and Rules pages for payment and return citations.
  - Ingestion: Automatable: weekly fetch of the Schedule and GOs pages, parse the HTML tables, alert on new GO rows or slab changes.
  - Observed: HTTP 200 (13 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3 (www.tgct.gov.in and tgct.gov.in). HTML First Schedule of the Telangana PT Act 1987 'as amended up to date' (salary up to Rs 15,000 nil; Rs 15,001-20,000 Rs 150 per month; above Rs 20,000 Rs 200 per month; then professions and trades). Sibling pages APPTAct.aspx, APPTRules.aspx, APPTForms.aspx and Gos_Notifications.aspx (HTML table: GO number, date, subject). PT e-services at ptax.tgct.gov.in. tsct.gov.in is NXDOMAIN; the tgct.gov.in root is a JS redirect to /tgportal. No RSS.
- **West Bengal Profession Tax portal** (`state-pt-wb`, P0) - Directorate of Commercial Taxes (Profession Tax), Finance Department, Government of West Bengal. Updates: Unknown (single-page app; notices irregular).
  - Gives us: Official home for WB PT payment and returns; the old site carried the rate schedule (w.e.f. 1-4-2014) and return-extension orders, so extensions should now appear here.
  - Ingestion: No automated path from outside India; manual review against WB gazette notifications. Automation would need an India-based runner with legacy TLS renegotiation enabled.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; from check-host Mumbai the TLS handshake fails with OpenSSL error 0A000152 (unsafe legacy renegotiation), so OpenSSL 3 clients fail even inside India. tlscheck: CONNECT-FAIL timeout. The long-standing domain wbprofessiontax.gov.in returned 301 to this host in Apr 2025 and is now NXDOMAIN at the .gov.in registry. The new site is a React SPA (Wayback has only shell pages: quick-pay, registration, GRN view, PTPC download). egov.wbcomtax.gov.in shows only an Oracle default page and also needs legacy renegotiation; wbcomtax.gov.in times out even from Mumbai.
- **CorpLawUpdates.in RSS feed** (`corplawupdates-feed`, P1) - CorpLawUpdates.in. Updates: daily.
  - Gives us: Peer tip-off for changes on sites we cannot reach (EPFO, MCA, ESIC) - e.g. the EPFO September 2026 ECR extension to 31 October.
  - Ingestion: Read headlines only as a tip-off, then verify on primary sources; never copy text; stay within its terms. The site also has /calendar (Compliance Calendar 2026-27), /updates, /category/<regulator> and /llms.txt.
  - Observed: GET 200; application/xml; 4 KB transferred; final URL https://www.corplawupdates.in/api/feed.xml; feed parses (rss), 20 items, newest 2026-10-14. Apex URL redirects to www; 20 items, newest 2026-10-14.
- **Andhra Pradesh Labour Welfare Board** (`state-lwf-ap`, P1) - Labour Welfare Board, Labour Department, Government of Andhra Pradesh. Updates: Unknown.
  - Gives us: Andhra Pradesh LWF annual contribution date and rates under the AP LWF Act 1987.
  - Ingestion: Manual annual review; not automatable from outside India.
  - Observed: TCP connect timeout from Toronto (tlscheck: network unreachable), Los Angeles and Nuremberg; check-host Mumbai got HTTP 302. tlscheck: CONNECT-FAIL. Wayback captures are from 2019 only (JSP pages for schemes, latest updates, a circular memo).
- **Delhi Labour Welfare Board** (`state-lwf-dl`, P1) - Delhi Labour Welfare Board, Labour Department, Government of NCT of Delhi. Updates: Unknown.
  - Gives us: Delhi LWF contribution rates and dates.
  - Ingestion: Manual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. IGOD-listed Drupal site; Wayback shows tenders and PDF uploads up to Sep 2024. labour.delhi.gov.in shows the same geo-block.
- **Gujarat Labour Welfare Board** (`state-lwf-gj`, P1) - Gujarat Labour Welfare Board, Labour, Skill Development and Employment Department. Updates: Unknown.
  - Gives us: Gujarat LWF half-yearly contribution dates and rates (else from the Gujarat LWF Act 1953 text).
  - Ingestion: Manual review; treat as unavailable for automation.
  - Observed: TCP connect timeout from Toronto (tlscheck: network unreachable) and Nuremberg. An earlier TCP check succeeded from Mumbai and Los Angeles, but HTTP checks of index.htm and / timed out from Mumbai, Los Angeles and Nuremberg on 2026-10-14, so the web server also looked unresponsive. Wayback holds little beyond the home page and a cycle-subsidy scheme page.
- **Kerala Labour Welfare Fund Board** (`state-lwf-kl`, P1) - Kerala Labour Welfare Fund Board, Government of Kerala. Updates: irregular (GO list ends 2020).
  - Gives us: Kerala LWF payment deadline (before 15 January) and the amendment GO for current rates.
  - Ingestion: Monthly fetch of the governmentorders table; manual reading of amendment PDFs (scans).
  - Observed: HTTP 200 (11 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. Pages: fund_act (full Act text in HTML), fund_rules, governmentorders (table; newest is the Kerala Labour Welfare Fund (Amendment) Ordinance 2020 dated 16-01-2020), faq, pay_online. The HTML Act still shows the old s.15 rates (Rs 4 employee and Rs 8 employer per half-year, both paid before 15 January), so it is not consolidated with the 2020 amendment that raised them.
- **Madhya Pradesh Shram Kalyan Mandal (Labour Welfare Board)** (`state-lwf-mp`, P1) - MP Shram Kalyan Mandal, Labour Department, Government of Madhya Pradesh. Updates: Unknown.
  - Gives us: Madhya Pradesh LWF half-yearly rates and the statutory citation.
  - Ingestion: Monthly headless-browser render of /SKM/contribution-info (or parse the JS bundle); manual review on change.
  - Observed: HTTP 200 but only an 860-byte JS shell (Vite/React SPA) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. The JS bundle holds the /contribution-info page: rates under s.9(2)(3) of the MP Shram Kalyan Nidhi Adhiniyam 1982 - employer Rs 50 per worker per half-year, employee Rs 10 per half-year, employer minimum Rs 2,500 per half-year - plus yearly collection totals. The API base /SKM/api needs a login token. A 'contribution before 2026' module hints at a 2026 process change; no due dates found.
- **West Bengal Labour Welfare Board (Labour Department portal)** (`state-lwf-wb`, P1) - West Bengal Labour Welfare Board, Labour Department, Government of West Bengal. Updates: Unknown.
  - Gives us: West Bengal LWF contribution dates and rates.
  - Ingestion: Manual review; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. The board's old domain wblwb.org still answers from Toronto, but its page now carries injected pharmaceutical spam text plus a JS redirect to this URL; do not cite wblwb.org. Wayback has no welfare_board pages.
- **Andhra Pradesh Commercial Taxes portal - Profession Tax** (`state-pt-ap`, P1) - Commercial Taxes Department, Government of Andhra Pradesh. Updates: on notification.
  - Gives us: Andhra Pradesh PT slab schedule and PT notifications (same 1987 Act lineage as Telangana).
  - Ingestion: Manual annual review (from India or via Wayback copies); not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. Wayback shows a PT schedule PDF (gstportal/GST_Portal/Help_docs/PT_Schedule.pdf, 2022), a PT user manual and an EODB PT note; older captures list PT GOs.
- **Assam Commissionerate of Taxes - Professional Tax** (`state-pt-as`, P1) - Commissionerate of Taxes, Finance Department, Government of Assam. Updates: occasional (page last updated 11-Sep-2026).
  - Gives us: Assam PT slab schedule and Act and Rules citations.
  - Ingestion: Automatable: weekly fetch and hash of the PT page and schedule PDF; manual review on change.
  - Observed: HTTP 200 (14 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. Standardized Website Framework page carrying the PT schedule PDF (dms72_profession_tax-schedule_1.pdf). The legacy portal tax.assam.gov.in (200, TLS ok) still serves AssamTimsInfo HTML pages for the Assam Professions, Trades, Callings and Employments Taxation Act 1947, its Rules, Schedule and Forms, plus a PT registration dashboard.
- **Bihar Commercial Taxes Department portal - Professional Tax** (`state-pt-br`, P1) - Commercial Taxes Department, Government of Bihar. Updates: on notification.
  - Gives us: Bihar PT payment and registration references and the notification list for rate or date changes.
  - Ingestion: Automatable only when DNS resolves on the runner; add retries and fall back to manual review.
  - Observed: DNS failure from this machine (curl rc 6) and SERVFAIL from Google DNS-over-HTTPS; check-host resolved it to 182.95.251.12 and got HTTP 200 from Mumbai and Los Angeles, while Nuremberg failed DNS. With that IP pinned, the page returned 200 (40 KB) from Toronto, so only DNS is flaky. tlscheck: CONNECT-FAIL getaddrinfo failed. The apex biharcommercialtax.gov.in has no A record. Page links PT payment, PT registration status and list views of circulars and notifications (circular.do?...&strActionType=LIST); no PT pages found in Wayback.
- **Kerala LSGD Profession Tax portal** (`state-pt-kl`, P1) - Local Self Government Department, Government of Kerala. Updates: Unknown (appears unmaintained).
  - Gives us: Nothing usable today; Kerala PT (half-yearly, collected by each local body) needs statute-based rules citing the Kerala Municipality and Panchayat Raj Acts.
  - Ingestion: Not ingestible (expired TLS, backend error). Manual annual review of LSGD orders (go.lsgkerala.gov.in) and the Kerala Gazette.
  - Observed: curl fails TLS: certificate expired (Let's Encrypt R3, notAfter 2024-08-15); tlscheck: VERIFY-FAIL certificate has expired. Ignoring the certificate, the body is only 'Connection failed!!!' (backend error). check-host, which does not validate certificates, gets HTTP 200 from Mumbai, Los Angeles and Nuremberg, so the host is up but broken. Still the PT link on the Thiruvananthapuram and Kochi corporation sites. Fallback lsgkerala.gov.in/en/act-rule (200, TLS ok) hosts the Panchayat Raj and Municipality Acts but no PT schedule, and has no search hits or RSS for profession tax; the K-SMART portal bundle has no PT module.
- **Punjab State Development Tax (Excise and Taxation Department)** (`state-pt-pb`, P1) - Excise and Taxation Department, Government of Punjab. Updates: on notification (PSDT notification Nov 2024).
  - Gives us: PSDT annual return deadline (30 April) and employer deduction rules for Punjab.
  - Ingestion: Manual annual review from India or via Wayback; not reachable from GitHub-hosted runners.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; HTTP 200 from check-host Mumbai. tlscheck: CONNECT-FAIL timeout. Wayback shows PSDT attachments: Punjab State Development Tax Act 2018, PSDT Rules, registration guides, a PSDT calendar PDF (employer annual return Form PSDT-6 on or before 30 April of the next year; Form PSDT-7 annual return for persons), a Nov 2024 PSDT notification (image PDF) and a note on PSDT for pensioners. The former PEXTAX domain pextax.com now serves an unrelated forex-broker review site; do not link it.
- **CAclubindia RSS feed** (`caclubindia-feed`, P2) - CAclubindia. Updates: hourly.
  - Gives us: Tip-offs (ICAI announcements, tax updates).
  - Ingestion: Optional tip-off feed only.
  - Observed: GET 200; text/xml; 6 KB transferred; feed parses (rss), 20 items, newest 2026-10-14. 20 items, newest 2026-10-14.
- **Legacy CBIC GST site (cbic-gst.gov.in)** (`cbic-gst-legacy`, P2) - CBIC. Updates: stale.
  - Gives us: Old citation links (ACES archive, 2017 migration material).
  - Ingestion: Do not ingest; superseded by taxinformation.cbic.gov.in.
  - Observed: GET 200; text/html; 13 KB transferred; HTML, 15864 chars of visible text. Static HTML, mostly ACES archive and migration pages.
- **CBIC main website (cbic.gov.in)** (`cbic-website`, P2) - CBIC. Updates: weekly.
  - Gives us: Press releases, helpdesk details and links into the tax information portal.
  - Ingestion: Reference only - its /api/* routes need undocumented parameters; use the taxinformation.cbic.gov.in API for documents.
  - Observed: GET 200; text/html; 7 KB transferred; flags js-required; HTML, 158 chars of visible text. Angular (JHipster) shell; /api/getTickerData without parameters falls back to the SPA HTML. OpenSSL check: unable to get local issuer certificate (incomplete chain).
- **ClearTax income tax calendar** (`cleartax-calendar`, P2) - ClearTax (Defmacro Software). Updates: monthly.
  - Gives us: Human cross-check of income-tax dates only.
  - Ingestion: Reference only - do not copy.
  - Observed: GET 200; text/html; 30 KB transferred; HTML, 41980 chars of visible text. Server-rendered article (42 KB text).
- **CPCB EPR portals (plastic packaging, battery, e-waste)** (`cpcb-epr-portals`, P2) - Central Pollution Control Board. Updates: n/a.
  - Gives us: Extended Producer Responsibility registration and annual-return deadlines for producers, importers and brand owners.
  - Ingestion: Reference only; maintain EPR rules manually from the notified rules.
  - Observed: GET 200; text/html; 1 KB transferred; flags js-required; HTML, 125 chars of visible text. eprplastic is an Angular shell; eprbattery.cpcb.gov.in serves a captcha login; eprewaste.cpcb.gov.in a small shell; cpcb.nic.in redirects to cpcb.gov.in (200).
- **Department of Revenue website** (`dor`, P2) - Department of Revenue, Ministry of Finance. Updates: occasional.
  - Gives us: Department-level notices; little due-date content.
  - Ingestion: Skip; /rss.xml holds a single 2023 item.
  - Observed: GET 200; text/html; 16 KB transferred; HTML, 7607 chars of visible text. Drupal site; feed stale.
- **Ministry of Finance website** (`finmin`, P2) - Ministry of Finance. Updates: occasional.
  - Gives us: Ministry press notes and links.
  - Ingestion: Not reachable from outside India; PIB covers Ministry of Finance releases.
  - Observed: GET failed: connect timeout (curl: (28) Connection timed out after 15010 milliseconds). TCP connect timed out on three attempts.
- **FSSAI website and FoSCoS** (`fssai`, P2) - Food Safety and Standards Authority of India. Updates: weekly.
  - Gives us: Annual and half-yearly return obligations for food business operators (manual rule maintenance).
  - Ingestion: Reference only; the site is a client-rendered SPA and FoSCoS (foscos.fssai.gov.in) timed out from Toronto.
  - Observed: GET 200; text/html; 1 KB transferred; HTML, 52 chars of visible text. 1 KB Vite/React shell; FoSCoS connect timeout.
- **GST e-invoice portal (IRP)** (`gst-einvoice-portal`, P2) - GSTN / NIC. Updates: on publication.
  - Gives us: e-invoice applicability thresholds and reporting time-limit advisories.
  - Ingestion: Not reachable from outside India; the GST portal news API republishes e-invoice advisories.
  - Observed: GET failed: connect timeout (curl: (28) Connection timed out after 15014 milliseconds). TCP connect timed out (15 s) on three separate attempts from Toronto, consistent with network-level geo restriction.
- **GST e-way bill portal** (`gst-ewaybill-portal`, P2) - GSTN / NIC. Updates: on publication.
  - Gives us: e-way bill rule changes and advisories.
  - Ingestion: Not reachable from outside India; rely on GST portal news and CBIC notifications.
  - Observed: GET failed: connect timeout (curl: (28) Connection timed out after 15008 milliseconds). TCP connect timed out (15 s) on three separate attempts from Toronto.
- **GST user manuals and tutorials (tutorial.gst.gov.in)** (`gst-tutorial`, P2) - GSTN. Updates: occasional.
  - Gives us: Form-level filing guides and FAQs to link from GST rule pages.
  - Ingestion: Reference links only.
  - Observed: GET 200; text/html; 7 KB transferred; final URL https://tutorial.gst.gov.in/userguide/registration/#t=manual.htm; HTML, 47 chars of visible text. Redirects to the RoboHelp user guide (/userguide/registration/); the old /downloads/news/ path returns 404.
- **ICAI announcements** (`icai`, P2) - Institute of Chartered Accountants of India. Updates: daily.
  - Gives us: Professional announcements; no structured due-date calendar found.
  - Ingestion: Reference only; no RSS (/rss.html 404).
  - Observed: GET 200; text/html; 50 KB transferred; HTML, 4102 chars of visible text. Announcements page 51 KB.
- **ICEGATE advisories** (`icegate`, P2) - CBIC - Indian Customs EDI Gateway. Updates: weekly.
  - Gives us: Customs filing advisories for importers and exporters.
  - Ingestion: Use the CBIC tax information API (taxId 1000002) for customs notifications; scrape ICEGATE advisories monthly only if needed.
  - Observed: GET 200; text/html; 18 KB transferred; HTML, 5545 chars of visible text. Drupal home page with advisory sections; /rss.xml returns 403 (feed disabled); /latest-updates/latest-updates 404. OpenSSL check: unable to get local issuer certificate (incomplete chain).
- **ICSI website and latest-updates API** (`icsi`, P2) - Institute of Company Secretaries of India. Updates: weekly.
  - Gives us: ICSI announcements and secretarial standards; its compliance calendar (published in its journal and bulletins) is a human reference for MCA/SEBI deadlines - never copy.
  - Ingestion: Reference only; the same-origin JSON API (/api/home/latest-updates/, /api/search/) mostly carries student and exam notices.
  - Observed: GET 200; application/json; 1012 B transferred; JSON object keys announcements. New React site; latest-updates returned dated announcements (newest 23-09-2026); a site search for 'compliance calendar' found no calendar page.
- **Government Open Data License - India (GODL-India)** (`ogd-godl-india-license`, P2) - Ministry of Electronics and IT (notified in the Gazette of India, February 2017). Updates: static since 2017.
  - Gives us: Licence basis for anything shown from data.gov.in or NDAP: broadly free reuse, commercial included, with attribution to the source ministry and no implied endorsement; personal data, emblems/logos and third-party material are carved out. Confirm against the Gazette text before relying on it.
  - Ingestion: No ingestion. Add a per-dataset attribution line (for example 'Source: Ministry of Corporate Affairs, Government of India, via data.gov.in, under GODL-India') and keep a copy of the Gazette text in the repo docs once obtained.
  - Observed: Same Akamai 503 as the rest of data.gov.in. The licence text is rendered client-side, so even a 2024 archived copy of /Godl holds only the page frame; the older path /government-open-data-license-india now returns 404 on the site.
- **Protean (formerly NSDL e-Gov) TIN and PAN services** (`protean-tin-pan`, P2) - Protean eGov Technologies. Updates: n/a.
  - Gives us: Historic home of e-TDS/TCS return guidance and TIN facilitation; now mainly PAN application services.
  - Ingestion: Reference only; the old e-TDS due-date pages no longer resolve to content.
  - Observed: GET 200; text/html; 1 KB transferred; final URL https://tinpan.proteantech.in/; flags js-required; HTML, 101 chars of visible text. Redirects to https://tinpan.proteantech.in/ (1 KB JavaScript shell with captcha widgets).
- **PRS Legislative Research bill tracker** (`prs-billtrack`, P2) - PRS Legislative Research. Updates: per session.
  - Gives us: Plain-language bill summaries and status for context in the updates feed.
  - Ingestion: Reference only; no RSS (/rss.xml and /billtrack/rss 404). Prefer the Sansad API for status.
  - Observed: GET 200; text/html; 35 KB transferred; HTML, 32395 chars of visible text. Server-rendered list (35 KB).
- **RBI FIRMS portal (FEMA reporting forms)** (`rbi-firms-portal`, P2) - Reserve Bank of India. Updates: n/a.
  - Gives us: Where FC-GPR, FC-TRS, ESOP, DRR and LLP forms are filed - deep link only.
  - Ingestion: Reference link only.
  - Observed: GET failed: connection reset (curl: (35) Recv failure: Connection was reset). TLS connection reset ('Recv failure') from Toronto.
- **Shram Suvidha portal (unified labour returns)** (`shram-suvidha`, P2) - Ministry of Labour and Employment. Updates: n/a.
  - Gives us: Unified annual and half-yearly returns under central labour law - deep link only.
  - Ingestion: Not reachable from outside India; reference link only.
  - Observed: GET failed: connect timeout (curl: (28) Connection timed out after 15000 milliseconds). TCP connect timed out on three attempts.
- **Chhattisgarh Shram Kalyan Mandal (Labour Department portal)** (`state-lwf-cg`, P2) - Labour Department, Government of Chhattisgarh. Updates: Unknown.
  - Gives us: Chhattisgarh LWF board home only; rates and dates must come from statute and notifications.
  - Ingestion: Needs a headless browser; otherwise manual review.
  - Observed: HTTP 200 (9 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.3. Next.js page whose content renders client-side; the static HTML and 25 JS chunks held no contribution rates or dates, and the sitemap lists only policy pages. cglabour.nic.in is NXDOMAIN.
- **Chandigarh Labour Department - Deposit of Labour Welfare Fund** (`state-lwf-ch`, P2) - Labour Department, Chandigarh Administration. Updates: Unknown.
  - Gives us: Chandigarh LWF deposit procedure and dates.
  - Ingestion: Manual review; the weak-DH TLS setup blocks automated clients.
  - Observed: TCP connect timeout from Toronto, Los Angeles and Nuremberg; from check-host Mumbai the TLS handshake fails with OpenSSL 0A00018A (dh key too small), so modern OpenSSL clients fail even in India. tlscheck: CONNECT-FAIL timeout. Page found via Wayback (2022). Chandigarh applies the Punjab LWF Act 1965, whose Act and Rules PDFs are on pblabour.gov.in. chdlabour.gov.in is NXDOMAIN.
- **Mizoram Taxation Department - downloads (PT Act and slabs)** (`state-pt-mz`, P2) - Taxation Department, Government of Mizoram. Updates: rarely (latest PT slab notification 11-07-2024).
  - Gives us: Mizoram PT slab table and Act citation.
  - Ingestion: Automatable: monthly fetch of download.html; alert on new PT links.
  - Observed: HTTP 200 (11 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.2. Links the Mizoram PT Act 1995, the PT schedule w.e.f. 2013-14 and 'Final Profession Tax Slab 2024' (text PDF: notification No.J.17011/1/2017-TAX dated 11-07-2024 modifying the schedule w.e.f. assessment year 2023-24). The home page also links a Finance Department OM (June 2022) cutting PT deduction instalments for government staff. The other IGOD host, taxation.mizoram.gov.in, returns 403.
- **Nagaland Department of Taxes - Professional Tax** (`state-pt-nl`, P2) - Department of Taxes, Government of Nagaland. Updates: occasional.
  - Gives us: Nagaland PT notice and registration references; rates need a manual read of the scans.
  - Ingestion: Monthly fetch and hash of the home-page links; manual reading of scanned PDFs (OCR optional).
  - Observed: HTTP 200 (26 KB) from Toronto; HTTP 200 from check-host Mumbai and Los Angeles. tlscheck: ok TLSv1.2. Links a PT notification and a PT public notice (both scanned image PDFs without a text layer), a PT registration guide, and the PT e-service at taxsoft-ngl.nic.in/Ptaxnagaland. nagalandtax.gov.in is NXDOMAIN.
- **Sikkim Commercial Taxes - Professional Tax** (`state-pt-sk`, P2) - Commercial Taxes Division, Finance Department, Government of Sikkim. Updates: rarely (rate PDFs uploaded 2022).
  - Gives us: Sikkim PT rate schedule and Act citation.
  - Ingestion: Manual annual review; the WordPress feeds would only help with legacy TLS from an allowed network.
  - Observed: TCP connect timeout from Toronto and Nuremberg; from check-host Mumbai and Los Angeles the TLS handshake fails with OpenSSL 0A000102 (unsupported protocol; the server appears to offer only legacy TLS), so OpenSSL 3 runners fail even where TCP is allowed. tlscheck: CONNECT-FAIL timeout. WordPress site; Wayback shows the Sikkim Tax on Professions, Trades, Callings and Employments Act 2006, PT rules, 'Professional Rate of tax' PDFs (2022) and WordPress category RSS feeds.
- **TaxGuru RSS feed** (`taxguru-feed`, P2) - TaxGuru. Updates: hourly.
  - Gives us: Tip-offs on tax and corporate-law changes; monthly compliance-calendar articles.
  - Ingestion: Optional tip-off feed only; do not copy.
  - Observed: GET 200; application/rss+xml; 13 KB transferred; feed parses (rss), 75 items, newest 2026-10-15. WordPress feed with 75 items, newest 2026-10-14; tag feeds exist (/tag/<tag>/feed/); search feed timed out.
- **Taxmann** (`taxmann`, P2) - Taxmann Allied Services. Updates: daily.
  - Gives us: Paid research database; compliance calendar behind its app.
  - Ingestion: Reference only.
  - Observed: GET 200; text/html; 20 KB transferred; flags js-required; HTML, 68 chars of visible text. JavaScript shell; content client-rendered.
- **TRACES (TDS CPC portal)** (`traces-tdscpc`, P2) - Income Tax Department - TDS Centralized Processing Cell. Updates: n/a.
  - Gives us: Where deductors download Form 16/16A and file TDS corrections - deep-link target for TDS certificate due dates.
  - Ingestion: Reference only; no public news feed or data.
  - Observed: GET 200; text/html; 2 KB transferred; final URL https://traces.tdscpc.gov.in/; HTML, 62 chars of visible text. Redirects to https://traces.tdscpc.gov.in/ (2 KB JavaScript login shell).

