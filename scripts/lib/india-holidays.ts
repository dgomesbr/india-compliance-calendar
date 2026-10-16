// Official Indian holiday sources the monthly update can read: RBI's holiday matrix
// (bank holidays by regional office), the National Portal of India's holiday CMS (the
// DoPT central list) and NSE's holiday API (trading and settlement). Each returns plain
// {date, name} lists per year, or throws with a reason the update reports.

import type { ISODate } from '../../src/lib/dates.ts';

export interface SourceHoliday {
  date: ISODate;
  name: string;
}

export const UA = 'india-compliance-calendar/0.1 (+https://github.com/dgomesbr/india-compliance-calendar; monthly holiday update)';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
const pad = (n: number) => String(n).padStart(2, '0');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Curly quotes and long dashes, built from code points so this file stays ASCII.
const SINGLE_QUOTES = new RegExp(`[${String.fromCharCode(0x2018, 0x2019, 0x02bc)}]`, 'g');
const DOUBLE_QUOTES = new RegExp(`[${String.fromCharCode(0x201c, 0x201d)}]`, 'g');
const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`, 'g');

/** Holiday data stays ASCII: straight quotes, plain dashes, nothing else outside the range. */
export function asciiName(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- RBI holiday matrix ----------

/** Our state bank lists and the RBI regional office each one follows. */
export const RBI_OFFICES: Record<string, { id: string; office: string }> = {
  MH: { id: '28', office: 'Mumbai' },
  DL: { id: '30', office: 'New Delhi' },
  KA: { id: '3', office: 'Bengaluru' },
  TN: { id: '16', office: 'Chennai' },
  WB: { id: '26', office: 'Kolkata' },
  TS: { id: '18', office: 'Hyderabad' },
  GJ: { id: '1', office: 'Ahmedabad' },
  KL: { id: '24', office: 'Kochi' },
  UP: { id: '27', office: 'Lucknow' },
  RJ: { id: '19', office: 'Jaipur' },
  BR: { id: '32', office: 'Patna' },
  OD: { id: '11', office: 'Bhubaneswar' },
  AS: { id: '17', office: 'Guwahati' },
  MP: { id: '10', office: 'Bhopal' },
  AP: { id: '76', office: 'Vijayawada' },
  GA: { id: '31', office: 'Panaji' },
  JH: { id: '69', office: 'Ranchi' },
};

const RBI_URL = 'https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx';

/** Rows of a regional office's "All Months" holiday list for a year. */
export function parseRbiList(html: string, year: number): SourceHoliday[] {
  const start = html.indexOf('holiday list for the year');
  if (start < 0) return [];
  const out: SourceHoliday[] = [];
  let month = 0;
  for (const m of html.slice(start).matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const row = m[1];
    const head = /dop_header[^>]*>\s*([A-Za-z]+)/.exec(row);
    if (head) {
      month = MONTHS.indexOf(head[1].toLowerCase()) + 1;
      continue;
    }
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (month > 0 && cells.length >= 2 && /^\d{1,2}$/.test(cells[0])) {
      out.push({ date: `${year}-${pad(month)}-${pad(Number(cells[0]))}`, name: asciiName(cells[1]) });
    }
  }
  return out;
}

function hidden(html: string, id: string): string {
  return new RegExp(`id="${id}" value="([^"]*)"`).exec(html)?.[1] ?? '';
}

/** Bank holidays per state code for a year, one form post per regional office, a second apart. */
export async function rbiHolidays(year: number, scopes: string[]): Promise<Map<string, SourceHoliday[]>> {
  const first = await fetch(RBI_URL, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(40_000) });
  if (!first.ok) throw new Error(`HTTP ${first.status}`);
  let page = await first.text();
  const cookie = (first.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  const years = [...page.matchAll(/<option[^>]*value="(\d{4})"/g)].map((m) => Number(m[1]));
  if (!years.includes(year)) throw new Error(`RBI has not published ${year} yet`);
  const out = new Map<string, SourceHoliday[]>();
  for (const scope of scopes) {
    const office = RBI_OFFICES[scope];
    if (!office) continue;
    const body = new URLSearchParams({
      __VIEWSTATE: hidden(page, '__VIEWSTATE'),
      __VIEWSTATEGENERATOR: hidden(page, '__VIEWSTATEGENERATOR'),
      __EVENTVALIDATION: hidden(page, '__EVENTVALIDATION'),
      drRegionalOffice: office.id,
      drMonth: '0',
      drYear: String(year),
      btnGo: 'GO',
    });
    const r = await fetch(RBI_URL, {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Referer: RBI_URL, ...(cookie ? { Cookie: cookie } : {}) },
      body,
      signal: AbortSignal.timeout(40_000),
    });
    if (r.ok) {
      page = await r.text();
      const list = parseRbiList(page, year);
      if (list.length) out.set(scope, list);
    }
    await wait(1000);
  }
  if (!out.size) throw new Error('no office list could be read');
  return out;
}

// ---------- National Portal of India (DoPT central list) ----------

interface PortalItem {
  title?: string;
  date?: string;
  holiday_type?: string;
  attributes?: PortalItem;
}

/** Central gazetted and restricted holidays for a year, from the portal's CMS proxy. */
export async function portalHolidays(year: number): Promise<{ gazetted: SourceHoliday[]; restricted: SourceHoliday[] }> {
  const route = `/api/calendar-holidays?filters[date][$gte]=${year}-01-01&filters[date][$lte]=${year}-12-31&pagination[pageSize]=100`;
  const r = await fetch('https://www.india.gov.in/internal/cms', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ route }),
    signal: AbortSignal.timeout(40_000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const items = ((await r.json()) as { data?: PortalItem[] }).data ?? [];
  const gazetted: SourceHoliday[] = [];
  const restricted: SourceHoliday[] = [];
  for (const raw of items) {
    const x = raw.attributes ?? raw;
    if (!x.date || !x.title || !x.date.startsWith(String(year))) continue;
    const h = { date: x.date.slice(0, 10), name: asciiName(x.title) };
    if (/gazetted/i.test(x.holiday_type ?? '')) gazetted.push(h);
    else if (/restricted/i.test(x.holiday_type ?? '')) restricted.push(h);
  }
  if (!gazetted.length) throw new Error(`no central holidays published for ${year}`);
  return { gazetted, restricted };
}

// ---------- NSE ----------

/** "26-Jan-2026" -> 2026-01-26. */
export function nseDate(s: string): ISODate | null {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(s.trim());
  const month = m ? SHORT.indexOf(m[2].toLowerCase()) + 1 : 0;
  return m && month ? `${m[3]}-${pad(month)}-${pad(Number(m[1]))}` : null;
}

/** Capital-market segment holidays for a year: type "trading" or "clearing" (settlement). */
export async function nseHolidays(type: 'trading' | 'clearing', year: number): Promise<SourceHoliday[]> {
  const r = await fetch(`https://www.nseindia.com/api/holiday-master?type=${type}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(40_000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const body = (await r.json()) as Record<string, { tradingDate?: string; description?: string }[]>;
  const out: SourceHoliday[] = [];
  for (const x of body.CM ?? []) {
    const d = x.tradingDate ? nseDate(x.tradingDate) : null;
    if (d && d.startsWith(String(year))) out.push({ date: d, name: asciiName(x.description ?? 'Exchange holiday') });
  }
  if (!out.length) throw new Error(`no ${type} holidays for ${year}`);
  return out;
}
