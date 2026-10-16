// Data checks run by the test suite, `npm run validate` and CI.

import { ABROAD } from './abroad.ts';
import { isISODate } from './dates.ts';
import { AUDIENCES, CATEGORIES, FREQUENCIES, type EventType, type HolidayList, type Rule, type Schedule } from './types.ts';

export const STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DH', 'DL', 'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA',
  'LD', 'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB',
];

export const STATE_NAME: Record<string, string> = {
  AN: 'Andaman and Nicobar Islands', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar',
  CH: 'Chandigarh', CG: 'Chhattisgarh', DH: 'Dadra and Nagar Haveli and Daman and Diu', DL: 'Delhi', GA: 'Goa',
  GJ: 'Gujarat', HP: 'Himachal Pradesh', HR: 'Haryana', JH: 'Jharkhand', JK: 'Jammu and Kashmir', KA: 'Karnataka',
  KL: 'Kerala', LA: 'Ladakh', LD: 'Lakshadweep', MH: 'Maharashtra', ML: 'Meghalaya', MN: 'Manipur',
  MP: 'Madhya Pradesh', MZ: 'Mizoram', NL: 'Nagaland', OD: 'Odisha', PB: 'Punjab', PY: 'Puducherry',
  RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TR: 'Tripura', TS: 'Telangana', UK: 'Uttarakhand',
  UP: 'Uttar Pradesh', WB: 'West Bengal',
};

const NON_ASCII = /[^\x09\x0a\x0d\x20-\x7e]/;

/** Walk every string in a value and report non-ASCII characters (repo prose rule). */
export function nonAsciiPaths(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return NON_ASCII.test(value) ? [path || '(root)'] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => nonAsciiPaths(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => nonAsciiPaths(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function isOffset(o: unknown): boolean {
  if (!o || typeof o !== 'object') return false;
  const { months, days, monthEnd } = o as { months?: unknown; days?: unknown; monthEnd?: unknown };
  const whole = (v: unknown) => v === undefined || Number.isInteger(v);
  return whole(months) && whole(days) && (monthEnd === undefined || typeof monthEnd === 'boolean') && (months !== undefined || days !== undefined);
}

/** Chains point at real rules, never loop, and share the period basis so their period keys line up. */
function checkChains(rules: Rule[], errors: string[]): void {
  const byId = new Map(rules.map((r) => [r.id, r]));
  for (const r of rules) {
    if (!r.sameEventAs) continue;
    const other = byId.get(r.sameEventAs);
    const a = r.schedule;
    const b = other?.schedule;
    if (!other || !a || !b) errors.push(`rule ${r.id}: sameEventAs unknown or unscheduled rule "${r.sameEventAs}"`);
    else if (a.kind !== b.kind || (a.basis ?? 'fy') !== (b.basis ?? 'fy') || Boolean(a.entityYear) !== Boolean(b.entityYear) || r.recordAs !== other.recordAs) {
      errors.push(`rule ${r.id}: sameEventAs needs the same periods and recordAs as ${r.sameEventAs}`);
    }
  }
  for (const r of rules) {
    const f = r.schedule?.follows;
    if (!f) continue;
    const where = `rule ${r.id}`;
    const prev = byId.get(f.rule);
    if (!prev?.schedule) {
      errors.push(`${where}: follows unknown or unscheduled rule "${f.rule}"`);
      continue;
    }
    const s = r.schedule!;
    if (prev.schedule.skip?.length || prev.schedule.kind === 'every-n-years') errors.push(`${where}: follows ${f.rule}, which skips periods`);
    if ((prev.schedule.basis ?? 'fy') !== (s.basis ?? 'fy')) errors.push(`${where}: follows ${f.rule} on a different basis`);
    if (Boolean(prev.schedule.entityYear) !== Boolean(s.entityYear)) errors.push(`${where}: entityYear must match ${f.rule}`);
    if (f.slot ? prev.schedule.kind === s.kind : prev.schedule.kind !== s.kind) {
      errors.push(`${where}: follows.slot is for an annual rule following a quarterly or half-yearly one`);
    }
    const seen = new Set([r.id]);
    for (let x: Rule | undefined = prev; x?.schedule?.follows; x = byId.get(x.schedule.follows.rule)) {
      if (seen.has(x.id)) {
        errors.push(`${where}: chain loops back to ${x.id}`);
        break;
      }
      seen.add(x.id);
    }
  }
}

const SLOT_KEYS: Record<string, RegExp> = {
  monthly: /^(?:[1-9]|1[0-2])$/,
  quarterly: /^Q[1-4]$/,
  'half-yearly': /^H[12]$/,
};

function checkSchedule(s: Schedule, where: string, errors: string[]): void {
  const kinds = ['monthly', 'quarterly', 'half-yearly', 'annual', 'every-n-years', 'fixed'];
  if (!kinds.includes(s.kind)) {
    errors.push(`${where}: unknown schedule kind "${s.kind}"`);
    return;
  }
  if (s.kind === 'fixed') {
    if (!s.dates?.length) errors.push(`${where}: fixed schedule without dates`);
    for (const d of s.dates ?? []) if (!isISODate(d.due)) errors.push(`${where}: bad fixed date "${d.due}"`);
    return;
  }
  const placed = (x: { day?: unknown; daysAfter?: unknown; workingDaysAfter?: unknown; after?: unknown }) =>
    x.day !== undefined || typeof x.daysAfter === 'number' || typeof x.workingDaysAfter === 'number' || x.after !== undefined;
  if (!placed(s)) errors.push(`${where}: schedule needs day, daysAfter, workingDaysAfter or after`);
  for (const [key, o] of [['after', s.after], ['follows.within', s.follows?.within]] as const) {
    if (o === undefined) continue;
    if (!isOffset(o)) errors.push(`${where}: ${key} needs whole months and/or days`);
  }
  if (s.entityYear !== undefined) {
    if (s.entityYear !== true) errors.push(`${where}: entityYear is true or absent`);
    if ((s.basis ?? 'fy') !== 'fy') errors.push(`${where}: entityYear rules use the financial-year basis`);
    if (!['quarterly', 'half-yearly', 'annual'].includes(s.kind)) errors.push(`${where}: entityYear fits quarterly, half-yearly and annual schedules`);
  }
  if (s.follows) {
    if (!s.follows.rule) errors.push(`${where}: follows needs a rule`);
    if (s.follows.from !== undefined && s.follows.from !== 'done' && s.follows.from !== 'due') errors.push(`${where}: follows.from is done or due`);
    if (s.follows.slot !== undefined && !/^(?:Q[1-4]|H[12])$/.test(s.follows.slot)) errors.push(`${where}: bad follows.slot "${s.follows.slot}"`);
    if (!s.follows.within) errors.push(`${where}: follows needs within`);
  }
  if (s.day !== undefined && s.day !== 'last' && !(Number.isInteger(s.day) && s.day >= 1 && s.day <= 31)) {
    errors.push(`${where}: bad day "${String(s.day)}"`);
  }
  // Negative offsets place a due date inside its own period (e.g. state enrolment tax due in June of the FY).
  if (s.monthOffset !== undefined && !(Number.isInteger(s.monthOffset) && s.monthOffset >= -12 && s.monthOffset <= 72)) {
    errors.push(`${where}: bad monthOffset "${String(s.monthOffset)}"`);
  }
  if (s.basis && s.basis !== 'fy' && s.basis !== 'calendar') errors.push(`${where}: bad basis "${s.basis}"`);
  const slot = SLOT_KEYS[s.kind];
  for (const key of [...Object.keys(s.except ?? {}), ...(s.skip ?? [])]) {
    if (!slot || !slot.test(key)) errors.push(`${where}: bad except/skip key "${key}" for ${s.kind}`);
  }
  for (const [key, ex] of Object.entries(s.except ?? {})) {
    if (!placed(ex)) errors.push(`${where}: except "${key}" needs day, daysAfter, workingDaysAfter or after`);
    if (ex.after !== undefined && !isOffset(ex.after)) errors.push(`${where}: except "${key}" after needs whole months and/or days`);
  }
  if (s.kind === 'every-n-years') {
    if (!s.everyYears || s.everyYears < 2) errors.push(`${where}: every-n-years needs everyYears >= 2`);
    if (!/^(?:FY\d{4}-\d{2}|CY\d{4})$/.test(s.anchor ?? '')) errors.push(`${where}: every-n-years needs an anchor`);
  }
}

export function validateRules(rules: Rule[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const r of rules) {
    const where = `rule ${r.id ?? '(no id)'}`;
    if (!r.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.id)) errors.push(`${where}: id must be kebab-case`);
    if (ids.has(r.id)) errors.push(`${where}: duplicate id`);
    ids.add(r.id);
    for (const f of ['code', 'title', 'authority', 'summary', 'applicability', 'law'] as const) {
      if (!r[f] || typeof r[f] !== 'string') errors.push(`${where}: missing ${f}`);
    }
    if (r.title && r.title.length > 72) errors.push(`${where}: title longer than 72 characters`);
    if (!CATEGORIES.includes(r.category)) errors.push(`${where}: unknown category "${r.category}"`);
    if (!FREQUENCIES.includes(r.frequency)) errors.push(`${where}: unknown frequency "${r.frequency}"`);
    if (!Array.isArray(r.audience) || !r.audience.length) errors.push(`${where}: audience required`);
    for (const a of r.audience ?? []) if (!AUDIENCES.includes(a)) errors.push(`${where}: unknown audience "${a}"`);
    for (const s of r.states ?? []) if (!STATE_CODES.includes(s)) errors.push(`${where}: unknown state "${s}"`);
    const eventLike = r.frequency === 'event' || r.frequency === 'one-time';
    if (r.schedule) checkSchedule(r.schedule, where, errors);
    else if (!eventLike) errors.push(`${where}: schedule required for ${r.frequency}`);
    if (eventLike && !r.schedule && !r.trigger) errors.push(`${where}: event rules need a trigger`);
    if (!r.sources?.length) errors.push(`${where}: at least one source required`);
    for (const s of r.sources ?? []) {
      if (!/^https?:\/\//.test(s.url ?? '')) errors.push(`${where}: source url must be http(s): "${s.url}"`);
    }
    if (!isISODate(r.verified)) errors.push(`${where}: verified must be YYYY-MM-DD`);
    if (!['high', 'medium', 'low'].includes(r.confidence)) errors.push(`${where}: bad confidence`);
    for (const o of r.overrides ?? []) {
      if (!isISODate(o.due)) errors.push(`${where}: override due must be YYYY-MM-DD`);
      if (!o.reason) errors.push(`${where}: override needs a reason`);
    }
    for (const e of [r.effective?.from, r.effective?.to]) {
      if (e && !isISODate(e)) errors.push(`${where}: bad effective date "${e}"`);
    }
    for (const [k, v] of Object.entries(r.exposure ?? {})) {
      if (typeof v === 'number' && v < 0) errors.push(`${where}: exposure.${k} is negative`);
    }
    if (r.recordAs !== undefined && r.recordAs !== 'filed' && r.recordAs !== 'held') errors.push(`${where}: recordAs is filed or held`);
    for (const p of nonAsciiPaths(r)) errors.push(`${where}: non-ASCII text in ${p}`);
  }
  checkChains(rules, errors);
  return errors;
}

const HOLIDAY_KINDS = ['gazetted', 'restricted', 'bank', 'exchange-trading', 'exchange-settlement', 'statutory'];
const HOLIDAY_SCOPES = ['IN', 'NSE', 'BSE', ...STATE_CODES, ...ABROAD];

export function validateHolidays(lists: HolidayList[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const l of lists) {
    if (ids.has(l.id)) errors.push(`holidays ${l.id}: duplicate id`);
    ids.add(l.id);
    if (!l.source?.url) errors.push(`holidays ${l.id}: source required`);
    if (!HOLIDAY_KINDS.includes(l.kind)) errors.push(`holidays ${l.id}: unknown kind "${l.kind}"`);
    if (!HOLIDAY_SCOPES.includes(l.scope)) errors.push(`holidays ${l.id}: unknown scope "${l.scope}"`);
    if (l.kind === 'statutory' && !(ABROAD as readonly string[]).includes(l.scope)) errors.push(`holidays ${l.id}: statutory lists are for Canada, Ontario or the US`);
    if (!isISODate(l.verified)) errors.push(`holidays ${l.id}: verified must be YYYY-MM-DD`);
    for (const h of l.holidays ?? []) {
      if (!isISODate(h.date)) errors.push(`holidays ${l.id}: bad date "${h.date}"`);
      if (h.actual !== undefined && !isISODate(h.actual)) errors.push(`holidays ${l.id}: bad actual date "${h.actual}"`);
      else if (Number(h.date.slice(0, 4)) !== l.year) errors.push(`holidays ${l.id}: ${h.date} outside ${l.year}`);
    }
    for (const p of nonAsciiPaths(l)) errors.push(`holidays ${l.id}: non-ASCII text in ${p}`);
  }
  return errors;
}

export function validateEvents(events: EventType[], rules: Rule[]): string[] {
  const errors: string[] = [];
  const ruleIds = new Set(rules.map((r) => r.id));
  for (const ev of events) {
    if (!ev.steps?.length) errors.push(`event ${ev.id}: no steps`);
    for (const s of ev.steps ?? []) {
      if (s.ruleId && !ruleIds.has(s.ruleId)) errors.push(`event ${ev.id}: unknown ruleId "${s.ruleId}"`);
      if (!s.within || (s.within.days === undefined && s.within.months === undefined)) {
        errors.push(`event ${ev.id}: step ${s.code} needs within.days or within.months`);
      }
    }
    for (const p of nonAsciiPaths(ev)) errors.push(`event ${ev.id}: non-ASCII text in ${p}`);
  }
  return errors;
}
