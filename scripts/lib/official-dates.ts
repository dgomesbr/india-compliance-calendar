// Official due-date feeds that can be read from a build runner, compared with what the
// calendar's rules produce. Report only: a difference is for a person to resolve, by
// recording an extension or fixing a rule.

import { fyLabel, fyStartYear, iso, type ISODate } from '../../src/lib/dates.ts';
import { expandRules } from '../../src/lib/schedule.ts';
import type { Bundle } from '../../src/lib/types.ts';
import { expandOptions } from '../../src/lib/view.ts';

export interface OfficialCheck {
  source: string;
  /** What was compared, e.g. "FY 2026-27" or "Sep 2026 returns". */
  window: string;
  items: number;
  /** Official dates with no matching obligation in the calendar. */
  unmatched: { date: ISODate; items: string[] }[];
  /** Calendar dates the official feed does not show (income tax only). */
  calendarOnly: { date: ISODate; codes: string[] }[];
  error?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function occurrencesByDate(bundle: Bundle, category: string, from: ISODate, to: ISODate): Map<ISODate, string[]> {
  const rules = bundle.rules.filter((r) => r.category === category && r.schedule);
  const byId = new Map(rules.map((r) => [r.id, r]));
  const out = new Map<ISODate, string[]>();
  for (const o of expandRules(rules, from, to, { ...expandOptions(bundle), confirmedThrough: undefined })) {
    out.set(o.due, [...(out.get(o.due) ?? []), byId.get(o.ruleId)!.code]);
  }
  return out;
}

/** The e-Filing portal's tax calendar for the current financial year. */
export async function incomeTaxCalendar(bundle: Bundle, today: ISODate, ua: string): Promise<OfficialCheck> {
  const fy = fyStartYear(today);
  const check: OfficialCheck = { source: 'Income Tax e-Filing tax calendar', window: fyLabel(fy), items: 0, unmatched: [], calendarOnly: [] };
  try {
    const r = await fetch('https://eportal.incometax.gov.in/iec/returnservicesapi/getEntity', {
      method: 'POST',
      headers: { 'User-Agent': ua, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ serviceName: 'taxCalendarServiceImpl', dueYear: fy, pan: '' }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const list = (await r.json()) as { dueDay: number; dueMonth: number; dueYear: number; formCd?: string; dueCategory?: string }[];
    if (!Array.isArray(list) || !list.length) throw new Error(`no items published for ${fyLabel(fy)}`);
    check.items = list.length;
    const official = new Map<ISODate, string[]>();
    for (const x of list) {
      const d = iso(x.dueYear, x.dueMonth, x.dueDay);
      const what = x.formCd?.trim() || x.dueCategory?.trim() || 'item';
      const items = official.get(d) ?? [];
      if (!items.includes(what)) items.push(what);
      official.set(d, items);
    }
    const ours = occurrencesByDate(bundle, 'income-tax', iso(fy, 4, 1), iso(fy + 1, 3, 31));
    check.unmatched = [...official.entries()].filter(([d]) => !ours.has(d)).map(([date, items]) => ({ date, items })).sort((a, b) => a.date.localeCompare(b.date));
    check.calendarOnly = [...ours.entries()].filter(([d]) => !official.has(d)).map(([date, codes]) => ({ date, codes })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    check.error = e instanceof Error ? e.message : String(e);
  }
  return check;
}

const MONTH: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

/** "Oct 22nd, 24th, 2026" -> two dates; text that is not a date gives none. */
export function portalDates(text: string): ISODate[] {
  const m = /^([A-Z][a-z]{2})\s+([\d\s,a-z]+?),?\s+(\d{4})$/.exec(text.trim());
  if (!m || !MONTH[m[1]]) return [];
  return [...m[2].matchAll(/(\d{1,2})(?:st|nd|rd|th)/g)].map((x) => `${m[3]}-${pad(MONTH[m[1]])}-${pad(Number(x[1]))}`);
}

/** The GST portal's due dates for the current return period. */
export async function gstPortalDates(bundle: Bundle, ua: string): Promise<OfficialCheck> {
  const check: OfficialCheck = { source: 'GST portal due dates', window: 'current return period', items: 0, unmatched: [], calendarOnly: [] };
  try {
    const r = await fetch('https://www.gst.gov.in/fomessage/impdts', { headers: { 'User-Agent': ua, Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const body = (await r.json()) as { data?: string };
    const items = JSON.parse(body.data ?? '[]') as { f: string; d: string }[];
    check.items = items.length;
    const dated = items.map((x) => ({ form: x.f.split(/\s|\(/)[0], label: x.f.trim(), dates: portalDates(x.d) })).filter((x) => x.dates.length);
    if (!dated.length) throw new Error('no dated items');
    const all = dated.flatMap((x) => x.dates).sort();
    const ours = occurrencesByDate(bundle, 'gst', all[0], all[all.length - 1]);
    for (const x of dated) {
      for (const d of x.dates) {
        if (!(ours.get(d) ?? []).some((code) => code.startsWith(x.form))) check.unmatched.push({ date: d, items: [x.label] });
      }
    }
    const months = [...new Set(all.map((d) => d.slice(0, 7)))];
    check.window = `due ${months.join(', ')}`;
  } catch (e) {
    check.error = e instanceof Error ? e.message : String(e);
  }
  return check;
}
