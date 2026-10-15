// View model shared by the islands: rows, states, sorting, holidays.

import { addDays, addMonths, diffDays, isWeekend, type ISODate } from './dates.ts';
import { exposure30 } from './exposure.ts';
import { appliesTo, type Profile } from './profile.ts';
import { expandRules } from './schedule.ts';
import type { FiledRecord, PlannedEvent } from './store.ts';
import { CATEGORIES, type Bundle, type Category, type EventType, type Occurrence, type Rule } from './types.ts';

export type RowState = 'filed' | 'overdue' | 'soon' | 'extended' | 'upcoming' | 'past';

export const STATE_LABEL: Record<RowState, string> = {
  filed: 'Filed',
  overdue: 'Overdue',
  soon: 'Due within 7 days',
  extended: 'Extended',
  upcoming: 'Upcoming',
  past: 'Before tracking',
};

export const STATE_VAR: Record<RowState, string> = {
  filed: 'var(--filed)',
  overdue: 'var(--overdue)',
  soon: 'var(--soon)',
  extended: 'var(--extended)',
  upcoming: 'var(--upcoming)',
  past: 'var(--past)',
};

export interface Row {
  occ: Occurrence;
  rule: Rule;
  state: RowState;
  daysLeft: number;
  exposure: number;
  filed?: FiledRecord;
  /** Holiday or weekend names when the due date is a non-working day. */
  closed?: string[];
  /** Comes from the event planner rather than a recurring rule. */
  planned?: { eventTitle: string; eventDate: ISODate };
}

export const SOON_DAYS = 7;

export function categoryIndex(c: Category): number {
  return CATEGORIES.indexOf(c);
}

export function rowState(
  due: ISODate,
  today: ISODate,
  filed: FiledRecord | undefined,
  extended: boolean,
  trackingSince?: ISODate,
): RowState {
  if (filed) return 'filed';
  const left = diffDays(today, due);
  // Unfiled items that fell due before the team started recording are unknown, not overdue.
  if (left < 0) return trackingSince && due < trackingSince ? 'past' : 'overdue';
  if (left <= SOON_DAYS) return 'soon';
  if (extended) return 'extended';
  return 'upcoming';
}

/** Central gazetted holidays by date, for "due on a holiday" notes and working-day counts. */
export function centralHolidays(bundle: Pick<Bundle, 'holidays'>): Map<ISODate, string> {
  const map = new Map<ISODate, string>();
  for (const list of bundle.holidays) {
    if (list.kind !== 'gazetted' || list.scope !== 'IN') continue;
    for (const h of list.holidays) map.set(h.date, h.name);
  }
  return map;
}

/** Central gazetted holidays plus bank holidays in the given states, as labels per date. */
export function closedDays(bundle: Pick<Bundle, 'holidays'>, states: string[] = []): Map<ISODate, string> {
  const map = new Map<ISODate, string>();
  const add = (date: ISODate, label: string) => {
    const prev = map.get(date);
    if (!prev) map.set(date, label);
    else if (!prev.includes(label)) map.set(date, `${prev}; ${label}`);
  };
  for (const list of bundle.holidays) {
    if (list.kind === 'gazetted' && list.scope === 'IN') for (const h of list.holidays) add(h.date, h.name);
  }
  for (const list of bundle.holidays) {
    if (list.kind !== 'bank' || !states.includes(list.scope)) continue;
    for (const h of list.holidays) if (!map.has(h.date)) add(h.date, `bank holiday in ${list.scope} (${h.name})`);
  }
  return map;
}

export function closedNote(date: ISODate, holidays: Map<ISODate, string>): string[] | undefined {
  const notes: string[] = [];
  const h = holidays.get(date);
  if (h) notes.push(h);
  if (isWeekend(date)) notes.push(new Date(`${date}T00:00:00Z`).getUTCDay() === 0 ? 'Sunday' : 'Saturday');
  return notes.length ? notes : undefined;
}

/** Downstream deadlines for a planned event (AGM, allotment, director change...). */
export function eventOccurrences(ev: EventType, date: ISODate, planned: PlannedEvent | null): Occurrence[] {
  return ev.steps.map((step, i) => {
    let due = date;
    if (step.within.months) due = addMonths(due, step.within.months);
    if (step.within.days) due = addDays(due, step.within.days);
    const key = planned ? `planned:${planned.id}:${i}` : `event:${ev.id}:${date}:${i}`;
    return {
      key,
      ruleId: step.ruleId ?? `event-${ev.id}-${i}`,
      due,
      periodKey: date,
      periodLabel: `${ev.title} on ${date}`,
      periodStart: date,
      periodEnd: date,
      projected: false,
    };
  });
}

/** Stand-in rule for event steps that have no recurring rule of their own. */
export function stepRule(ev: EventType, index: number): Rule {
  const step = ev.steps[index];
  return {
    id: `event-${ev.id}-${index}`,
    code: step.code,
    title: step.title,
    category: ev.category,
    authority: '',
    summary: step.note ?? step.title,
    applicability: ev.description,
    audience: step.audience ?? ['company'],
    frequency: 'event',
    trigger: step.note,
    law: step.law,
    sources: step.source ? [step.source] : [],
    verified: '',
    confidence: 'medium',
  };
}

export interface RowInput {
  bundle: Bundle;
  profile: Profile;
  today: ISODate;
  to: ISODate;
  filed: Record<string, FiledRecord>;
  planned: PlannedEvent[];
  trackingSince: ISODate;
  /** Include unfiled items that fell due after trackingSince. */
  includeOverdue?: boolean;
  /** Start of the window when not "today" (reports look back). */
  from?: ISODate;
}

export function buildRows(input: RowInput): Row[] {
  const { bundle, profile, today, to, filed } = input;
  const from = input.from ?? today;
  const rules = bundle.rules.filter((r) => appliesTo(r, profile));
  const byId = new Map(rules.map((r) => [r.id, r]));
  const holidays = centralHolidays(bundle);
  const closed = closedDays(bundle, profile.states);
  const start = input.includeOverdue && input.trackingSince < from ? input.trackingSince : from;
  const occs = expandRules(rules, start, to, {
    confirmedThrough: bundle.meta.confirmedThrough,
    holidays: new Set(holidays.keys()),
  });
  const rows: Row[] = [];
  for (const occ of occs) {
    const rule = byId.get(occ.ruleId);
    if (!rule) continue;
    const f = filed[occ.key];
    if (occ.due < from && (f || !input.includeOverdue)) continue;
    rows.push({
      occ,
      rule,
      state: rowState(occ.due, today, f, Boolean(occ.extended), input.trackingSince),
      daysLeft: diffDays(today, occ.due),
      exposure: exposure30(rule),
      filed: f,
      closed: closedNote(occ.due, closed),
    });
  }
  const events = new Map(bundle.events.map((e) => [e.id, e]));
  for (const p of input.planned) {
    const ev = events.get(p.eventId);
    if (!ev) continue;
    eventOccurrences(ev, p.date, p).forEach((occ, i) => {
      const step = ev.steps[i];
      const rule = (step.ruleId && bundle.rules.find((r) => r.id === step.ruleId)) || stepRule(ev, i);
      const f = filed[occ.key];
      if (occ.due > to) return;
      if (occ.due < from && (f || !input.includeOverdue || occ.due < start)) return;
      rows.push({
        occ: { ...occ, periodLabel: p.label ? `${p.label} (${ev.title})` : occ.periodLabel },
        rule: { ...rule, code: step.code, title: step.title },
        state: rowState(occ.due, today, f, false, input.trackingSince),
        daysLeft: diffDays(today, occ.due),
        exposure: exposure30(rule),
        filed: f,
        closed: closedNote(occ.due, closed),
        planned: { eventTitle: p.label || ev.title, eventDate: p.date },
      });
    });
  }
  return rows;
}

export type SortKey = 'due' | 'exposure' | 'law';

export function sortRows(rows: Row[], key: SortKey): Row[] {
  const out = rows.slice();
  const byDue = (a: Row, b: Row) => (a.occ.due < b.occ.due ? -1 : a.occ.due > b.occ.due ? 1 : 0);
  if (key === 'due') {
    out.sort((a, b) => byDue(a, b) || b.exposure - a.exposure || a.rule.code.localeCompare(b.rule.code));
  } else if (key === 'exposure') {
    const filedLast = (r: Row) => (r.state === 'filed' ? 1 : 0);
    out.sort((a, b) => filedLast(a) - filedLast(b) || b.exposure - a.exposure || byDue(a, b));
  } else {
    out.sort((a, b) => categoryIndex(a.rule.category) - categoryIndex(b.rule.category) || byDue(a, b));
  }
  return out;
}

export function countStates(rows: Row[]): Record<RowState, number> {
  const c: Record<RowState, number> = { filed: 0, overdue: 0, soon: 0, extended: 0, upcoming: 0, past: 0 };
  for (const r of rows) c[r.state]++;
  return c;
}

/** "CBDT / Income Tax Department" -> "CBDT"; "EPFO (Employees' ...)" -> "EPFO". */
export function shortAuthority(a: string): string {
  const first = a.split(/\s+\/\s+|;\s*/)[0];
  const bare = first.replace(/\s*\([^)]*\)/g, '').trim();
  return bare || a;
}

export function matchesQuery(row: Row, q: string): boolean {
  if (!q) return true;
  const hay = `${row.rule.code} ${row.rule.title} ${row.rule.form ?? ''} ${row.rule.authority} ${row.rule.law} ${row.occ.periodLabel}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}
