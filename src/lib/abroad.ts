// Holiday calendars outside India (Canada, Ontario, United States). They are shown
// beside the Indian ones for teams that pay, file or meet across borders, and never
// move or flag an Indian due date. The rules here cross-check the published lists
// and let the source refresher draft a coming year before its authority publishes it.

import { addDays, daysInMonth, iso, weekday, type ISODate } from './dates.ts';
import type { Bundle, Holiday, HolidayList } from './types.ts';

export const ABROAD = ['CA', 'CA-ON', 'US'] as const;
export type Abroad = (typeof ABROAD)[number];

export const ABROAD_LABEL: Record<Abroad, string> = {
  CA: 'Canada',
  'CA-ON': 'Ontario',
  US: 'United States',
};

/** The country a scope belongs to, for grouping a day's holidays. */
export const ABROAD_COUNTRY: Record<Abroad, 'CA' | 'US'> = { CA: 'CA', 'CA-ON': 'CA', US: 'US' };
export const COUNTRY_LABEL: Record<'CA' | 'US', string> = { CA: 'Canada', US: 'US' };

export function isAbroad(list: Pick<HolidayList, 'scope'>): boolean {
  return (ABROAD as readonly string[]).includes(list.scope);
}

/** One holiday abroad on one date, merged across the lists that carry it. */
export interface AbroadHoliday {
  country: 'CA' | 'US';
  name: string;
  /** Scopes where it is a statutory or federal holiday. */
  statutory: Abroad[];
  /** Banks or the central payment system are closed. */
  bankClosed: boolean;
  notes: string[];
  /** Source URLs of the lists that carry it. */
  sources: string[];
}

/** Holidays abroad by date for the chosen scopes, merged by country and name. */
export function abroadDays(bundle: Pick<Bundle, 'holidays'>, scopes: readonly string[]): Map<ISODate, AbroadHoliday[]> {
  const out = new Map<ISODate, AbroadHoliday[]>();
  for (const list of bundle.holidays) {
    if (!isAbroad(list) || !scopes.includes(list.scope)) continue;
    const scope = list.scope as Abroad;
    const country = ABROAD_COUNTRY[scope];
    for (const h of list.holidays) {
      const day = out.get(h.date) ?? [];
      const key = baseName(h.name);
      let entry = day.find((e) => e.country === country && baseName(e.name) === key);
      if (!entry) {
        entry = { country, name: h.name, statutory: [], bankClosed: false, notes: [], sources: [] };
        day.push(entry);
      }
      if (list.kind === 'bank') entry.bankClosed = true;
      else if (!entry.statutory.includes(scope)) entry.statutory.push(scope);
      if (h.note && !entry.notes.includes(h.note)) entry.notes.push(h.note);
      if (!entry.sources.includes(list.source.url)) entry.sources.push(list.source.url);
      out.set(h.date, day);
    }
  }
  for (const day of out.values()) day.sort((a, b) => a.country.localeCompare(b.country));
  return out;
}

/** "Thanksgiving", "Thanksgiving Day" and "Boxing Day (December 26)" name the same holidays across lists. */
function baseName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+day$/i, '')
    .trim()
    .toLowerCase();
}

/** What a day's holiday means abroad, in a few words: "federal holiday; Federal Reserve closed". */
export function abroadMeaning(h: AbroadHoliday): string {
  const parts: string[] = [];
  if (h.country === 'US') {
    if (h.statutory.length) parts.push('federal holiday');
    parts.push(h.bankClosed ? 'Federal Reserve closed' : 'Federal Reserve open');
    return parts.join('; ');
  } else {
    const fed = h.statutory.includes('CA');
    const on = h.statutory.includes('CA-ON');
    if (fed && on) parts.push('federal and Ontario statutory holiday');
    else if (fed) parts.push('federal statutory holiday');
    else if (on) parts.push('Ontario public holiday');
    if (h.bankClosed) parts.push('payment systems closed');
  }
  return parts.join('; ');
}

// ---------- rules ----------

/** The nth weekday (0 = Sunday) of a month; n = -1 is the last. */
export function nthWeekday(y: number, m: number, dow: number, n: number): ISODate {
  if (n > 0) {
    const first = weekday(iso(y, m, 1));
    return iso(y, m, 1 + ((dow - first + 7) % 7) + (n - 1) * 7);
  }
  const lastDay = daysInMonth(y, m);
  const last = weekday(iso(y, m, lastDay));
  return iso(y, m, lastDay - ((last - dow + 7) % 7));
}

/** Easter Sunday in the Gregorian calendar (anonymous Gregorian algorithm). */
export function easter(y: number): ISODate {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(y, month, day);
}

/** Victoria Day: the Monday before 25 May. */
export function victoriaDay(y: number): ISODate {
  const d = iso(y, 5, 24);
  return addDays(d, -((weekday(d) + 6) % 7));
}

interface RuleDay {
  name: string;
  date: (y: number) => ISODate;
}

const fixed = (m: number, d: number) => (y: number) => iso(y, m, d);

const US_HOLIDAYS: RuleDay[] = [
  { name: "New Year's Day", date: fixed(1, 1) },
  { name: 'Birthday of Martin Luther King, Jr.', date: (y) => nthWeekday(y, 1, 1, 3) },
  { name: "Washington's Birthday", date: (y) => nthWeekday(y, 2, 1, 3) },
  { name: 'Memorial Day', date: (y) => nthWeekday(y, 5, 1, -1) },
  { name: 'Juneteenth National Independence Day', date: fixed(6, 19) },
  { name: 'Independence Day', date: fixed(7, 4) },
  { name: 'Labor Day', date: (y) => nthWeekday(y, 9, 1, 1) },
  { name: 'Columbus Day', date: (y) => nthWeekday(y, 10, 1, 2) },
  { name: 'Veterans Day', date: fixed(11, 11) },
  { name: 'Thanksgiving Day', date: (y) => nthWeekday(y, 11, 4, 4) },
  { name: 'Christmas Day', date: fixed(12, 25) },
];

const CA_FEDERAL: RuleDay[] = [
  { name: "New Year's Day", date: fixed(1, 1) },
  { name: 'Good Friday', date: (y) => addDays(easter(y), -2) },
  { name: 'Victoria Day', date: victoriaDay },
  { name: 'Canada Day', date: fixed(7, 1) },
  { name: 'Labour Day', date: (y) => nthWeekday(y, 9, 1, 1) },
  { name: 'National Day for Truth and Reconciliation', date: fixed(9, 30) },
  { name: 'Thanksgiving Day', date: (y) => nthWeekday(y, 10, 1, 2) },
  { name: 'Remembrance Day', date: fixed(11, 11) },
  { name: 'Christmas Day', date: fixed(12, 25) },
  { name: 'Boxing Day', date: fixed(12, 26) },
];

const ON_PUBLIC: RuleDay[] = [
  { name: "New Year's Day", date: fixed(1, 1) },
  { name: 'Family Day', date: (y) => nthWeekday(y, 2, 1, 3) },
  { name: 'Good Friday', date: (y) => addDays(easter(y), -2) },
  { name: 'Victoria Day', date: victoriaDay },
  { name: 'Canada Day', date: fixed(7, 1) },
  { name: 'Labour Day', date: (y) => nthWeekday(y, 9, 1, 1) },
  { name: 'Thanksgiving Day', date: (y) => nthWeekday(y, 10, 1, 2) },
  { name: 'Christmas Day', date: fixed(12, 25) },
  { name: 'Boxing Day', date: fixed(12, 26) },
];

// Payments Canada closes Lynx and the ACSS on the ten federal statutory holidays only;
// Easter Monday, Family Day and the Civic Holiday are processing days.
const ON_BANK: RuleDay[] = CA_FEDERAL;

export const RULE_CALENDARS = ['ca-federal', 'ca-on-statutory', 'ca-on-bank', 'us-federal', 'us-fed-bank'] as const;
export type RuleCalendar = (typeof RULE_CALENDARS)[number];

export const RULE_SCOPE: Record<RuleCalendar, { scope: Abroad; kind: 'statutory' | 'bank' }> = {
  'ca-federal': { scope: 'CA', kind: 'statutory' },
  'ca-on-statutory': { scope: 'CA-ON', kind: 'statutory' },
  'ca-on-bank': { scope: 'CA-ON', kind: 'bank' },
  'us-federal': { scope: 'US', kind: 'statutory' },
  'us-fed-bank': { scope: 'US', kind: 'bank' },
};

const isSat = (d: ISODate) => weekday(d) === 6;
const isSun = (d: ISODate) => weekday(d) === 0;
const dayName = (d: ISODate) => (isSat(d) ? 'Saturday' : 'Sunday');

/**
 * Dates a calendar closes in a year, from its rule.
 * - US federal: a Saturday holiday is observed the Friday before, a Sunday one the Monday after
 *   (so New Year's Day of the next year can fall on 31 December).
 * - Federal Reserve: closed the Monday after a Sunday holiday; open the Friday before a Saturday one.
 * - Canada and Ontario statutory: the legal date; weekend falls carry a note, since substitute days
 *   are set employer by employer.
 * - Ontario banks: a weekend holiday moves to the next business day.
 */
export function ruleHolidays(cal: RuleCalendar, year: number): Holiday[] {
  if (cal === 'us-federal') {
    const out: Holiday[] = [];
    for (const y of [year, year + 1]) {
      for (const r of US_HOLIDAYS) {
        const d = r.date(y);
        const observed = isSat(d) ? addDays(d, -1) : isSun(d) ? addDays(d, 1) : d;
        if (Number(observed.slice(0, 4)) !== year) continue;
        out.push(observed === d ? { date: d, name: r.name } : { date: observed, name: r.name, actual: d, note: `Observed; the legal holiday is a ${dayName(d)}.` });
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }
  if (cal === 'us-fed-bank') {
    return US_HOLIDAYS.map((r): Holiday => {
      const d = r.date(year);
      if (isSun(d)) return { date: addDays(d, 1), name: r.name, actual: d, note: 'Closed on Monday; the holiday is a Sunday.' };
      if (isSat(d)) return { date: d, name: r.name, note: 'A Saturday; Reserve Banks are open the Friday before.' };
      return { date: d, name: r.name };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }
  if (cal === 'ca-on-bank') {
    const taken = new Set<ISODate>();
    const out: Holiday[] = [];
    for (const r of ON_BANK) {
      const d = r.date(year);
      let day = d;
      while (isSat(day) || isSun(day) || taken.has(day)) day = addDays(day, 1);
      taken.add(day);
      out.push(day === d ? { date: d, name: r.name } : { date: day, name: r.name, actual: d, note: `Closure for ${r.name}, which falls on a ${dayName(d)}.` });
    }
    return out.filter((h) => Number(h.date.slice(0, 4)) === year).sort((a, b) => a.date.localeCompare(b.date));
  }
  const rules = cal === 'ca-federal' ? CA_FEDERAL : ON_PUBLIC;
  return rules
    .map((r): Holiday => {
      const d = r.date(year);
      // The Holidays Act keeps Canada Day on Monday 2 July when 1 July is a Sunday.
      if (r.name === 'Canada Day' && isSun(d)) return { date: addDays(d, 1), name: 'Canada Day', actual: d, note: '1 July is a Sunday; Canada Day is kept on Monday 2 July (Holidays Act).' };
      if (isSat(d) || isSun(d)) return { date: d, name: r.name, note: `A ${dayName(d)}: where it is a non-working day, a substitute day off applies.` };
      return { date: d, name: r.name };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Defaults for a calendar with no published list yet; the refresher copies the latest list's when it has one. */
export const RULE_META: Record<RuleCalendar, { title: (y: number) => string; authority: string; source: { title: string; url: string } }> = {
  'ca-federal': {
    title: (y) => `Canada federal statutory holidays ${y} (Canada Labour Code general holidays)`,
    authority: 'Employment and Social Development Canada, Labour Program (Canada Labour Code, R.S.C. 1985, c. L-2, s. 166)',
    source: { title: 'Labour Program general holiday pay calculator (lists each general holiday with its date)', url: 'https://wages-salaires.service.canada.ca/en/gen_holiday/index.html' },
  },
  'ca-on-statutory': {
    title: (y) => `Ontario public holidays ${y} (Employment Standards Act, 2000)`,
    authority: 'Ontario Ministry of Labour, Immigration, Training and Skills Development',
    source: { title: 'Your guide to the Employment Standards Act - public holidays', url: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays' },
  },
  'ca-on-bank': {
    title: (y) => `Ontario bank holidays ${y}: Canadian payment system closures (Payments Canada Lynx and ACSS)`,
    authority: 'Payments Canada (operator of Lynx and the ACSS)',
    source: { title: 'Payments Canada, system closure schedule', url: 'https://www.payments.ca/system-closure-schedule' },
  },
  'us-federal': {
    title: (y) => `US federal holidays ${y} (5 U.S.C. 6103)`,
    authority: 'U.S. Office of Personnel Management',
    source: { title: 'OPM - Federal holidays', url: 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/' },
  },
  'us-fed-bank': {
    title: (y) => `Federal Reserve bank holidays ${y}`,
    authority: 'Board of Governors of the Federal Reserve System',
    source: { title: 'Holidays observed by the Federal Reserve System', url: 'https://www.federalreserve.gov/aboutthefed/k8.htm' },
  },
};
