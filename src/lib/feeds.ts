// Calendar feed content shared by the ICS endpoints.

import { abroadDays, abroadMeaning } from './abroad.ts';
import { addDays, addMonths } from './dates.ts';
import { exposureLine } from './exposure.ts';
import { buildCalendar, type CalendarEvent } from './ics.ts';
import { buildDate, getBundle, occurrencesBetween, SITE_URL } from './site-data.ts';
import { CATEGORY_LABEL, type Rule } from './types.ts';
import { describeFollows } from './schedule.ts';
import { rulesById } from './view.ts';

/** The feed's line on a chained date: what it runs from, and that it counts from the deadline. */
function chainLine(r: Rule, all: ReadonlyMap<string, Rule>): string {
  const f = r.schedule?.follows;
  const code = f && all.get(f.rule)?.code;
  if (!f || !code) return '';
  const text = describeFollows(f, code);
  if (f.earlier) return `${text[0].toUpperCase()}${text.slice(1)}.`;
  const dated = (f.from ?? 'done') === 'done' ? ` (counted from the ${code} deadline; the overview uses the real date once it is recorded)` : '';
  return `${text[0].toUpperCase()}${text.slice(1)}${dated}.`;
}

export function feedFor(name: string, description: string, rules: Rule[], months = 24): string {
  const today = buildDate();
  const byId = new Map(rules.map((r) => [r.id, r]));
  const all = rulesById(getBundle());
  const occs = occurrencesBetween(addDays(today, -31), addMonths(today, months), rules);
  const events: CalendarEvent[] = occs.map((o) => {
    const r = byId.get(o.ruleId)!;
    // Kept short: subscribers get the essentials, the entry page has the rest.
    const lines = [
      `${r.title} - ${o.periodLabel}`,
      o.extended ? `Extended from ${o.originalDue}: ${o.extended.reason}` : '',
      o.projected ? 'Projected from the standing rule; confirm closer to the date.' : '',
      o.chain ? chainLine(r, all) : '',
      r.schedule?.entityYear ? 'Counts from an April-March financial year.' : '',
      `Law: ${r.law}`,
      `If 30 days late: ${exposureLine(r)}`,
      `Source: ${r.sources[0]?.url ?? ''}`,
      `Details: ${SITE_URL}o/${r.id}/`,
      'Information only, not legal advice.',
    ].filter(Boolean);
    return {
      uid: `${o.key}@india-compliance-calendar`,
      date: o.due,
      summary: `${r.code} due - ${o.periodLabel}${o.extended ? ' (extended)' : ''}`,
      description: lines.join('\n'),
      url: `${SITE_URL}o/${r.id}/`,
      categories: [CATEGORY_LABEL[r.category]],
      alarmsDaysBefore: [7, 1],
    };
  });
  return buildCalendar({ name, description, stamp: new Date(`${getBundle().meta.generated}`), events });
}

/** Holiday calendars to subscribe to: India's central list and the calendars abroad. */
export const HOLIDAY_FEEDS = {
  in: { name: 'India - Central Government holidays', scopes: [] as string[] },
  ca: { name: 'Canada - federal statutory holidays', scopes: ['CA'] },
  'ca-on': { name: 'Ontario - public and bank holidays', scopes: ['CA-ON'] },
  us: { name: 'United States - federal and Federal Reserve holidays', scopes: ['US'] },
};
export type HolidayFeed = keyof typeof HOLIDAY_FEEDS;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function holidayFeed(region: HolidayFeed): string {
  const bundle = getBundle();
  const feed = HOLIDAY_FEEDS[region];
  let events: CalendarEvent[];
  if (region === 'in') {
    events = bundle.holidays
      .filter((l) => l.kind === 'gazetted' && l.scope === 'IN')
      .flatMap((l) =>
        l.holidays.map((h) => ({
          uid: `in-${h.date}-${slug(h.name)}@india-compliance-calendar`,
          date: h.date,
          summary: `${h.name} - Central Government holiday`,
          description: [h.note, `${l.title}. ${l.authority}.`, `Source: ${l.source.url}`].filter(Boolean).join('\n'),
          url: l.source.url,
        })),
      );
  } else {
    events = [...abroadDays(bundle, feed.scopes).entries()].flatMap(([date, hs]) =>
      hs.map((h) => ({
        uid: `${region}-${date}-${slug(h.name)}@india-compliance-calendar`,
        date,
        summary: `${h.name} - ${abroadMeaning(h)}`,
        description: [...h.notes, ...h.sources.map((u) => `Source: ${u}`), 'Information only.'].join('\n'),
        url: h.sources[0],
      })),
    );
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  return buildCalendar({
    name: `${feed.name} - India Compliance Calendar`,
    description: 'Official holiday lists with their sources. Information only.',
    stamp: new Date(`${bundle.meta.generated}`),
    events,
  });
}
