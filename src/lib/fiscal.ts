// The entity's own financial year.
//
// Indian law fixes the financial year at 1 April to 31 March. A company that is a holding
// company, subsidiary or associate of a company incorporated outside India may be allowed
// another period by the Tribunal, to match its group's consolidation (proviso to section 2(41),
// Companies Act 2013); an LLP in that position may be allowed one by the Central Government
// (section 2(1)(l), LLP Act 2008). Rules marked `entityYear` follow that year: the AGM and the
// filings that run from it, cost audit, LLP returns, SEBI results and annual filings, and the
// FEMA activity certificate. Income tax, TDS and GST always run April to March.

import { fyKey, fyLabel, iso, lastDayOfMonth, MONTHS_LONG, MONTHS_SHORT, pad2, parts, shiftMonth, type ISODate } from './dates.ts';

/** First month of the Indian financial year. */
export const INDIAN_FY_START = 4;

export function isFyStart(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12;
}

/** Month (1-12) in which a year starting in `start` ends. */
export function fyEndMonth(start: number): number {
  return start === 1 ? 12 : start - 1;
}

/** First month of the year that ends in `end`. */
export function fyStartOf(end: number): number {
  return end === 12 ? 1 : end + 1;
}

/** Calendar year in which the entity's year containing `date` starts. */
export function entityStartYear(date: ISODate, start = INDIAN_FY_START): number {
  const { y, m } = parts(date);
  return m >= start ? y : y - 1;
}

/** Period key of the year starting in `startYear`: "FY2026-27" for April years, "FYE2026-12" (year ending December 2026) otherwise. */
export function yearKey(startYear: number, start = INDIAN_FY_START): string {
  if (start === INDIAN_FY_START) return fyKey(startYear);
  return `FYE${start === 1 ? startYear : startYear + 1}-${pad2(fyEndMonth(start))}`;
}

/** "FY 2026-27"; "FY 2026 (Jan-Dec)"; "FY 2026-27 (Jul-Jun)". `span: false` drops the months. */
export function yearLabel(startYear: number, start = INDIAN_FY_START, span = true): string {
  if (start === INDIAN_FY_START) return fyLabel(startYear);
  const name = start === 1 ? `FY ${startYear}` : fyLabel(startYear);
  return span ? `${name} (${MONTHS_SHORT[start - 1]}-${MONTHS_SHORT[fyEndMonth(start) - 1]})` : name;
}

export interface EntityYear {
  startYear: number;
  from: ISODate;
  to: ISODate;
  key: string;
  label: string;
}

/** The entity's year starting in `startYear`. */
export function entityYear(startYear: number, start = INDIAN_FY_START): EntityYear {
  const end = shiftMonth(startYear, start, 11);
  return {
    startYear,
    from: iso(startYear, start, 1),
    to: lastDayOfMonth(end.y, end.m),
    key: yearKey(startYear, start),
    label: yearLabel(startYear, start),
  };
}

/** The entity's year containing `date`. */
export function entityYearOf(date: ISODate, start = INDIAN_FY_START): EntityYear {
  return entityYear(entityStartYear(date, start), start);
}

/** The quarter of the entity's year containing `date`, moved by `offset` quarters: "Q3 FY 2026-27", "Q4 FY 2026". */
export function entityQuarter(date: ISODate, offset = 0, start = INDIAN_FY_START): { from: ISODate; to: ISODate; label: string } {
  const { y, m } = parts(date);
  const into = (m - start + 12) % 12;
  const first = shiftMonth(y, m, -(into % 3) + offset * 3);
  const last = shiftMonth(first.y, first.m, 2);
  const q = Math.floor(((first.m - start + 12) % 12) / 3) + 1;
  const sy = first.m >= start ? first.y : first.y - 1;
  return { from: iso(first.y, first.m, 1), to: lastDayOfMonth(last.y, last.m), label: `Q${q} ${yearLabel(sy, start, false)}` };
}

/** "April to March" */
export function describeYear(start = INDIAN_FY_START): string {
  return `${MONTHS_LONG[start - 1]} to ${MONTHS_LONG[fyEndMonth(start) - 1]}`;
}
