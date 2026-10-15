# Income-tax research notes

Verified on 2026-10-14. Companion to `income-tax.json` (53 rules, category `income-tax`).

## How this was researched

General web search was mostly unavailable (DuckDuckGo, Google and Brave returned bot challenges or rate limits), so the work relied on primary government sources opened directly:

- Income-tax Rules, 2026 (G.S.R. 198(E), Notification No. 22/2026, 20 March 2026) - full PDF from incometax.gov.in, read rule by rule.
- Income-tax Act, 2025 (30 of 2025) - text as passed by Parliament (PRS Legislative Research copy of the Lok Sabha bill as passed; the Act was enacted without change).
- Finance Bill, 2026 and its Memorandum (indiabudget.gov.in), and the enacted Finance Act, 2026 (Act 4 of 2026, assent 30 March 2026) as reproduced in full by TaxGuru. The Gazette copy itself could not be reached (egazette and indiacode were blocked), so the enacted text is a secondary reproduction, cross-checked clause by clause against the Bill and against CBDT's own tax calendar.
- The CBDT tax calendar on incometaxindia.gov.in. Its entries are Liferay structured content reached through the site's own search API; each entry has a public `/w/...` page, and those pages are cited as sources. Most new-Act dates for tax year 2026-27 (Forms 121, 131, 132, 133, 137, 138, 140, 141, 143, 144, 147, 98, advance tax) and all AY 2026-27 dates are confirmed there.
- CBDT "FAQs on Interplay and Transition from the Income-tax Act, 1961 to the Income-tax Act, 2025" (v2.0, updated October 2026) and the separate FAQs on section 536.
- CBDT Circular No. 07/2026 (PDF on incometax.gov.in), the e-filing portal's latest-news list for 2026, the DIT(Systems) Form 121 notification, Notification No. 121/2026 and Notification No. 14/2025.
- CBDT's own old-to-new mapping data behind the incometaxindia.gov.in Act comparison tool (`/o/c/incometaxactcompares/`, 1,943 rows covering sections, rules and forms). That endpoint needs a browser session and may refuse plain scripts.
- The official "about the form" pages on incometaxindia.gov.in (`/w/form-49c`, `/w/form-61a` and so on) for old-form due dates and penalties.
- Secondary sources were used only to corroborate: TDSMAN (TDS software vendor blog) and TaxGuru.

## What changed in 2025-2026

**New Act and Rules.** The Income-tax Act, 2025 replaced the 1961 Act from 1 April 2026. "Tax year" replaces previous year and assessment year, so income of FY 2026-27 is "tax year 2026-27". The Income-tax Rules, 2026 (333 rules, 190 forms) replaced the 1962 Rules on the same date. Since then the Rules have been amended several times (for example the Third Amendment, Notification 97/2026, which added ITR-BN; the Fifth, Notification 121/2026, on property bought from non-residents; and the Sixth, Notification 134/2026, on Form 161).

**Form renumbering** (CBDT mapping data, confirmed against the Rules text):

| Old form (1962 Rules) | New form (2026 Rules) |
|---|---|
| 24Q / 26Q / 27Q | 138 / 140 / 144 |
| 27EQ | 143 |
| 26QF (VDA exchange) | 142 |
| 16 / 16A | 130 / 131 |
| 16B, 16C, 16D, 16E | 132 (one form) |
| 27D | 133 |
| 26QB, 26QC, 26QD, 26QE | 141 (one challan-cum-statement) |
| 24G | 137 (AIN application 136) |
| 15CA / 15CB | 145 / 146 |
| 15CC / 15CD | 147 / 148 |
| 15G and 15H | 121 (merged) |
| 60 / 61 | 97 / 98 |
| 61A / 61B | 165 / 166 |
| 3CA, 3CB, 3CD | 26 (Parts A-D) |
| 3CEB | 48 |
| 3CEAA / 3CEAB | 56 / 57 |
| 3CEAC / 3CEAD / 3CEAE | 58 / 59 / 60 |
| 10B and 10BB | 112 |
| 10BD / 10BE | 113 / 114 (research bodies: 15 / 16) |
| 49C | 162 |
| 67 | 44 (disputes: 45) |
| 10E | 39 |
| 26B (deductor refund) | 139 |
| 10-IEA (new-regime opt-out) | no equivalent found |

**Section renumbering for the rules in this file:** 139 to 263; 44AB to 63; 92E to 172; 92D to 171; 200 and 206C reporting to 397; 201 to 398; 203 to 395; 197A to 393(6)/(7); 195(6) to 397(3)(d); 208/211 to 404/408; 234A/234B/234C to 423/424/425; 234E to 427; 234F to 428; 234G to 429; 271B to 446 (since replaced by a fee in 428(c)); 271BA to 447 (omitted; now a fee in 428(d)); 271C/271CA to 448/449; 271FA to 454; 271GB to 459; 271GC to 460; 271H to 461; 271K to 464; 272A to 465; 271AA to 442; 276B to 476; 285 to 505; 285BA to 508; 286 to 511; 115BAC to 202; 12A audit to 348; 80G statement to 354; 40(a)(ia) to 35(b).

**Finance Act, 2026** (assent 30 March 2026; sections 2 to 129 in force 1 April 2026; the section 139 amendments are deemed effective from 1 March 2026):

- The ITR due-date table was replaced in both Acts. There is now a fourth tier: business or professional income without audit, and partners of non-audited firms, file by **31 August** (from AY 2026-27). The other tiers stay at 31 July, 31 October (audit cases) and 30 November (transfer pricing cases).
- Revised returns can now be filed up to 12 months after the year end (31 March) in both Acts. A fee of Rs 1,000/Rs 5,000 applies beyond nine months (new section 234-I in the 1961 Act; section 428(b) in the 2025 Act).
- Penalties became fixed fees in the 2025 Act: tax audit default to section 428(c) (Rs 75,000 for up to one month, Rs 1,50,000 after that); transfer pricing report to section 428(d) (Rs 50,000 / Rs 1,00,000); SFT and reportable accounts to section 427(3) (Rs 200 per day up to Rs 1,00,000). Section 454 (penalty after a notice) is capped at Rs 1,00,000. Section 446 now deals with crypto-asset statements.
- Section 393(7) was substituted: payers now deliver Form 121 (old 15G/15H) declarations quarterly, by the 7th of the month after each quarter. The original text required monthly delivery.
- From 1 October 2026, section 397(1)(c) lets resident individuals and HUFs buying property from a non-resident deduct TDS without a TAN. Notification 121/2026 brings these deductions into Form 141 (new Schedule E) and Form 132.
- The Act also changed TCS rates (mostly to 2%), DIN rules, and other items that do not affect due dates.

**Timing changes in the 2026 Rules compared with the 1962 Rules:**

- TCS statements (Form 143) are due on the same dates as TDS statements: 31 July, 31 October, 31 January and 31 May (rule 219(4)). They used to be due on the 15th.
- TCS certificates (Form 133) are due 15 days after the statement due date, so 15 August, 15 November, 15 February and 15 June. They used to be due on the 30th.
- TCS collected in March is now paid by 30 April (rule 218(2)(a) covers amounts "debited or received"). It used to be due on 7 April under rule 37CA.
- Form 121 Part B is uploaded quarterly by the 7th. The old 15G/15H upload was due on the 15th, or 30 April for the March quarter.
- Form 162 (liaison office statement) is due eight months after the year end. This is not new to the 2026 Rules: Notification 14/2025 (7 February 2025) had already changed old Form 49C from 60 days to eight months.
- Form 44 (foreign tax credit) is due within 12 months of the end of the tax year. That is the same day as the old Form 67 deadline (end of the assessment year), provided the return is filed in time.

**CBDT extensions in 2026:**

- Circular No. 07/2026 (28 September 2026, F. No. 225/128/2026/ITA-II) extended two AY 2026-27 dates for persons at Sl. No. 2 of the new table under Explanation 2 to section 139(1) (companies, audited non-company assessees, and partners of audited firms with clubbed spouses, where section 92E does not apply). The ITR date moved from 31 October 2026 to 21 November 2026. The tax audit "specified date" consequently moved from 30 September 2026 to 21 October 2026. The CBDT calendar applies the same 21 October 2026 date to Form 10B/10BB. Transfer pricing cases were not extended (ITR 30 November 2026; Form 3CEB 31 October 2026).
- Circular No. 02/2026 (25 March 2026) extended the Q3 FY 2025-26 TDS certificates to 31 March 2026. That falls before the site window and is mentioned only in notes.
- No extension of the 31 July 2026 or 31 August 2026 ITR dates, of the TDS/TCS statement dates, or of the SFT dates appears in the e-filing portal news (checked through 12 October 2026), in the 2026 circular list, or in the tax calendar.

**Other 2026 legislation checked, with no due-date impact:** the Income-tax (Amendment) Ordinance, 2026 (No. 2 of 2026, 5 June 2026; FII and BIS exemptions); the Taxation and Other Laws (Amendment) Bill, 2026 (introduced 4 August 2026; exemptions, and an eligible investment fund statement within 90 days); the Jan Vishwas (Amendment of Provisions) Act, 2026 (does not touch the Income-tax Acts); and Circular 4/2026 (DIN).

## Transition between the 1961 and 2025 Acts

Section 536(2)(c) of the 2025 Act keeps the 1961 Act alive for any proceeding relating to a tax year that began before 1 April 2026. CBDT's FAQs apply this as follows, and the rules file follows the same logic:

- **TDS and TCS** follow the Act in force on the earlier of payment or credit (for TCS, debit or receipt). Amounts paid or credited up to 31 March 2026 stay under the 1961 Act even when the tax is deposited after 1 April 2026; the old challan and AY 2026-27 apply (FAQ Q2.4, Q2.9, Q6.1, Q6.21). So the March 2026 deposits, the Q4 FY 2025-26 statements (24Q/26Q/27Q due 31 May 2026; 27EQ due 15 May 2026), the Q4 certificates and Form 16 for FY 2025-26 (15 June 2026) are all old-Act obligations. Corrections for old quarters also stay on the old forms (FAQ Q6.14).
- **Returns and audit reports for AY 2026-27** (FY 2025-26) use the 1961 Act and the old forms: ITR-1 to ITR-7, Forms 3CA/3CB/3CD, 3CEB, 3CEAA, 10B/10BB and 67 (FAQ Q3.5, Q3.25, Q4.32). The first new-Act returns and reports are for tax year 2026-27 and fall due from July 2027 (FAQ Q3.4, Q4.33).
- **Annual statements for FY 2025-26** (Forms 61A, 10BD/10BE and 49C) and Form 61B for calendar year 2025 were filed on the old forms; the CBDT calendar labels each of them "(Income-tax Rules, 1962)". For calendar year 2026, which straddles 1 April 2026, this file assumes Form 166 applies.
- **Advance tax** for tax year 2026-27 is paid under the 2025 Act from 15 June 2026 (FAQ Q2.19). AY 2026-27 interest stays under sections 234B and 234C (FAQ Q2.17).
- **Options** exercised under the 1961 Act carry over, for example the tax regime choice (section 536(2)(f); FAQ Q10.2, Q10.5).

**Use of `effective` in the JSON:** old-Act rules carry `{"from": null, "to": "2026-03-31"}`, so only periods that began before 1 April 2026 expand. New-Act rules carry `{"from": "2026-04-01"}`. The FATCA/CRS pair splits at the calendar year instead (`to` 2025-12-31 / `from` 2026-01-01). The ITR family (31 July, 31 August, 31 October, 30 November, belated, revised, updated) spans both Acts in single rules, because the dates are identical and only the section changes; the `law` field cites both. The 31 August rule and the 31 March revised-return rule start with FY 2025-26, the first year they apply.

## Leads from the brief: confirmed or refuted

**1. Form and section numbers.** All requested numbers were found and verified (table above), with one exception: no new form replaces 10-IEA. The 2026 Rules prescribe no opt-out form under section 202(4).

**2. Old-Act periods.** Confirmed. TDS for March 2026 was due 30 April 2026, Q4 statements 31 May 2026 for TDS and 15 May 2026 for TCS, Form 16 on 15 June 2026, and the AY 2026-27 ITRs and audits stay under the 1961 Act. One point to watch: FAQ Q6.10 puts 27EQ under 31 May 2026, but rule 31AA, the official Form 27EQ page and the tax calendar all say 15 May 2026, and the file follows them.

**3. ITR dates for AY 2026-27.** Confirmed with one change. Finance Act 2026 added 31 August for non-audit business and professional cases; the others remain 31 July, 31 October and 30 November. The reference site's Circular No. 07/2026 claim is confirmed from the primary PDF: ITR for Sl. No. 2 persons to 21 November 2026 and the audit report to 21 October 2026. It is recorded as overrides on `income-tax-itr-audit`, `income-tax-tax-audit-1961-act` and `income-tax-trust-audit-1961-act`. No 2026 extension of 31 July (or 31 August) was found.

**4. Belated, revised and updated returns.**
- Belated returns: 31 December 2026, confirmed.
- Revised returns: moved to 31 March 2027 by Finance Act 2026, confirmed, with a fee if filed after 31 December.
- Updated returns (ITR-U): 48 months, so 31 March 2031 for AY 2026-27 and 31 March 2032 for tax year 2026-27. In-window last dates are 31 March 2027 (AY 2022-23) and 31 March 2028 (AY 2023-24).
- Tax year 2026-27 returns fall due 31 July, 31 August, 31 October or 30 November 2027; the belated date is 31 December 2027 and the revised date 31 March 2028.

**5. Monthly items.**
- TDS deposit: confirmed.
- "March TCS due 7 April": correct for March 2026 under the old Act only. It is refuted from March 2027, when it becomes 30 April.
- Challan-cum-statements within 30 days: confirmed (Form 141). The certificate (Form 132) is due 45 days after month end.
- Form 24G/137 (15 days; 30 April for March): confirmed.
- Form 15CC/147 (15 days after quarter end): confirmed.
- 15G/15H statements: the old regime was quarterly by the 15th (30 April for the March quarter). Form 121 is now quarterly by the 7th.

**6. Quarterly items.**
- TDS statements: confirmed.
- TCS statements on the 15th: refuted for the 2025 Act (now the 31st). Still true for Q4 FY 2025-26 (15 May 2026).
- Non-salary certificates 15 days after the statement due date: confirmed. This moves TCS certificates to the 15th.
- Advance tax: confirmed (sections 403-408), including the single 15 March instalment for presumptive cases.

**7. Annual items.**
- Form 16/130 on 15 June: confirmed.
- SFT, reportable accounts and donation statements on 31 May: confirmed.
- Form 61/98 on 31 October and 30 April: confirmed.
- Trust audit one month before the ITR due date: confirmed.
- Liaison office statement within 60 days: refuted. It has been eight months since February 2025, so 30 November 2026 for FY 2025-26.
- Master file on 30 November: confirmed for transfer pricing cases.
- CbCR within 12 months: confirmed.
- Tax audit on 30 September: confirmed, extended to 21 October 2026 for AY 2026-27. In transfer pricing cases it is 31 October.
- TP report on 31 October: confirmed.
- Form 67 "on or before ITR filing": refuted. It is due by the end of the assessment year (31 March 2027) if the return was filed in time, or with an updated return. Form 44 is due within 12 months of the end of the tax year.

**8. Penalties.** All have equivalents in the 2025 Act:
- 234E maps to 427(1): Rs 200 per day, capped at the tax.
- 271H maps to 461: Rs 10,000 to Rs 1,00,000, with no penalty if the statement is filed within one month of the due date after paying tax, fee and interest.
- 201(1A) maps to 398(3)(a): 1% / 1.5% per month, now for TCS too.
- 234F maps to 428(a): Rs 1,000 / Rs 5,000.
- 271B is now the 428(c) fee and 271BA the 428(d) fee (see above).

## Open questions and items not fully verified

1. **Finance Act 2026 text.** The enacted text was read from TaxGuru's full reproduction, not the Gazette. It matches the Bill on every provision used here except clause numbering. The CBDT calendar and Circular 07/2026 independently reflect the new due-date table.
2. **Form 121 timing.** The Memorandum says the monthly-to-quarterly change takes effect on 1 April 2027, but the enacted text dates only the depository clause to 1 April 2027. CBDT's calendar shows quarterly dates for 2026-27 (7 July, 7 October and 7 January), and the DIT(Systems) notification speaks of "quarterly furnishing". EPFO (circular of 13 April 2026) still uploads monthly. The file uses quarterly dates.
3. **Section 234-I wording.** As enacted, it charges the fee for revised returns filed "beyond nine months but before twelve months from the end of the relevant assessment year". Read literally, that never bites, because the revised-return window itself closes at the end of the assessment year. The intended reading is January to March 2027.
4. **Old section 272A(2) per-day amount.** The incometaxindia.gov.in text of the 1961 Act shows Rs 100 per day; CBDT FAQ Q6.16 says Rs 500. The file uses Rs 100 for old-Act certificate and 24G defaults. New section 465(2) is Rs 500.
5. **Old section 271H(3) relief period.** The incometaxindia.gov.in text shows one year. A 2024 amendment reducing it to one month may exist but was not confirmed, so the old-Act penalty prose avoids stating the period. New section 461(2) says one month.
6. **March 2026 TCS deposit (7 April 2026).** This rests on old rule 37CA and TDSMAN's reminder. The CBDT calendar entry for 7 April 2026 covers government offices only. Confidence: medium.
7. **New-regime opt-out under the 2025 Act.** Section 202(4) says "in such manner as may be prescribed", but no form or rule was found in the 2026 Rules as notified. Confidence: medium.
8. **Assumptions.**
   - Form 166 is assumed for calendar year 2026, and the 1961 Act for the CbC report of the reporting year 2025-26.
   - CbCR and master-file schedules assume 31 March year ends. Groups with other year ends must count from their own year end.
   - Form 3CEAC/58 intimations (two months before the CbCR due date) are not modelled.
9. **Calendar data anomaly.** The CBDT calendar shows 7 October 2026 for the September 2026 Form 137, against rule 218(6) (15 days, so 15 October). The rule is followed.
10. **Unquantified penalties.** No dedicated fee or penalty section was identified for late Form 15CC/147/148 or Form 61/98, so their `exposure` objects carry no amounts.
11. **Simplifications.**
    - Tax audit reports in transfer pricing cases (31 October) are mentioned in the notes but not modelled as a separate rule.
    - Government-office deposit timings are described in `applicability` only: same day without a challan, otherwise the 7th, including 7 April for March.
    - The half-yearly pre-filling SFTs of depositories and RTAs (31 October and 30 April; DGIT(S) Notifications 1 and 2 of 2026) are mentioned in notes, not modelled.
12. **Not covered:**
    - Form 1 (stock exchange monthly statement, 15 days)
    - Form 164 (film producers, 60 days)
    - Form 163 (indirect transfers, 90 days)
    - Form 167 (crypto-asset reporting, 31 May)
    - Form 127 (TCS buyer declarations, by the 7th)
    - the superannuation fund statement (two months)
    - TAN applications (30 days)
    - Form 142 (VDA exchanges, same dates as TDS statements)
13. **Future changes.** The new ITR forms for tax year 2026-27 have not been notified yet. Any CBDT extension for tax year 2026-27 deadlines (for example October-November 2027) is obviously unknown. The Rules are being amended frequently, so form references should be rechecked before each tax season.
