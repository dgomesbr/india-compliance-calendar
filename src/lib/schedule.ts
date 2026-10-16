// Expands recurring rules into dated occurrences for any window.

import {
  addDays,
  daysInMonth,
  fyKey,
  fyLabel,
  iso,
  isWeekend,
  lastDayOfMonth,
  MONTHS_SHORT,
  parts,
  shiftDate,
  shiftMonth,
  type ISODate,
} from './dates.ts';
import { INDIAN_FY_START, yearKey, yearLabel } from './fiscal.ts';
import type { ChainLink, DueSpec, Follows, Occurrence, Offset, Override, Rule, Schedule } from './types.ts';

export interface Period {
  key: string;
  /** Key used by `except` / `skip`: "1".."12", "Q1".."Q4", "H1"/"H2", or "". */
  slot: string;
  label: string;
  start: ISODate;
  end: ISODate;
  /** Calendar year of the FY start, or the calendar year, for every-n-years counting. */
  yearIndex: number;
}

export interface ExpandOptions {
  /** Due dates after this are flagged as projected. */
  confirmedThrough?: ISODate;
  /** Dates treated as non-working for workingDaysAfter (central holidays). */
  holidays?: Set<ISODate>;
  /** First month (1-12) of the entity's financial year, for rules marked entityYear. Default April. */
  fyStart?: number;
  /** Every rule by id, so a rule that follows another can find it. Without it, a rule keeps its own placement. */
  rules?: ReadonlyMap<string, Rule>;
  /** The date an occurrence was done (filed, or held for a meeting), by occurrence key. */
  done?: (key: string) => ISODate | undefined;
}

function monthPeriod(y: number, m: number): Period {
  return {
    key: iso(y, m, 1).slice(0, 7),
    slot: String(m),
    label: `${MONTHS_SHORT[m - 1]} ${y}`,
    start: iso(y, m, 1),
    end: lastDayOfMonth(y, m),
    yearIndex: y,
  };
}

const FY_QUARTERS = [
  { slot: 'Q1', first: 4, span: 'Apr-Jun' },
  { slot: 'Q2', first: 7, span: 'Jul-Sep' },
  { slot: 'Q3', first: 10, span: 'Oct-Dec' },
  { slot: 'Q4', first: 1, span: 'Jan-Mar' },
];
const CAL_QUARTERS = [
  { slot: 'Q1', first: 1, span: 'Jan-Mar' },
  { slot: 'Q2', first: 4, span: 'Apr-Jun' },
  { slot: 'Q3', first: 7, span: 'Jul-Sep' },
  { slot: 'Q4', first: 10, span: 'Oct-Dec' },
];

/** Periods of the entity's own year starting in `y`, for a year that does not start in April. */
function entityPeriods(kind: Schedule['kind'], y: number, start: number): Period[] {
  const key = yearKey(y, start);
  const name = yearLabel(y, start, false);
  const part = (n: number, months: number, prefix: 'Q' | 'H'): Period => {
    const s = shiftMonth(y, start, n * months);
    const e = shiftMonth(s.y, s.m, months - 1);
    const slot = `${prefix}${n + 1}`;
    return {
      key: `${key}-${slot}`,
      slot,
      label: `${slot} ${name} (${MONTHS_SHORT[s.m - 1]}-${MONTHS_SHORT[e.m - 1]})`,
      start: iso(s.y, s.m, 1),
      end: lastDayOfMonth(e.y, e.m),
      yearIndex: y,
    };
  };
  if (kind === 'quarterly') return [0, 1, 2, 3].map((n) => part(n, 3, 'Q'));
  if (kind === 'half-yearly') return [0, 1].map((n) => part(n, 6, 'H'));
  const end = shiftMonth(y, start, 11);
  return [{ key, slot: '', label: yearLabel(y, start), start: iso(y, start, 1), end: lastDayOfMonth(end.y, end.m), yearIndex: y }];
}

/** All periods of a schedule whose start falls in [fromYear-1, toYear+1]. */
export function periodsFor(schedule: Schedule, fromYear: number, toYear: number, fyStart = INDIAN_FY_START): Period[] {
  const out: Period[] = [];
  const basis = schedule.basis ?? 'fy';
  const own = schedule.entityYear && basis === 'fy' && fyStart !== INDIAN_FY_START && schedule.kind !== 'monthly' && schedule.kind !== 'fixed';
  for (let y = fromYear - 1; y <= toYear + 1; y++) {
    if (own) {
      out.push(...entityPeriods(schedule.kind, y, fyStart));
      continue;
    }
    switch (schedule.kind) {
      case 'monthly':
        for (let m = 1; m <= 12; m++) out.push(monthPeriod(y, m));
        break;
      case 'quarterly':
        if (basis === 'fy') {
          // y is the FY start year.
          for (const q of FY_QUARTERS) {
            const sy = q.first >= 4 ? y : y + 1;
            const e = shiftMonth(sy, q.first, 2);
            out.push({
              key: `${fyKey(y)}-${q.slot}`,
              slot: q.slot,
              label: `${q.slot} ${fyLabel(y)} (${q.span})`,
              start: iso(sy, q.first, 1),
              end: lastDayOfMonth(e.y, e.m),
              yearIndex: y,
            });
          }
        } else {
          for (const q of CAL_QUARTERS) {
            out.push({
              key: `CY${y}-${q.slot}`,
              slot: q.slot,
              label: `${q.slot} ${y} (${q.span})`,
              start: iso(y, q.first, 1),
              end: lastDayOfMonth(y, q.first + 2),
              yearIndex: y,
            });
          }
        }
        break;
      case 'half-yearly':
        if (basis === 'fy') {
          out.push({
            key: `${fyKey(y)}-H1`, slot: 'H1', label: `H1 ${fyLabel(y)} (Apr-Sep)`,
            start: iso(y, 4, 1), end: iso(y, 9, 30), yearIndex: y,
          });
          out.push({
            key: `${fyKey(y)}-H2`, slot: 'H2', label: `H2 ${fyLabel(y)} (Oct-Mar)`,
            start: iso(y, 10, 1), end: iso(y + 1, 3, 31), yearIndex: y,
          });
        } else {
          out.push({
            key: `CY${y}-H1`, slot: 'H1', label: `Jan-Jun ${y}`,
            start: iso(y, 1, 1), end: iso(y, 6, 30), yearIndex: y,
          });
          out.push({
            key: `CY${y}-H2`, slot: 'H2', label: `Jul-Dec ${y}`,
            start: iso(y, 7, 1), end: iso(y, 12, 31), yearIndex: y,
          });
        }
        break;
      case 'annual':
      case 'every-n-years':
        if (basis === 'fy') {
          out.push({
            key: fyKey(y), slot: '', label: fyLabel(y),
            start: iso(y, 4, 1), end: iso(y + 1, 3, 31), yearIndex: y,
          });
        } else {
          out.push({
            key: `CY${y}`, slot: '', label: `CY ${y}`,
            start: iso(y, 1, 1), end: iso(y, 12, 31), yearIndex: y,
          });
        }
        break;
      case 'fixed':
        break;
    }
  }
  return out;
}

function anchorYear(anchor: string | undefined): number | null {
  if (!anchor) return null;
  const m = /^(?:FY|CY)(\d{4})/.exec(anchor);
  return m ? Number(m[1]) : null;
}

function addWorkingDays(date: ISODate, n: number, holidays?: Set<ISODate>): ISODate {
  let d = date;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    if (!isWeekend(d) && !holidays?.has(d)) left--;
  }
  return d;
}

/** Due date for a period under a due spec. */
export function dueFor(period: Period, spec: DueSpec, holidays?: Set<ISODate>): ISODate {
  if (spec.after) return shiftDate(period.end, spec.after);
  if (typeof spec.daysAfter === 'number') return addDays(period.end, spec.daysAfter);
  if (typeof spec.workingDaysAfter === 'number') return addWorkingDays(period.end, spec.workingDaysAfter, holidays);
  const { y, m } = parts(period.end);
  const t = shiftMonth(y, m, spec.monthOffset ?? 0);
  const last = daysInMonth(t.y, t.m);
  const day = spec.day === 'last' || spec.day === undefined ? last : Math.min(spec.day, last);
  return iso(t.y, t.m, day);
}

function specFor(schedule: Schedule, slot: string): DueSpec {
  const ex = slot ? schedule.except?.[slot] : undefined;
  const base: DueSpec = {
    day: schedule.day,
    monthOffset: schedule.monthOffset,
    daysAfter: schedule.daysAfter,
    workingDaysAfter: schedule.workingDaysAfter,
    after: schedule.after,
  };
  if (!ex) return base;
  // An exception replaces the placement method entirely.
  return { day: ex.day, monthOffset: ex.monthOffset, daysAfter: ex.daysAfter, workingDaysAfter: ex.workingDaysAfter, after: ex.after };
}

function inEffect(rule: Rule, periodStart: ISODate): boolean {
  const from = rule.effective?.from;
  const to = rule.effective?.to;
  if (from && periodStart < from) return false;
  if (to && periodStart > to) return false;
  return true;
}

/** Where a rule's chain points for one of its periods: the earlier rule's period key. */
export function chainKey(follows: Follows, periodKey: string): string {
  return follows.slot ? `${periodKey}-${follows.slot}` : periodKey;
}

/** One period of a rule by key, searching the years around the one in the key. */
function periodByKey(rule: Rule, key: string, fyStart?: number): Period | null {
  const s = rule.schedule;
  if (!s || s.kind === 'fixed') return null;
  const y = Number(/\d{4}/.exec(key)?.[0]);
  if (!y) return null;
  return periodsFor(s, y - 1, y + 1, fyStart).find((p) => p.key === key) ?? null;
}

interface Placed {
  due: ISODate;
  statutory: ISODate;
  override?: Override;
  chain?: ChainLink;
}

/** The due date of one period: own placement, then the chain, then any notified override. */
function place(rule: Rule, period: Period, opts: ExpandOptions, depth = 0): Placed {
  const schedule = rule.schedule!;
  let statutory = dueFor(period, specFor(schedule, period.slot), opts.holidays);
  let chain: ChainLink | undefined;
  const f = schedule.follows;
  const prev = f && depth < 4 ? opts.rules?.get(f.rule) : undefined;
  if (f && prev?.schedule) {
    const pp = periodByKey(prev, chainKey(f, period.key), opts.fyStart);
    if (pp && inEffect(prev, pp.start)) {
      const key = `${prev.id}@${pp.key}`;
      const fromDone = (f.from ?? 'done') === 'done';
      const recorded = fromDone ? opts.done?.(key) : undefined;
      // Unrecorded, a "done" chain counts from the date the earlier step was due by (extended, if
      // it was): the AGM that "should have been held". A "due" chain counts from the statutory date,
      // because regulators extend linked dates separately (CBDT moved the AY 2024-25 audit report to
      // 7 October and the return to 15 November); each extension is recorded on its own rule.
      const parent = recorded ? null : place(prev, pp, opts, depth + 1);
      const date = recorded ?? (fromDone ? parent!.due : parent!.statutory);
      const shifted = shiftDate(date, f.within);
      chain = { ruleId: prev.id, key, date, from: recorded ? 'done' : 'due', within: f.within };
      if (f.earlier) {
        // "Whichever is earlier": only a step actually recorded can bring the date forward.
        chain.earlier = true;
        if (recorded && shifted < statutory) {
          statutory = shifted;
          chain.moved = true;
        }
      } else statutory = shifted;
    }
  }
  const override = rule.overrides?.find((o) => o.period === period.key);
  return { due: override ? override.due : statutory, statutory, override, chain };
}

function toOccurrence(rule: Rule, period: Period, p: Placed, opts: ExpandOptions): Occurrence {
  const occ: Occurrence = {
    key: `${rule.id}@${period.key}`,
    ruleId: rule.id,
    due: p.due,
    periodKey: period.key,
    periodLabel: period.label,
    periodStart: period.start,
    periodEnd: period.end,
    projected: Boolean(opts.confirmedThrough && p.due > opts.confirmedThrough && !p.override),
  };
  if (p.override) {
    occ.originalDue = p.override.originalDue ?? p.statutory;
    occ.extended = { reason: p.override.reason, source: p.override.source };
  }
  if (p.chain) occ.chain = p.chain;
  return occ;
}

function fixedPeriods(rule: Rule): { period: Period; due: ISODate }[] {
  return (rule.schedule?.dates ?? []).map((d) => ({
    period: { key: d.period.replace(/\s+/g, '-'), slot: '', label: d.label ?? d.period, start: d.due, end: d.due, yearIndex: parts(d.due).y },
    due: d.due,
  }));
}

/** Occurrences of one rule with due dates inside [from, to]. */
export function expandRule(rule: Rule, from: ISODate, to: ISODate, opts: ExpandOptions = {}): Occurrence[] {
  const schedule = rule.schedule;
  if (!schedule) return [];
  const out: Occurrence[] = [];

  if (schedule.kind === 'fixed') {
    for (const { period, due } of fixedPeriods(rule)) {
      if (!inEffect(rule, period.start)) continue;
      const override = rule.overrides?.find((o) => o.period === period.key);
      const p: Placed = { due: override ? override.due : due, statutory: due, override };
      if (p.due >= from && p.due <= to) out.push(toOccurrence(rule, period, p, opts));
    }
    return out;
  }

  const fromYear = parts(from).y - 2;
  const toYear = parts(to).y;
  const skip = new Set(schedule.skip ?? []);
  const anchor = anchorYear(schedule.anchor);
  const every = schedule.kind === 'every-n-years' ? Math.max(1, schedule.everyYears ?? 1) : 1;

  for (const period of periodsFor(schedule, fromYear, toYear, opts.fyStart)) {
    if (period.slot && skip.has(period.slot)) continue;
    if (every > 1 && anchor !== null && ((period.yearIndex - anchor) % every + every) % every !== 0) continue;
    if (!inEffect(rule, period.start)) continue;
    const p = place(rule, period, opts);
    if (p.due >= from && p.due <= to) out.push(toOccurrence(rule, period, p, opts));
  }
  out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  return out;
}

/** Occurrences of many rules, sorted by due date then rule id. */
export function expandRules(rules: Rule[], from: ISODate, to: ISODate, opts: ExpandOptions = {}): Occurrence[] {
  const all: Occurrence[] = [];
  for (const r of rules) all.push(...expandRule(r, from, to, opts));
  all.sort((a, b) => (a.due === b.due ? a.ruleId.localeCompare(b.ruleId) : a.due < b.due ? -1 : 1));
  return all;
}

/** A rule's occurrence for one period key, whatever its date; null when the rule has no such period. */
export function occurrenceFor(rule: Rule, periodKey: string, opts: ExpandOptions = {}): Occurrence | null {
  const schedule = rule.schedule;
  if (!schedule) return null;
  if (schedule.kind === 'fixed') {
    const hit = fixedPeriods(rule).find((f) => f.period.key === periodKey);
    return hit ? toOccurrence(rule, hit.period, { due: hit.due, statutory: hit.due }, opts) : null;
  }
  const period = periodByKey(rule, periodKey, opts.fyStart);
  if (!period || !inEffect(rule, period.start)) return null;
  if (period.slot && schedule.skip?.includes(period.slot)) return null;
  return toOccurrence(rule, period, place(rule, period, opts), opts);
}

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const unit = n % 10;
  return `${n}${unit === 1 ? 'st' : unit === 2 ? 'nd' : unit === 3 ? 'rd' : 'th'}`;
}

/** "30 days", "1 month", "6 months and 30 days"; signs dropped. */
export function describeOffset(o: Offset): string {
  const out: string[] = [];
  const m = Math.abs(o.months ?? 0);
  const d = Math.abs(o.days ?? 0);
  if (m) out.push(`${m} ${m === 1 ? 'month' : 'months'}`);
  if (d) out.push(`${d} ${d === 1 ? 'day' : 'days'}`);
  return out.join(' and ');
}

/** How a rule's date relates to the rule it follows: "30 days after AGM", "on the GSTR-9 due date". */
export function describeFollows(f: Follows, code: string): string {
  const span = describeOffset(f.within);
  const before = (f.within.months ?? 0) < 0 || (f.within.days ?? 0) < 0;
  if (f.earlier) return span ? `or ${span} after ${code} is filed, if earlier` : `or the day ${code} is filed, if earlier`;
  if ((f.from ?? 'done') === 'due') {
    if (!span) return `on the ${code} due date`;
    return `${span} ${before ? 'before' : 'after'} the ${code} due date`;
  }
  if (!span) return `with ${code}`;
  return `${span} ${before ? 'before' : 'after'} ${code}`;
}

function placement(spec: DueSpec, unit: string): string {
  if (spec.after) return `within ${describeOffset(spec.after)} after the ${unit} ends`;
  if (typeof spec.daysAfter === 'number') return `within ${spec.daysAfter} days after the ${unit} ends`;
  if (typeof spec.workingDaysAfter === 'number') {
    return `within ${spec.workingDaysAfter} working days after the ${unit} ends`;
  }
  const day = spec.day === 'last' || spec.day === undefined ? 'the last day' : `the ${ordinal(spec.day)}`;
  const off = spec.monthOffset ?? 0;
  if (off === 0) return unit === 'month' ? `by ${day} of the same month` : `by ${day} of the ${unit}'s last month`;
  if (off === 1) return `by ${day} of the following month`;
  return `by ${day} of the ${ordinal(off)} month after the ${unit}`;
}

const KIND_WORD: Record<Schedule['kind'], string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'half-yearly': 'Half-yearly',
  annual: 'Annually',
  'every-n-years': 'Every few years',
  fixed: 'On fixed dates',
};

/** Plain-language description of when a rule falls due. Pass every rule to name the one it follows. */
export function describeSchedule(rule: Rule, rules?: ReadonlyMap<string, Rule>): string {
  const s = rule.schedule;
  if (!s) return rule.trigger ?? 'Event-based';
  const unit = (u: string) => placement(s, u);
  let own: string;
  switch (s.kind) {
    case 'monthly':
      own = `Monthly, ${unit('month')}`;
      break;
    case 'quarterly':
      own = `Quarterly, ${unit('quarter')}`;
      break;
    case 'half-yearly':
      own = `Half-yearly, ${unit('half-year')}`;
      break;
    case 'annual':
      own = `Annually, ${unit(s.basis === 'calendar' ? 'calendar year' : 'financial year')}`;
      break;
    case 'every-n-years':
      own = `Every ${s.everyYears ?? 1} years, ${unit('financial year')}`;
      break;
    case 'fixed':
      return 'On fixed dates';
  }
  if (!s.follows) return own;
  const code = rules?.get(s.follows.rule)?.code ?? s.follows.rule;
  return s.follows.earlier ? `${own}, ${describeFollows(s.follows, code)}` : `${KIND_WORD[s.kind]}, ${describeFollows(s.follows, code)}`;
}
