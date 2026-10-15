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
  shiftMonth,
  type ISODate,
} from './dates.ts';
import type { DueSpec, Occurrence, Rule, Schedule } from './types.ts';

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

/** All periods of a schedule whose start falls in [fromYear-1, toYear+1]. */
export function periodsFor(schedule: Schedule, fromYear: number, toYear: number): Period[] {
  const out: Period[] = [];
  const basis = schedule.basis ?? 'fy';
  for (let y = fromYear - 1; y <= toYear + 1; y++) {
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
  };
  if (!ex) return base;
  // An exception replaces the placement method entirely.
  return { day: ex.day, monthOffset: ex.monthOffset, daysAfter: ex.daysAfter, workingDaysAfter: ex.workingDaysAfter };
}

function inEffect(rule: Rule, periodStart: ISODate): boolean {
  const from = rule.effective?.from;
  const to = rule.effective?.to;
  if (from && periodStart < from) return false;
  if (to && periodStart > to) return false;
  return true;
}

/** Occurrences of one rule with due dates inside [from, to]. */
export function expandRule(rule: Rule, from: ISODate, to: ISODate, opts: ExpandOptions = {}): Occurrence[] {
  const schedule = rule.schedule;
  if (!schedule) return [];
  const overrides = new Map((rule.overrides ?? []).map((o) => [o.period, o]));
  const out: Occurrence[] = [];

  const push = (period: Period, statutoryDue: ISODate) => {
    const ov = overrides.get(period.key);
    const due = ov ? ov.due : statutoryDue;
    if (due < from || due > to) return;
    const occ: Occurrence = {
      key: `${rule.id}@${period.key}`,
      ruleId: rule.id,
      due,
      periodKey: period.key,
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      projected: Boolean(opts.confirmedThrough && due > opts.confirmedThrough && !ov),
    };
    if (ov) {
      occ.originalDue = ov.originalDue ?? statutoryDue;
      occ.extended = { reason: ov.reason, source: ov.source };
    }
    out.push(occ);
  };

  if (schedule.kind === 'fixed') {
    for (const d of schedule.dates ?? []) {
      const period: Period = {
        key: d.period.replace(/\s+/g, '-'),
        slot: '',
        label: d.label ?? d.period,
        start: d.due,
        end: d.due,
        yearIndex: parts(d.due).y,
      };
      if (inEffect(rule, period.start)) push(period, d.due);
    }
    return out;
  }

  const fromYear = parts(from).y - 2;
  const toYear = parts(to).y;
  const skip = new Set(schedule.skip ?? []);
  const anchor = anchorYear(schedule.anchor);
  const every = schedule.kind === 'every-n-years' ? Math.max(1, schedule.everyYears ?? 1) : 1;

  for (const period of periodsFor(schedule, fromYear, toYear)) {
    if (period.slot && skip.has(period.slot)) continue;
    if (every > 1 && anchor !== null && ((period.yearIndex - anchor) % every + every) % every !== 0) continue;
    if (!inEffect(rule, period.start)) continue;
    push(period, dueFor(period, specFor(schedule, period.slot), opts.holidays));
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

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const unit = n % 10;
  return `${n}${unit === 1 ? 'st' : unit === 2 ? 'nd' : unit === 3 ? 'rd' : 'th'}`;
}

function placement(spec: DueSpec, unit: string): string {
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

/** Plain-language description of when a rule falls due. */
export function describeSchedule(rule: Rule): string {
  const s = rule.schedule;
  if (!s) return rule.trigger ?? 'Event-based';
  switch (s.kind) {
    case 'monthly':
      return `Monthly, ${placement(s, 'month')}`;
    case 'quarterly':
      return `Quarterly, ${placement(s, 'quarter')}`;
    case 'half-yearly':
      return `Half-yearly, ${placement(s, 'half-year')}`;
    case 'annual':
      return `Annually, ${placement(s, s.basis === 'calendar' ? 'calendar year' : 'financial year')}`;
    case 'every-n-years':
      return `Every ${s.everyYears ?? 1} years, ${placement(s, 'financial year')}`;
    case 'fixed':
      return 'On fixed dates';
  }
}
