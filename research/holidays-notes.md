# Holiday lists - research notes

Verified 2026-10-14. Companion to `holidays.json`. All prose and names are our own wording; dates come from the official lists named below.

## Inventory

| id | kind | scope | rows | confidence | primary source |
|---|---|---|---|---|---|
| central-gazetted-2026 | gazetted | IN | 18 | high | DoPT OM F.No. 12/2/2023-JCA dated 03-07-2025 (Annexure I), plus two later OMs |
| central-restricted-2026 | restricted | IN | 34 | high | same OM, Annexure II |
| central-gazetted-2027 | gazetted | IN | 17 | high | DoPT OM F.No. 12/2/2023-JCA dated 16-07-2026 (Annexure I) |
| central-restricted-2027 | restricted | IN | 32 | high | same OM, Annexure II |
| nse-trading-2026 | exchange-trading | NSE | 16 | high | NSE/CMTR/71775 dated 12-12-2025 + NSE/CMTR/72260 dated 12-01-2026 |
| nse-settlement-2026 | exchange-settlement | NSE | 20 | high | NCL/CMPT/71904 dated 22-12-2025 + NCL/CMPT/72224 dated 09-01-2026 |
| bse-trading-2026 | exchange-trading | BSE | 16 | high | BSE trading holidays page |
| bank-mh-2026 | bank | MH | 22 | high | RBI holiday matrix, Mumbai |
| bank-dl-2026 | bank | DL | 16 | high | RBI holiday matrix, New Delhi |
| bank-ka-2026 | bank | KA | 22 | high | RBI holiday matrix, Bengaluru |
| bank-tn-2026 | bank | TN | 23 | high | RBI holiday matrix, Chennai |
| bank-wb-2026 | bank | WB | 28 | high | RBI holiday matrix, Kolkata |
| bank-tg-2026 | bank | TG | 20 | high | RBI holiday matrix, Hyderabad |
| bank-gj-2026 | bank | GJ | 19 | high | RBI holiday matrix, Ahmedabad |
| bank-kl-2026 | bank | KL | 22 | high | RBI holiday matrix, Kochi |
| bank-up-2026 | bank | UP | 25 | high | RBI holiday matrix, Lucknow |
| bank-rj-2026 | bank | RJ | 17 | high | RBI holiday matrix, Jaipur |
| bank-br-2026 | bank | BR | 20 | high | RBI holiday matrix, Patna |
| bank-od-2026 | bank | OD | 20 | high | RBI holiday matrix, Bhubaneswar |
| bank-as-2026 | bank | AS | 19 | high | RBI holiday matrix, Guwahati |
| bank-mp-2026 | bank | MP | 21 | high | RBI holiday matrix, Bhopal |
| bank-ap-2026 | bank | AP | 20 | high | RBI holiday matrix, Vijayawada |
| bank-ga-2026 | bank | GA | 17 | high | RBI holiday matrix, Panaji |
| bank-jh-2026 | bank | JH | 22 | high | RBI holiday matrix, Ranchi |

Besides the keys in the requested format, each list may carry `notes` (string) and `alsoSee` (array of `{title, url}`), and a holiday row may carry `note` (string). Consumers that do not know these keys can ignore them.

## Not yet published (as of 2026-10-14)

- **NSE and BSE 2027**: not out. NSE issued the 2026 list on 12 Dec 2025, so the 2027 circulars should appear around mid-December 2026. The NSE API and the BSE page currently carry 2026 only.
- **RBI bank holidays 2027**: not out. The year selector on the RBI holiday matrix stops at 2026. RBI fills in a year as state governments notify their NI Act holidays, which most states do near the end of the previous year, so check again from December 2026.
- **DoPT 2028**: not out. The 2026 list came on 3 Jul 2025 and the 2027 list on 16 Jul 2026, so expect the 2028 OM around June-July 2027. The site window runs to 2028-10-31, so this list will be needed.
- **Dr. B.R. Ambedkar's Birthday 2027 (14 Apr, Wednesday)**: DoPT declares it by a separate OM each year (the 2026 one is dated 9 Apr 2026), so it is not in the 2027 list yet.

## Central Government (DoPT)

The Delhi/New Delhi lists come from the annual DoPT Office Memorandum "Holidays to be observed in Central Government Offices during the year ...". dopt.gov.in, persmin.gov.in and documents.doptcirculars.nic.in all timed out or refused connections from the research environment (they appear to block traffic from outside India). So each list was checked against two independent copies. For 2026, a scanned copy of the OM (mirrored by StaffNews) was read page by page and matched to the dated list on the National Portal of India (india.gov.in/calendar, run by NIC). The portal's CMS returns the same dates as 50 entries, because it merges the two restricted pairs that share a date. For 2027, the text layer of the scanned OM matched the portal's 49 entries exactly, and the portal entries were created on 22 Jul 2026, just after the OM date. The build script stops if the portal dates and the OM dates disagree.

The 2026 source URL is the DoPT PDF path found in the Internet Archive index. Its file name is the OM subject followed by DoPT's usual random suffix. We could not open the file itself (DoPT blocked us and the Archive rate-limited us), so the link should be clicked once from an Indian connection. We found no official DoPT URL for the 2027 OM, so the portal calendar is the primary link for 2027 and the scanned copy is listed under `alsoSee`.

Two 2026 changes came after the OM. DoPT OM F.No. 12/3/2023-JCA dated 22 May 2026 moved Id-ul-Zuha (Bakrid) from 27 May to 28 May for Delhi offices. The PDF of that OM uses JBIG2 compression we could not render, so the change rests on its published transcription. The portal, the RBI list and the NSE list all show 28 May, which confirms it. DoPT OM F.No. 12/4/2020-JCA dated 9 Apr 2026 made 14 April 2026 a holiday for all Central Government offices in India, industrial establishments included; that scan was read directly. Both rows carry a `note`. With these changes the gazetted 2026 list has 18 rows instead of the 17 in Annexure I.

These lists apply only to administrative offices in Delhi/New Delhi. Offices elsewhere observe 14 compulsory holidays plus 3 picked from a list of 12 by the Central Government Employees Welfare Coordination Committee (CGEWCC) of each state capital. Those committees can also shift Id-ul-Fitr, Id-ul-Zuha, Muharram and Id-e-Milad to follow the state government, so central offices in Mumbai or Chennai do not follow the Delhi list. We did not compile the state CGEWCC lists. Restricted holidays are not closures: each employee may take two of them and the office stays open. They are included because the request asked for them, but working-day calculations should ignore them. For Delhi, DoPT can move the four moon-dependent holidays at short notice (para 5 of the OM). Only the Bakrid shift happened in 2026.

## NSE and BSE

The NSE lists come from the circular PDFs and match the NSE `holiday-master` API, fetched with a cookie session from the homepage. NSE added 15 Jan 2026 (municipal corporation elections in Maharashtra) to both its trading and settlement lists by circulars in January 2026. Monthly circular listings from 20 Jan to 14 Oct 2026 show no other change to trading holidays. The exchange lists include weekday closures only. The weekend holidays (15 Feb, 21 Mar, 15 Aug, 8 Nov) are named in each list's `notes`. 8 Nov is Diwali Laxmi Pujan, a Sunday, with a Muhurat trading session; its timings are notified separately, usually in late October.

Trading and settlement holidays differ. NSE Clearing settles on Mumbai bank working days, so 19 Feb, 19 Mar, 1 Apr and 26 Aug 2026 are trading days with no funds or securities settlement. The settlement list is identical across the NSE Clearing CM, F&O, currency, interest rate, commodity, corporate bond, mutual fund and SLB segments. NSE currency and interest-rate derivatives also stop trading on those bank holidays. NSE commodity derivatives close by session (morning and evening), which is not modelled here.

BSE equity and equity derivative trading holidays were read from the data tables behind the official BSE holiday page and match NSE exactly. BSE's own MCGM label for 15 Jan is kept. We did not get the BSE notice number for the 2026 list: the BSE notice search API only returns about the last seven months and blocks repeated automated calls. BSE's currency derivatives and tri-party repo list equals the NSE settlement list. A separate ICCL (BSE clearing) settlement list was not fetched; it should follow the same Mumbai bank holidays, but that is unverified.

## RBI bank holidays

Each list comes from the RBI holiday matrix (https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx), fetched as an ASP.NET form post with the regional office, All Months and year 2026. The dates are RBI's. The names needed work, because RBI prints one combined description per date covering every state (for example 15 Jan reads "Uttarayana Punyakala/Pongal/.../Election to Municipal Corporations in Maharashtra"). We picked the part that applies to each state and checked it against that state's own holiday list on the National Portal. Where the state list was silent, we used RBI's 2025 data for the same centre, when the festivals fell on different days. For example, 2025 shows whether a centre closes for May Day or for Buddha Purnima, which coincide on 1 May 2026. Treat the names as labels; the dates are the authoritative part.

Standing rule, not included as dated rows: banks are closed on every Sunday and on the second and fourth Saturday of each month, and fully open on the other Saturdays. This has applied since 1 Sep 2015 (Government of India notification dated 20 Aug 2015 under Section 25 of the Negotiable Instruments Act, announced in RBI press release 2015-2016/528 dated 28 Aug 2015, https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=34844; the RBI matrix repeats it as a footnote). The RBI matrix leaves out Sundays but keeps Saturday holidays, so some Saturday rows (such as 10 Oct, a second Saturday) are closed twice over.

Points worth knowing per state are in each list's `notes`. In summary:

- Mahavir Jayanti is 30 Mar for Karnataka and Madhya Pradesh in RBI's list but 31 Mar in those state governments' own lists.
- Kerala shows Bakrid on both 27 and 28 May; Assam shows 27 May only.
- Gujarat, West Bengal, Rajasthan and Odisha have no Id-e-Milad bank holiday.
- Rajasthan and Assam have no Good Friday bank holiday.
- Jharkhand does not list 1 April (annual closing).
- 11 Sep (Jaipur Municipal Corporation elections) applies only within that corporation.
- Election-day holidays appear for Tamil Nadu (23 Apr), West Bengal (29 Apr), Kerala (9 Apr), Maharashtra (15 Jan, municipal) and Jharkhand (23 Feb, municipal).

On 31 March 2026, a holiday (Mahavir Jayanti) in many states, RBI told agency banks to keep branches that handle government receipts and payments open (RBI/2025-26/204 dated 3 Feb 2026). This is noted on those rows because year-end tax and government payments could still be made that day.

The Kerala list uses the Kochi centre. Thiruvananthapuram has the same dates plus 3 Mar (Attukal Pongala, a local holiday). Belapur and Nagpur match Mumbai, and Kanpur matches Lucknow. Centres fetched but left out because the state mapping was unclear or the state was out of scope: Agartala, Aizawl, Chandigarh (serves Punjab, Haryana and the UT), Dehradun, Gangtok, Imphal, Itanagar, Jammu, Kohima, Raipur, Shillong, Shimla and Srinagar. Chhattisgarh and Uttarakhand were also skipped because their two-letter codes appear in two forms (CT or CG, UT or UK) and the site's code should be confirmed first. Any of these can be added with the same method.

## Refreshing the data

- NSE: GET https://www.nseindia.com/ to obtain cookies, then call `/api/holiday-master?type=trading` and `?type=clearing` with the same cookie jar and a browser user agent. Holiday circulars can be found through `/api/circulars?fromDate=DD-MM-YYYY&toDate=DD-MM-YYYY`, filtering subjects for "holiday". Query one month at a time.
- RBI: GET the matrix page, copy the `__VIEWSTATE`, `__VIEWSTATEGENERATOR` and `__EVENTVALIDATION` fields, then POST `drRegionalOffice` (Mumbai 28, New Delhi 30, Bengaluru 3, Chennai 16, Kolkata 26, Hyderabad 18, Ahmedabad 1, Kochi 24, Lucknow 27, Jaipur 19, Patna 32, Bhubaneswar 11, Guwahati 17, Bhopal 10, Vijayawada 76, Panaji 31, Ranchi 69), `drMonth=0`, `drYear=YYYY` and `btnGo=GO`.
- National Portal: POST JSON `{"route": "/api/calendar-holidays?filters[date][$gte]=YYYY-01-01&filters[date][$lte]=YYYY-12-31&pagination[pageSize]=100"}` to https://www.india.gov.in/internal/cms. State lists use `/api/state-holidays?populate=*&filters[state_dept_org][alias]=<state>&...`; query them one quarter at a time, because a full year times out.
- DoPT: look for the next OM in July. If dopt.gov.in cannot be reached, the Internet Archive CDX index for `documents.doptcirculars.nic.in/D2/D02est/*` gives file names, and the portal calendar gets updated within a few days of the OM.

## Gaps and cautions

- The official DoPT URLs could not be opened from the research environment. The 2026 link should be checked once from an Indian connection, and the 2027 official URL is still unknown.
- The text of the Bakrid date-change OM was read from a published transcription. The date itself is confirmed by three other official sources.
- The BSE notice number for 2026 and a separate BSE/ICCL settlement list were not collected.
- CGEWCC lists for central offices outside Delhi were not compiled. Use the state bank lists or the state government lists for state-located deadlines.
- Bank holiday names are editorial labels. Late changes, such as extra election-day or mourning holidays declared at short notice, happen often under the NI Act. Re-fetch the RBI matrix before relying on a date near the deadline.
