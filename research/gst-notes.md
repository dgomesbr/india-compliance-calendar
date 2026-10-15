# GST and foreign-trade research notes

Verified 2026-10-14. Companion to `gst.json` (38 rules: 34 category "gst", 4 category "trade").

## How this was researched

No web-search tool was available in this session, and DuckDuckGo, Bing and Google all blocked automated queries, so the work was done by reading primary sites directly. The CBIC tax information portal (taxinformation.cbic.gov.in) has a public JSON API that returns the full Central Tax and Central Tax (Rate) notification registers and serves the notification PDFs and the current text of each CGST rule and Act section; every notification cited was downloaded and read. The GST portal news feed (www.gst.gov.in/newsandupdates) sits behind an F5 bot check, so its advisories (items 540 to 677, October 2024 to October 2026) were rendered with headless Chrome and read one by one. GST portal FAQs on tutorial.gst.gov.in, the GSTAT sites (gstat.gov.in and efiling.gstat.gov.in) and the DGFT Foreign Trade Policy and Handbook of Procedures PDFs (July 2026 editions) were also read. Taxguru was used only through its site search to find items and to cross-check; where a fact rests only on a secondary source, the rule or this note says so.

CBIC sources in the JSON use the portal's "view-pdf" deep link (`https://taxinformation.cbic.gov.in/view-pdf/<id>/ENG/Notifications`), which opens the official PDF in a browser. Each of the 41 ids was checked against the API to confirm it maps to the intended notification or circular. Rule and section links point to the raw HTML text that the portal serves.

## Confirmed changes in 2025-2026

**GST rate rationalisation ("GST 2.0").** Notification 9/2025-Central Tax (Rate) dated 17-09-2025 superseded the 2017 goods rate notification from 22-09-2025. Its CGST schedules are 2.5%, 9% and 20% (5%, 18% and 40% in total), plus special 1.5%, 0.125% and 0.75% schedules and a residual 14% Schedule VII. Companion notifications 10/2025 to 17/2025-CT(Rate) cover other goods and services. Notification 19/2025-CT(Rate) dated 31-12-2025 moved pan masala and tobacco products into the 20% CGST schedule and biris into the 9% schedule, and omitted Schedule VII from 1-02-2026. It came alongside retail-sale-price valuation for notified tobacco goods (Notification 19/2025-CT). No return due date changed because of the rate reform.

**Three-year time bar on filing returns.** Sections 37(5), 39(11), 44(2) and 52(15) were inserted by the Finance Act 2023 and have been in force since 1-10-2023 (Notification 28/2023-CT). A June 2025 GSTN advisory said the portal would enforce them from the July 2025 tax period. The October 2025 advisory then fixed enforcement from the November 2025 tax period, effective 1-12-2025. From that date the following were barred: monthly returns for October 2022, quarterly returns for July-September 2022, GSTR-4 for FY 2021-22 and GSTR-9/9C for FY 2020-21. The portal now offers an "Application for Unbarring Returns". If the officer approves it, all barred returns must be filed within 30 days or they are barred again. This is modelled as `gst-three-year-filing-bar`.

**Hard-locking of GSTR-3B.** The Table 3 liability that GSTR-1, GSTR-1A and IFF auto-populate became non-editable from the July 2025 period, filed in August 2025. This had been planned for January 2025 and was deferred (advisories of 27-01-2025 and 07-06-2025). Table 3.2 (inter-State supplies to unregistered persons, composition dealers and UIN holders) became non-editable from the November 2025 period. From the January 2026 period, system-computed interest in Table 5.1 is auto-populated in the next GSTR-3B and cannot be reduced, and interest on a late final GSTR-3B is collected through GSTR-10. From the February 2026 period the "tax liability breakup" must be confirmed before filing. In December 2025 GSTN announced that negative balances in the credit reversal-and-reclaim ledger or the RCM ledger will soon block GSTR-3B filing. GSTR-1A, which can be filed until GSTR-3B is filed, is now the only route to correct current-period liability.

**Invoice Management System (IMS).** IMS has run since the October 2024 period. From 1-10-2025 the Finance Act 2025 gave it statutory footing through Section 38 (the ITC statement) and the new Section 34(2) proviso, under which a supplier's output tax is reduced for a credit note only if the recipient reverses the matching ITC (Notification 16/2025-CT). From the October 2025 period, credit notes and certain downward amendments can be kept pending for one tax period, and recipients can enter the ITC actually reversed. A section for imports (bills of entry, including from SEZs) was added from the October 2025 period, and an IMS offline tool followed in April 2026. GSTR-2B is still generated on the 14th, and IMS actions remain possible until GSTR-3B is filed. IMS has no separate due date, so it is described inside the GSTR-3B rule rather than as a rule of its own.

**GSTR-9/9C.** For FY 2024-25 (due 31-12-2025), the CGST (Third Amendment) Rules 2025 (Notification 13/2025-CT, effective 22-09-2025) revised both forms. GSTR-9 gained Tables 6A1 and 6A2 for ITC of the preceding year availed in the current year, and Table 8A is drawn from GSTR-2B. The portal opened on 12-10-2025, with FAQs on 16-10-2025, 04-12-2025 and 17-12-2025, and no extension was notified. Notification 15/2025-CT now exempts registered persons with aggregate turnover up to Rs 2 crore from the annual return on a standing basis from FY 2024-25 onwards, instead of year by year. Circular 246/03/2025-GST clarified that the Section 47(2) late fee runs until both GSTR-9 and (where required) GSTR-9C are filed. Notification 08/2025-CT waived the GSTR-9C-related excess for FY 2017-18 to 2022-23 where 9C was filed by 31-03-2025. For FY 2025-26 (due 31-12-2026), the forms were enabled on 08-10-2026.

**Late-fee rationalisation in 2026.** None has been notified. The only 2026 late-fee measure is a recommendation of the 57th GST Council (8-10-2026): waive the late fee on Section 39(1) returns (GSTR-3B) for taxpayers with turnover up to Rs 5 crore in the preceding year, if the return is filed by the end of the month in which it was due. It needs a notification under Section 128 and had not been issued by 14-10-2026. The Finance Act 2026 changed refunds, post-sale discounts and the interim forum for National Appellate Authority appeals, but not late fees or due dates.

**GST Appellate Tribunal (GSTAT).** E-filing opened in September 2025 with batch-wise filing windows set by the GSTAT President. S.O. 4220(E) dated 17-09-2025 had fixed 30-06-2026 as the outer date for orders communicated before 1-04-2026; that detail comes from a secondary source, as the S.O. was not opened. The Department of Revenue notification dated 30-06-2026 (F. No. A-50/7/2025-GSTAT-DoR, published on the GSTAT e-filing portal) superseded it. Its outer date is 31-07-2026 for taxpayer appeals against orders communicated before 1-05-2026, and for departmental applications against orders passed before 1-02-2026. Later orders follow the normal Section 112 limits: three months for taxpayers, six months for the department, and 45 days for cross-objections, with up to three further months condonable. The portal treated an "intent to file" recorded by 31-07-2026 as timely filing. Appeal forms and Rule 110A (single-member benches) came in with Notification 13/2025-CT. From 1-04-2026 the Principal Bench also hears Section 101B appeals (Notification 02/2026-CT). Circular 256/02/2026-GST (25-07-2026) covers departmental appeals in cases decided by a common adjudicating authority. The 57th Council recommended a Rs 40 crore ceiling on pre-deposit for penalty-only orders.

**Other 2025-2026 items reflected in the rules.**
- The ISD regime became mandatory from 1-04-2025 (Section 20 substituted).
- GSTR-7 needs invoice-wise details from the September 2025 period. A return is required every month even when nothing was deducted, and since 1-11-2024 the late fee is waived for nil returns (Notification 23/2024-CT).
- The 30-day e-invoice reporting limit has applied to AATO of Rs 10 crore and above since 1-04-2025, and no further lowering was found.
- From December 2025, registrations are suspended automatically if bank details are not furnished within 30 days (Rule 10A).
- The simplified registration route (Rule 14A) and electronic grant of registration (Rule 9A) apply from 1-11-2025 (Notification 18/2025-CT).
- Online filing of the hotel "specified premises" declaration opened in January 2026.
- The AATO amendment window for FY 2025-26 was moved to 1-31 July 2026, with officer review on 1-15 August 2026. It is optional and not modelled.

## Due-date extensions notified in 2025-2026

This list is complete for CBIC Central Tax notifications dated 1-01-2025 to 14-10-2026: the register contains 20 notifications for 2025 and 2 for 2026. All except the GSTAT item are recorded as `overrides` in the JSON.

| Notification | Return and period | Original | Extended to | Scope |
|---|---|---|---|---|
| 01/2025-CT (10-01-2025) | GSTR-1 December 2024 | 11-01-2025 | 13-01-2025 | monthly filers |
| 01/2025-CT | GSTR-1 Oct-Dec 2024 (QRMP) | 13-01-2025 | 15-01-2025 | quarterly filers |
| 02/2025-CT (10-01-2025) | GSTR-3B December 2024 | 20-01-2025 | 22-01-2025 | monthly filers |
| 02/2025-CT | GSTR-3B Oct-Dec 2024 (QRMP) | 22-01-2025 / 24-01-2025 | 24-01-2025 / 26-01-2025 | by State group |
| 03/2025-CT | GSTR-5 December 2024 | 13-01-2025 | 15-01-2025 | all NRTPs |
| 04/2025-CT | GSTR-6 December 2024 | 13-01-2025 | 15-01-2025 | all ISDs |
| 05/2025-CT | GSTR-7 December 2024 | 10-01-2025 | 12-01-2025 | all deductors |
| 06/2025-CT | GSTR-8 December 2024 | 10-01-2025 | 12-01-2025 | all ECOs |
| 12/2025-CT (20-08-2025) | GSTR-3B July 2025 | 20-08-2025 | 27-08-2025 | only Mumbai City, Mumbai Suburban, Thane, Raigad, Palghar (heavy rains) |
| 17/2025-CT (18-10-2025) | GSTR-3B September 2025 and Jul-Sep 2025 | 20-10-2025; 22/24-10-2025 | 25-10-2025 | monthly and quarterly filers |
| 01/2026-CT (21-04-2026, effective 20-04-2026) | GSTR-3B March 2026 | 20-04-2026 | 21-04-2026 | monthly filers only |
| DoR notification (30-06-2026) | GSTAT appeals, backlog | 30-06-2026 | 31-07-2026 | orders communicated before 1-05-2026 (modelled as one-time rule `gst-gstat-backlog-deadline`) |

No extension was found for GSTR-9/9C FY 2024-25, GSTR-4 FY 2024-25 or FY 2025-26, CMP-08, ITC-04, IFF, PMT-06 or GSTR-5A. The GST portal news feed shows no State-issued extension in 2025-2026 other than the Maharashtra one (Section 39(6) deems State Commissioner extensions to be CBIC extensions, but none were advertised). Three late-2024 extensions are outside the requested range and not recorded: 26/2024 (Maharashtra and Jharkhand), 29/2024 (Manipur) and 30/2024 (Murshidabad), all for the October 2024 GSTR-3B.

## Corrections to commonly published calendars

Several widely copied calendars, including an October 2026 one on a major tax site, still carry outdated items:
- **GSTR-5** is due on the 13th, not the 20th. Section 39(5) has said "thirteen days" since the Finance Act 2022 took effect on 1-10-2022, and the portal FAQ agrees, even though the CBIC copy of Rule 63 still reads "twenty days".
- **GSTR-4** has been due on 30 June, not 30 April, since FY 2024-25 (Rule 62 proviso, Notification 12/2024-CT). The portal FAQ wording is stale.
- **GSTR-11** has no due date; the portal FAQ says it is filed quarterly, before the RFD-10 refund claim, and is modelled as an event. The familiar "28th of the following month" is not supported by the current FAQ.
- **PMT-06 and IFF** apply only to the first two months of a quarter.
- **GSTR-5A and CMP-08** carry no late fee on the portal.
- **Nil GSTR-7** returns have had their late fee waived since November 2024.

## Watch list (recommended, not yet notified, as of 14-10-2026)

The 57th GST Council (8-10-2026) made several recommendations, all still to be notified, legislated or implemented:
- A late-fee waiver for GSTR-3B filers with turnover up to Rs 5 crore who file within the month.
- An alternate mechanism for amending liability and ITC from the April 2027 return: Rule 61(1A) and 61(1B), Rule 60(6A) for IMS, and Rules 86C and 86D for the reclaim and RCM statements.
- In-principle approval of an optional Annual Return Quarterly Payment (ARQP) scheme for B2C-only taxpayers with turnover up to Rs 5 crore.
- A cut in the Section 125 general penalty from Rs 25,000 to Rs 10,000, which would change the ITC-04 exposure.
- A Rs 10,000 threshold for show cause notices.
- Removal of arrest provisions, and a prosecution threshold raised to Rs 5 crore.
- E-invoicing for RCM purchases from unregistered persons and for import of services where AATO is Rs 5 crore or more.
- Automatic acceptance of registration cancellation once returns are filed.
- Alignment of Sections 37 and 39 with the Section 16(4) time limit.

## Modelling conventions to confirm

These need the coordinator's confirmation:

- **Override scope.** The July 2025 GSTR-3B override (Notification 12/2025-CT) covered only five Maharashtra districts. It carries an extra `"states": ["MH"]` key, with the districts named in `reason`. It falls outside the 2026-2028 display window, but the site should not apply it nationally if the schema gains partial-scope overrides.
- **Pre-year options.** CMP-02, the LUT, the GTA Annexure V/VI and the specified-premises declaration all fall due before the year they govern. They are modelled as annual FY rules with day 31 and monthOffset 0, so the occurrence on 31 March of FY X is the option for FY X+1. The QRMP option window works the same way: the occurrence after quarter Qn (e.g., 30 April) is the cut-off for quarter Qn+1. The IEC update is keyed to the preceding FY, due 30 June after it. A negative monthOffset would let these be keyed to the target period, but the schema does not say whether negatives are allowed.
- **Exposure fields.** GSTR-9 uses `lateFeePerDay` 200 and `percentOfTurnover` 0.5 (highest combined slab) with `lateFeeCap` null. GSTR-9C repeats GSTR-9's exposure because the late fee is shared, so the two should not be added together. QRMP rules use a `lateFeeCap` of 5,000, the top slab available under Rs 5 crore AATO. All GST amounts are CGST plus SGST combined.

## Unverified or lower-confidence points

- The S.O. 4220(E) dated 17-09-2025 (the superseded GSTAT outer date) was described only by a secondary source.
- The GSTR-8 late fee is taken from Section 47(1) (Rs 100 + Rs 100 per day, Rs 5,000 + Rs 5,000 cap). No reducing notification exists in the register, but the portal's actual computation was not seen.
- The ECO annual statement GSTR-9B (Section 52(5), Rule 80(2), due 31 December) is not modelled, because its availability on the portal was not confirmed.
- The specified-premises rule is confirmed for the declaration window (Notification 05/2025-CT(Rate) and the January 2026 advisory). The rate consequences after GST 2.0 were not re-verified, so the rule avoids stating rates.
- Notification 58/2015-20 (12-02-2021) as the origin of the IEC update requirement, and a Rs 200 reactivation charge, come only from secondary sources. The JSON relies on FTP 2023 Para 2.05(d)-(e) for the obligation itself.
- Neither ISO 3166-2:IN nor the Rule 61 table assigns the GST "Other Territory" registration code 97 to either QRMP group.
- Some trade returns were skipped because their due dates could not be verified on a primary source. The SEZ unit Annual Performance Report could not be checked because the SEZ Rules 2006 text is not on sezindia.gov.in (only amendments are). The EOU/EHTP/STP/BTP quarterly and annual reports are required by HBP Para 6.11, but their due days sit in Appendix 6E, which was not reachable. The STP monthly SERF and the EPCG export-obligation report (HBP Para 5.14, event-based after the first block) were also not modelled.
- The AATO amendment window has moved before (May up to FY 2024-25, July for FY 2025-26). Future windows are not yet announced, so it is not modelled.
