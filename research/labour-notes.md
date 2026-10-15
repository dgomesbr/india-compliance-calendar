# Labour, state and miscellaneous compliance - research notes

Verified 2026-10-14. Companion to `labour.json`: 63 rules (14 labour, 37 state, 12 other; 35 high, 26 medium, 2 low confidence). The site window is due dates from 2026-04-01 to 2028-10-31.

## How this was researched

Many primary portals refuse connections from the research machine, which sits on a non-Indian network: epfindia.gov.in / epfo.gov.in (CloudFront 403), esic.gov.in, shramsuvidha.gov.in, mahagst.gov.in, most state commercial-tax and welfare-board sites, and the eGazette search. Primary text was reached by other routes instead. The Ministry of Labour's document API on labour.gov.in hosts the gazette PDFs of the four Central Rules and the 2026 notifications. EPFO's unified employer portal (unifiedportal-emp.epfindia.gov.in) links EPFO's own FAQ on the wage ceiling. Other routes were PIB press releases, India Code's API (state Acts and the ESI (General) Regulations), CPCB and FSSAI document links, and archived copies of official pages on the Wayback Machine. Where only secondary sources were available, the rule says so and carries medium or low confidence.

## Confirmed changes in 2025-2026

### The four Labour Codes

The Codes came into force on 21 Nov 2025 (S.O. 5319(E) Social Security, S.O. 5320(E) Industrial Relations, S.O. 5321(E) OSH, S.O. 5322(E) Wages). The Ministry's FAQ of 30 Dec 2025 says the General Clauses Act keeps old rules in force, to the extent they are consistent with the Codes, until new rules are finally notified. The Central Rules followed on 8 May 2026, in force on publication: Industrial Relations G.S.R. 342(E), Code on Wages G.S.R. 343(E), Social Security G.S.R. 344(E), OSH G.S.R. 345(E). They supersede, among others, the Payment of Bonus Rules 1975, the Minimum Wages (Central) Rules 1950, the Payment of Gratuity (Central) Rules 1972, the ESI (Central) Rules 1950, the Employment Exchanges (CNV) Rules 1960, the BOCW Cess Rules 1998, the Contract Labour Central Rules 1971 and the ISMW Central Rules 1979.

The single electronic return promised by the Ministry is real. Rules 72(5) and 74 of the OSH Central Rules and Rule 53(5) of the SS Central Rules require one annual return, FORM-XVII (called FORM-XXIII in the SS rules). It covers each calendar year and is due by the last day of February. Rule 48 of the Code on Wages rules routes wage-side returns into the same forms, and the IR rules put works committee details in it. The first one is for CY2026, due 28 Feb 2027.

Contractors get a half-yearly FORM-XVIII again, within 30 days after June and December (Rule 98(7)); the old central regime had dropped Form XXIV in 2018. Principal employers report their contractors in Part III of FORM-XVII.

Employment exchanges become career centres:
- Vacancy reporting in FORM-XXV is mandatory for public and private establishments from 90 days after 8 May 2026 (S.O. 2341(E)), about 6 Aug 2026.
- Vacancies paying under Rs 11,000 a month are exempt (S.O. 2343(E)).
- A yearly Employment Information Return (FORM-XXVI) is due within 30 days after 31 March, replacing the quarterly ER-I and the biennial ER-II.

Other changes under the Codes:
- **Registration update (one-off):** central-sphere establishments registered under old central laws must update their particulars in FORM-I within six months of 8 May 2026, i.e. by about 8 Nov 2026.
- **Interest on late dues:** Section 127 interest is 12% p.a. (S.O. 2357(E) for ESI; S.O. 2698(E) for EPF, deemed from 21 Nov 2025).
- **Bonus:** eligibility is wages up to Rs 21,000 a month, and the calculation ceiling is Rs 7,000 or the minimum wage, whichever is higher (S.O. 4711(E) and S.O. 4710(E), 25 Aug 2026, deemed from 21 Nov 2025). Payment is due within eight months of year end (Section 39).
- **BOCW cess:** re-notified at 1% (S.O. 2322(E)). The procedure is now Rules 41-43 of the SS Central Rules: advance self-assessed payment, Form-XV within 60 days of commencement, a Form-XVIII completion return within 60 days, and 1% a month interest.
- **Gig and platform aggregators:** Rule 49 requires a provisional contribution (Form-XX) by 30 June and a final return (Form-XXI) by 31 October. The Section 114(4) contribution rate had not been found as notified, so these may not yet be operative.
- **IR Code (Amendment) Act 2026** (16 Feb 2026, deemed from 21 Nov 2025): only fixes the repeal clause and keeps the old tribunals running.

### EPF and ESIC

- **New schemes:** the EPF Scheme 2026 (G.S.R. 525(E)), EPS 2026 and EDLI 2026 were notified on 29 Jun 2026, replacing the 1952, 1995 and 1976 schemes.
- **ECR due date unchanged:** still the 15th of the following month. EPFO's FAQ says the September 2026 ECR is due by 15 Oct 2026.
- **Wage ceiling:** S.O. 2702(E) (29 May 2026) re-notified Rs 15,000 under the Code, then S.O. 5109(E) raised it to Rs 25,000 from 17 Sep 2026. September 2026 is filed as one ECR with split ceilings.
- **One-time EPFO windows:** the Employees' Enrolment Campaign 2026 runs to 31 Oct 2026 and VISHWAS 2026 (damages settlement) to 28 Dec 2026. Both are modelled as one-time rules.
- **ELI scheme (PM-VBRY):** registration period 1 Aug 2025 - 31 Jul 2027. New UANs must be generated through Face Authentication on UMANG since 1 Aug 2025. There is no separate recurring Aadhaar-seeding deadline; the incentives depend on regular paid ECRs.
- **ESIC:** Regulation 31 still sets payment within 15 days of month end. In June 2025 ESIC decided to replace the graded damages (5% to 25% p.a.) with a flat 1% per month. SPREE-2025 closed on 31 Dec 2025 and the ESIC Amnesty Scheme 2025 on 30 Sep 2026.

### State levies

Professional tax:
- **Maharashtra:** a notification of 28 Feb 2026 amending Rule 11(3) appears on the department's own list. Secondary sources say it moves the monthly PTRC return and payment from the last day to the 15th of the return month (the month after the salary month) from March 2026, and the annual PTRC date from 31 March to 15 March. PTEC stays 30 June.
- **Karnataka:** Act 33 of 2025 sets Rs 300 for February. Under Act 22 of 2026, paying the enrolment tax counts as filing the return. Removal of Difficulties Order 01/2026 extended the FY 2026-27 enrolment payment to 5 May 2026.
- **Tamil Nadu:** half-yearly rates revised under the Urban Local Bodies Rules 2023.
- **Kerala:** rates revised by a G.O. of 27 Jun 2024.
- **West Bengal:** a draft new schedule was published on 18 Aug 2026.
- **Odisha:** profession tax repealed from 1 Apr 2026 by Ordinance 02 of 2026, with savings for past liabilities.

Labour welfare fund:
- **Maharashtra:** Rs 25 employee / Rs 75 employer per half-year (2024 amendment, applied from the June 2024 contribution).
- **Karnataka:** Rs 50 / Rs 100 a year (Act 05 of 2025); coverage widened to establishments with 10 or more persons from 7 Jan 2026 (Act 05 of 2026).
- **Madhya Pradesh:** employer share Rs 50 with a Rs 2,500 minimum per half-year from January 2026.
- **West Bengal:** employer share raised to Rs 30.

None of these state levies is touched by the Labour Codes.

### Environment, food and other

- **FSSAI:** licences became perpetual (amendment of 10 Mar 2026), and an unfiled annual return now deems the licence suspended. Licensing thresholds changed from 1 Apr 2026. The half-yearly Form D-2 for milk was discontinued in 2020.
- **EPR return extensions:** the e-waste, battery, used oil and tyre rules now let the Centre relax return deadlines by up to nine months, and it has done so every year. FY 2025-26 plastic returns were extended to 31 Dec 2026 for PIBOs and 31 Oct 2026 for processors (MoEFCC OM of 28 Aug 2026).
- **New rules:** the Solid Waste Management Rules 2026 apply from 1 Apr 2026; bulk waste generators file an annual return by 30 June, probably first on 30 Jun 2027. The End-of-Life Vehicles Rules 2025 are not modelled.
- **EP Act penalties:** the Jan Vishwas Act 2023 replaced imprisonment with penalties of Rs 10,000 to Rs 15 lakh plus Rs 10,000 a day. The Hazardous Waste Rules point to these since 12 Nov 2024.

## What happens to the legacy returns

The answer depends on which government is the "appropriate government". For central-sphere establishments, the old central rules ended on 8 May 2026 and the new unified forms apply. Most private employers are in the state sphere. For them, the Ministry's position is that existing rules continue until the State notifies final Code rules. In practice that means the old state forms and state due dates still apply in most States, while the obligations written into the Codes (wage definition, gratuity eligibility, interest) already apply everywhere.

- **Payment of Bonus Form D:** the Payment of Bonus Rules 1975 were central rules applying to every establishment, and they were superseded in full on 8 May 2026, so Form D no longer exists. Central-sphere employers report bonus in section H of FORM-XVII. For state-sphere employers no separate bonus return is prescribed until their State's Code on Wages rules say so. The old central unified annual return (Form XIV under the 2017 Rationalisation of Forms rules, due 1 February) last fell due on 1 Feb 2026.
- **Contract labour:** Forms XXIV and XXV had already been replaced in the central sphere by the 1 February unified return (G.S.R. 1594(E), 2017). They are now replaced by FORM-XVIII (half-yearly, contractors) and FORM-XVII Part III (annual, principal employers). State contract labour rules continue in States without final OSH rules.
- **Factories Act annual and half-yearly returns:** these are state rules, so they continue until the State's OSH rules are final. Dates differ by State, so they are not modelled.
- **ER-I / ER-II:** superseded on 8 May 2026 by Rule 56 of the SS Central Rules. The last ER-I would have covered January-March 2026 (due 30 Apr 2026); the yearly FORM-XXVI is first due 30 Apr 2027.
- **Maternity benefit:** central-sphere details go into FORM-XVII. State maternity-benefit annual returns continue where the State has not notified final SS rules.
- **Gratuity:** neither the old Act nor the Code has a periodic return. Paying gratuity within 30 days (Section 56) is an event obligation and is not modelled as a dated rule.

State-sphere rules are the largest gap. Secondary sources (September-October 2026) say only about 10-11 States/UTs had final Code rules. Maharashtra published draft rules on 28 Apr 2026 and was still at draft stage in late August, and Karnataka and Tamil Nadu are reported as drafts. No official consolidated list was found. Where a State has final rules, its forms and dates may differ from the central last-day-of-February date.

## Open questions and unverified items

1. **ESIC half-yearly return:** the India Code copy of the regulations still contains Regulation 26, a half-yearly return of contributions in Form 5 within 42 days. ESIC's online system generates it from monthly filings, but whether a separate filing is ever required was not confirmed on esic.gov.in.
2. **EPF Scheme 2026 text:** the gazette text was not opened. The damages table (0.25%, 0.50%, 1% a month) and the Rs 500 a day late fee for returns come from secondary sources. Whether the separate monthly IW-1 return for international workers survives was not verified.
3. **Aggregator contributions:** whether and when the Section 114(4) rate will be notified, which would make the Form-XX and Form-XXI rules operative.
4. **ESIC damages:** whether the amendment to Regulation 31-C (flat 1% a month) has been notified.
5. **Maharashtra PT:** the text of the 28 Feb 2026 notification, whether the monthly-filer threshold is still Rs 50,000 (one CA firm says Rs 1 lakh), and whether the annual date is now 15 March.
6. **Odisha PT:** PRS lists the Repeal Ordinance but no replacing Bill. If the ordinance lapsed, the levy would revive.
7. **Other PT dates:**
   - Gujarat: which employers file monthly and which quarterly.
   - West Bengal: whether employers pay by the 21st or the 15th, and whether there is an annual return.
   - Karnataka: the due date of the annual employer Form 5.
   - Assam: the last day (Rule 12) or the 28th (payroll sources).
   - Telangana and Andhra Pradesh: interest of 2% a month (Rule 24) or 1.25% (department FAQ).
8. **LWF:**
   - Odisha was left out because the rate and periodicity could not be confirmed.
   - Haryana's CPI-indexed cap for 2026 is unconfirmed.
   - Andhra Pradesh: Rs 30 / 70, or Rs 31 / 69 as one commercial table shows.
   - Delhi, Kerala and Telangana rates were not checked on live official pages.
   - The commencement date of West Bengal's 2023 penalty amendment was not found.
9. **POSH:** the Act and Rules fix calendar-year reporting but no submission date. 31 January is common practice, and no state order was opened.
10. **RERA:** quarterly windows vary by State. The rule uses Haryana's 15 days; MahaRERA was not reachable.
11. **Plastic EPR:** the 2023, 2024 and 2026 amendment texts were not opened. The FY 2025-26 extension was read from a copy of the MoEFCC OM hosted by a consultancy.
12. **E-waste and battery EPR:** the FY 2025-26 extensions (to 30 Sep 2026 and 30 Nov 2026) are reported only by a consultancy. They are kept in the notes, not as overrides.
13. **Karnataka gig-worker welfare fee:** a new state levy on aggregators, with a contested rollout in 2026. Not modelled.

## Researched but not included

These were left out to keep the file focused, or because they were not verifiable:
- Legacy and non-dated items: the legacy ER-I (last due 30 Apr 2026), paying wages on exit within two working days (Code on Wages s.17(2)), and paying gratuity within 30 days (SS Code s.56).
- Odisha: the monthly PT payment (last due 30 Apr 2026) and the Odisha LWF.
- Niche EPR returns: used oil and waste tyres (annual and quarterly), End-of-Life Vehicles (producers and bulk consumers by 30 June; scrapping facilities quarterly), battery recyclers' quarterly returns, and plastic waste processors' annual return (FY 2025-26 extended to 31 Oct 2026).
- Construction and demolition waste returns.
- Water cess (abolished in 2017) and Legal Metrology (no periodic return found).

## Rule ids

- **labour:** labour-epf-ecr-monthly, labour-esic-contribution-monthly, labour-wages-monthly-payment, labour-bonus-payment-annual, labour-codes-unified-annual-return, labour-codes-contractor-half-yearly-return, labour-career-centre-employment-return, labour-career-centre-vacancy-notice, labour-gig-aggregator-provisional-contribution, labour-gig-aggregator-final-return, labour-bocw-cess-completion-return, labour-osh-registration-update, labour-epfo-eec-2026-deadline, labour-epfo-vishwas-2026-deadline.
- **state - professional tax:** state-pt-mh-ptrc-monthly, state-pt-mh-ptrc-annual, state-pt-mh-ptec, state-pt-ka-monthly, state-pt-ka-enrolment, state-pt-wb-monthly, state-pt-wb-enrolment, state-pt-tn-employer-halfyearly, state-pt-tn-entity-halfyearly, state-pt-gj-monthly, state-pt-gj-quarterly, state-pt-gj-enrolment, state-pt-ts-monthly, state-pt-ts-enrolment, state-pt-ap-monthly, state-pt-ap-enrolment, state-pt-kl-halfyearly, state-pt-mp-monthly, state-pt-mp-quarterly-return, state-pt-mp-enrolment, state-pt-od-annual-return, state-pt-as-monthly.
- **state - labour welfare fund:** state-lwf-mh, state-lwf-ka, state-lwf-tn, state-lwf-ts, state-lwf-ap, state-lwf-gj, state-lwf-wb, state-lwf-mp, state-lwf-hr, state-lwf-pb, state-lwf-ch, state-lwf-dl, state-lwf-kl, state-lwf-ga, state-lwf-cg.
- **other:** other-fssai-annual-return-d1, other-epr-plastic-annual-return, other-ewaste-annual-return, other-ewaste-quarterly-return, other-battery-epr-annual-return, other-env-statement-form-v, other-hazardous-waste-annual-return, other-bmw-annual-report-form-iv, other-swm-bulk-waste-generator-annual-return, other-posh-ic-annual-report, other-rera-quarterly-update, other-rera-annual-audit-form5.

Telangana uses ISO code TS (ISO changed IN-TG to IN-TS on 23 Nov 2023) and Odisha uses OD.
