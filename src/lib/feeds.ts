// Calendar feed content shared by the ICS endpoints.

import { addDays, addMonths } from './dates.ts';
import { exposureLine } from './exposure.ts';
import { buildCalendar, type CalendarEvent } from './ics.ts';
import { buildDate, getBundle, occurrencesBetween, SITE_URL } from './site-data.ts';
import { CATEGORY_LABEL, type Rule } from './types.ts';

export function feedFor(name: string, description: string, rules: Rule[], months = 24): string {
  const today = buildDate();
  const byId = new Map(rules.map((r) => [r.id, r]));
  const occs = occurrencesBetween(addDays(today, -31), addMonths(today, months), rules);
  const events: CalendarEvent[] = occs.map((o) => {
    const r = byId.get(o.ruleId)!;
    const lines = [
      `${r.title}. ${r.summary}`,
      `Period: ${o.periodLabel}`,
      o.extended ? `Extended from ${o.originalDue}: ${o.extended.reason}` : '',
      o.projected ? 'Projected from the standing rule; confirm closer to the date.' : '',
      `Who files: ${r.applicability}`,
      `Law: ${r.law}`,
      `Cost of a 30-day delay: ${exposureLine(r)}`,
      `Source: ${r.sources[0]?.url ?? ''}`,
      `Details: ${SITE_URL}o/${r.id}/`,
      'Information only, not legal advice. Confirm on the official portal before filing.',
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
