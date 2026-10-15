// Second opinions on the holiday calendars abroad, from feeds their authorities (or a
// well-kept open project) publish. Report only: the lists stay as published, and a
// difference is for a person to resolve.

import type { HolidayList } from '../../src/lib/types.ts';

export interface CrossCheck {
  source: string;
  year: number;
  list: string;
  /** Dates in the feed that our list does not cover. */
  missing: string[];
  /** Our dates the feed does not have. */
  extra: string[];
  error?: string;
}

interface Check {
  source: string;
  list: (year: number) => string;
  url: (year: number) => string;
  accept: string;
  /** Dates the feed gives for the year; an empty result means the feed has nothing for it yet. */
  dates: (body: string, year: number) => string[];
  /** The feed lists only extra closures (Federal Register orders), so our other dates are not "extra". */
  additionsOnly?: boolean;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const pad = (n: number) => String(n).padStart(2, '0');

const CHECKS: Check[] = [
  {
    // OPM's own iCalendar feed of federal holidays (2021-2030); Inauguration Day is for the Washington area only.
    source: 'OPM federal holidays feed',
    list: (y) => `us-federal-${y}`,
    url: () => 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/holidays.ics',
    accept: 'text/calendar',
    dates: (body, y) =>
      body
        .split('BEGIN:VEVENT')
        .slice(1)
        .filter((e) => !/SUMMARY:[^\n]*Inauguration/i.test(e))
        .map((e) => /DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/.exec(e))
        .filter((m): m is RegExpExecArray => Boolean(m) && Number(m![1]) === y)
        .map((m) => `${m[1]}-${m[2]}-${m[3]}`),
  },
  {
    // Executive orders closing federal offices on extra days (24 and 26 December 2025, for example).
    source: 'Federal Register closure orders',
    list: (y) => `us-federal-${y}`,
    url: (y) =>
      'https://www.federalregister.gov/api/v1/documents.json?conditions[type][]=PRESDOCU&conditions[presidential_document_type][]=executive_order' +
      `&conditions[term]=%22closing%20of%20executive%20departments%22&conditions[publication_date][gte]=${y - 1}-12-01` +
      `&conditions[publication_date][lte]=${y}-12-31&fields[]=title&per_page=50`,
    accept: 'application/json',
    additionsOnly: true,
    dates: (body, y) => {
      const titles = ((JSON.parse(body) as { results?: { title: string }[] }).results ?? []).map((r) => r.title);
      const out: string[] = [];
      for (const t of titles) {
        for (const m of t.matchAll(/([A-Z][a-z]+) (\d{1,2}), (\d{4})/g)) {
          const month = MONTHS.indexOf(m[1].toLowerCase());
          if (month >= 0 && Number(m[3]) === y) out.push(`${m[3]}-${pad(month + 1)}-${pad(Number(m[2]))}`);
        }
      }
      return out;
    },
  },
  {
    // The Labour Program's dated list of Canada Labour Code general holidays (the data behind its pay calculator).
    source: 'Labour Program general holidays',
    list: (y) => `ca-federal-${y}`,
    url: () => 'https://wages-salaires.service.canada.ca/_conf/assets/js/general_holiday.js',
    accept: '*/*',
    dates: (body, y) => [...new Set([...body.matchAll(/"date":\s*"(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]))].filter((d) => d.startsWith(`${y}-`)),
  },
  {
    // Payments Canada's closure table: one table per year, the third column is the closure date.
    source: 'Payments Canada closure schedule',
    list: (y) => `ca-on-bank-${y}`,
    url: () => 'https://www.payments.ca/system-closure-schedule',
    accept: 'text/html',
    dates: (body, y) => {
      const section = new RegExp(`<h2[^>]*>\\s*${y}\\s*</h2>\\s*<table>([\\s\\S]*?)</table>`).exec(body)?.[1] ?? '';
      const out: string[] = [];
      for (const row of section.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
        const cells = [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, ' ').trim());
        const m = /([A-Za-z]+)\s+(\d{1,2})\s*$/.exec(cells[2] ?? '');
        const month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
        if (m && month >= 0) out.push(`${y}-${pad(month + 1)}-${pad(Number(m[2]))}`);
      }
      return out;
    },
  },
  {
    // canada-holidays.ca (MIT, not a government source); its Ontario list is the nine ESA public holidays.
    source: 'canada-holidays.ca',
    list: (y) => `ca-on-statutory-${y}`,
    url: (y) => `https://canada-holidays.ca/api/v1/provinces/ON?year=${y}`,
    accept: 'application/json',
    dates: (body) => ((JSON.parse(body) as { province?: { holidays?: { date: string }[] } }).province?.holidays ?? []).map((h) => h.date),
  },
];

function covered(list: HolidayList): Set<string> {
  const out = new Set<string>();
  for (const h of list.holidays) {
    out.add(h.date);
    if (h.actual) out.add(h.actual);
  }
  return out;
}

export async function crossChecks(lists: Map<string, HolidayList>, years: number[], ua: string): Promise<CrossCheck[]> {
  const out: CrossCheck[] = [];
  const bodies = new Map<string, Promise<string>>();
  const get = (url: string, accept: string) => {
    if (!bodies.has(url)) {
      bodies.set(
        url,
        fetch(url, { headers: { 'User-Agent': ua, Accept: accept }, signal: AbortSignal.timeout(30_000) }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        }),
      );
    }
    return bodies.get(url)!;
  };
  for (const y of years) {
    for (const c of CHECKS) {
      const list = lists.get(c.list(y));
      if (!list) continue;
      const result: CrossCheck = { source: c.source, year: y, list: list.id, missing: [], extra: [] };
      try {
        const theirs = new Set(c.dates(await get(c.url(y), c.accept), y));
        if (!theirs.size && !c.additionsOnly) throw new Error(`nothing published for ${y} yet`);
        const ours = covered(list);
        result.missing = [...theirs].filter((d) => !ours.has(d)).sort();
        if (!c.additionsOnly) {
          result.extra = list.holidays.filter((h) => !theirs.has(h.date) && !(h.actual && theirs.has(h.actual))).map((h) => h.date).sort();
        }
      } catch (e) {
        result.error = e instanceof Error ? e.message : String(e);
      }
      out.push(result);
    }
  }
  return out;
}
