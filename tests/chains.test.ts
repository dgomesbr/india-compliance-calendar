import { describe, expect, it } from 'vitest';
import { shiftDate } from '../src/lib/dates.ts';
import { entityQuarter, entityYear, entityYearOf, yearKey, yearLabel } from '../src/lib/fiscal.ts';
import { clampStart, horizonRange, minHorizonStart } from '../src/lib/horizon.ts';
import { loadBundle } from '../src/lib/load.ts';
import { DEFAULT_PROFILE } from '../src/lib/profile.ts';
import { describeFollows, describeSchedule, expandRule, occurrenceFor, type ExpandOptions } from '../src/lib/schedule.ts';
import { emptyState, normalizeState, withPrefs } from '../src/lib/store.ts';
import type { Rule } from '../src/lib/types.ts';
import { validateRules } from '../src/lib/validate.ts';
import { anchorRules, buildRows, chainNote, expandOptions, lineage, recordKey, rulesById } from '../src/lib/view.ts';

function rule(partial: Partial<Rule>): Rule {
  return {
    id: 'test-rule',
    code: 'TEST',
    title: 'Test rule',
    category: 'mca',
    authority: 'Test',
    summary: 'Test',
    applicability: 'Test',
    audience: ['company'],
    frequency: 'annual',
    law: 'Test',
    sources: [{ title: 'Test', url: 'https://example.gov.in' }],
    verified: '2026-10-14',
    confidence: 'high',
    ...partial,
  };
}

const agm = rule({ id: 'agm', code: 'AGM', recordAs: 'held', schedule: { kind: 'annual', basis: 'fy', entityYear: true, day: 30, monthOffset: 6, after: { months: 6 } } });
const aoc4 = rule({
  id: 'aoc4',
  code: 'AOC-4',
  schedule: { kind: 'annual', basis: 'fy', entityYear: true, day: 30, monthOffset: 7, follows: { rule: 'agm', within: { days: 30 } } },
});
const csr2 = rule({
  id: 'csr2',
  code: 'CSR-2',
  schedule: { kind: 'annual', basis: 'fy', entityYear: true, day: 30, monthOffset: 7, follows: { rule: 'aoc4', within: { days: 0 }, from: 'due' } },
});
const rules = new Map([agm, aoc4, csr2].map((r) => [r.id, r]));
const dues = (r: Rule, from: string, to: string, opts: ExpandOptions = {}) => expandRule(r, from, to, { rules, ...opts }).map((o) => o.due);

describe('the entity financial year', () => {
  it('names and keys years and quarters', () => {
    expect(yearKey(2026)).toBe('FY2026-27');
    expect(yearKey(2026, 1)).toBe('FYE2026-12');
    expect(yearKey(2026, 7)).toBe('FYE2027-06');
    expect(yearLabel(2026, 1)).toBe('FY 2026 (Jan-Dec)');
    expect(yearLabel(2026, 7)).toBe('FY 2026-27 (Jul-Jun)');
    expect(entityYear(2026, 1)).toMatchObject({ from: '2026-01-01', to: '2026-12-31' });
    expect(entityYearOf('2026-10-15', 11)).toMatchObject({ from: '2025-11-01', to: '2026-10-31' });
    expect(entityQuarter('2026-10-15', 0, 4).label).toBe('Q3 FY 2026-27');
    expect(entityQuarter('2026-10-15', -1, 4)).toMatchObject({ from: '2026-07-01', to: '2026-09-30', label: 'Q2 FY 2026-27' });
    expect(entityQuarter('2026-10-15', 0, 1)).toMatchObject({ from: '2026-10-01', to: '2026-12-31', label: 'Q4 FY 2026' });
    expect(entityQuarter('2026-10-15', 0, 11)).toMatchObject({ from: '2026-08-01', to: '2026-10-31', label: 'Q4 FY 2025-26' });
  });

  it('keeps April-March keys and dates when no other year is set', () => {
    const [o] = expandRule(agm, '2026-04-01', '2027-03-31');
    expect(o).toMatchObject({ key: 'agm@FY2025-26', due: '2026-09-30', periodLabel: 'FY 2025-26' });
  });

  it('moves a rule that follows the entity year, and only such a rule', () => {
    const [o] = expandRule(agm, '2026-01-01', '2026-12-31', { fyStart: 1 });
    expect(o).toMatchObject({ key: 'agm@FYE2025-12', due: '2026-06-30', periodLabel: 'FY 2025 (Jan-Dec)' });
    const tax = rule({ id: 'itr', schedule: { kind: 'annual', basis: 'fy', day: 31, monthOffset: 7 } });
    expect(expandRule(tax, '2026-01-01', '2026-12-31', { fyStart: 1 }).map((x) => x.due)).toEqual(['2026-10-31']);
  });

  it('gives the last quarter of the entity year its own placement', () => {
    const results = rule({
      frequency: 'quarterly',
      schedule: { kind: 'quarterly', basis: 'fy', entityYear: true, daysAfter: 45, except: { Q4: { daysAfter: 60 } } },
    });
    const occ = expandRule(results, '2026-01-01', '2026-12-31', { fyStart: 1 });
    expect(occ.map((o) => `${o.periodLabel}=${o.due}`)).toEqual([
      'Q4 FY 2025 (Oct-Dec)=2026-03-01',
      'Q1 FY 2026 (Jan-Mar)=2026-05-15',
      'Q2 FY 2026 (Apr-Jun)=2026-08-14',
      'Q3 FY 2026 (Jul-Sep)=2026-11-14',
    ]);
  });

  it('counts months to the corresponding date, clamped, from any year end', () => {
    expect(dues(agm, '2026-07-01', '2027-06-30', { fyStart: 7 })).toEqual(['2026-12-30']);
    expect(dues(agm, '2026-07-01', '2027-06-30', { fyStart: 3 })).toEqual(['2026-08-28']);
    // A year ending on 29 February 2028 gives 29 August.
    expect(dues(agm, '2028-07-01', '2029-06-30', { fyStart: 3 })).toEqual(['2028-08-29']);
    expect(shiftDate('2026-11-30', { months: -1 })).toBe('2026-10-30');
    expect(shiftDate('2026-11-30', { months: -1, monthEnd: true })).toBe('2026-10-31');
    expect(shiftDate('2026-09-30', { months: 6, days: 30 })).toBe('2027-04-29');
  });
});

describe('chains', () => {
  it('counts from the earlier step\'s deadline until a date is recorded', () => {
    expect(dues(aoc4, '2026-04-01', '2027-03-31')).toEqual(['2026-10-30']);
    const [o] = expandRule(aoc4, '2026-04-01', '2027-03-31', { rules });
    expect(o.chain).toMatchObject({ ruleId: 'agm', key: 'agm@FY2025-26', date: '2026-09-30', from: 'due' });
  });

  it('follows the recorded date, through every link', () => {
    const done = (k: string) => (k === 'agm@FY2025-26' ? '2026-09-12' : undefined);
    expect(dues(aoc4, '2026-04-01', '2027-03-31', { done })).toEqual(['2026-10-12']);
    // CSR-2 counts from the AOC-4 due date, which now runs from the AGM held on 12 September.
    expect(dues(csr2, '2026-04-01', '2027-03-31', { done })).toEqual(['2026-10-12']);
  });

  it('counts a due-date chain from the statutory date, not an extension of the earlier rule', () => {
    const itr = rule({
      id: 'itr',
      code: 'ITR',
      category: 'income-tax',
      schedule: { kind: 'annual', basis: 'fy', day: 31, monthOffset: 7 },
      overrides: [{ period: 'FY2025-26', due: '2026-11-15', reason: 'Extended by circular' }],
    });
    const audit = rule({
      id: 'audit',
      category: 'income-tax',
      schedule: { kind: 'annual', basis: 'fy', day: 30, monthOffset: 6, follows: { rule: 'itr', within: { months: -1, monthEnd: true }, from: 'due' } },
    });
    const opts: ExpandOptions = { rules: new Map([[itr.id, itr], [audit.id, audit]]) };
    expect(expandRule(audit, '2026-04-01', '2027-03-31', opts).map((o) => o.due)).toEqual(['2026-09-30']);
  });

  it('keeps its own placement when the earlier rule is not available', () => {
    expect(expandRule(aoc4, '2026-04-01', '2027-03-31').map((o) => o.due)).toEqual(['2026-10-30']);
  });

  it('lets a notified extension win over the chain', () => {
    const extended = { ...aoc4, overrides: [{ period: 'FY2025-26', due: '2026-12-31', reason: 'Extended by circular' }] };
    const done = (k: string) => (k === 'agm@FY2025-26' ? '2026-09-12' : undefined);
    const [o] = expandRule(extended, '2026-04-01', '2027-03-31', { rules, done });
    expect(o).toMatchObject({ due: '2026-12-31', originalDue: '2026-10-12' });
  });

  it('only brings a "whichever is earlier" date forward', () => {
    const gstr9 = rule({ id: 'gstr9', code: 'GSTR-9', category: 'gst', schedule: { kind: 'annual', basis: 'fy', day: 31, monthOffset: 9 } });
    const itc = rule({
      id: 'itc',
      category: 'gst',
      schedule: { kind: 'annual', basis: 'fy', day: 30, monthOffset: 8, follows: { rule: 'gstr9', within: { days: 0 }, earlier: true } },
    });
    const opts = (filedOn?: string): ExpandOptions => ({
      rules: new Map([[gstr9.id, gstr9], [itc.id, itc]]),
      done: (k) => (k === 'gstr9@FY2025-26' ? filedOn : undefined),
    });
    expect(expandRule(itc, '2026-04-01', '2027-03-31', opts()).map((o) => o.due)).toEqual(['2026-11-30']);
    expect(expandRule(itc, '2026-04-01', '2027-03-31', opts('2026-10-10')).map((o) => o.due)).toEqual(['2026-10-10']);
    expect(expandRule(itc, '2026-04-01', '2027-03-31', opts('2026-12-20')).map((o) => o.due)).toEqual(['2026-11-30']);
  });

  it('finds one occurrence by period key and describes the link', () => {
    expect(occurrenceFor(aoc4, 'FY2025-26', { rules })?.due).toBe('2026-10-30');
    expect(occurrenceFor(aoc4, 'FYE2025-12', { rules, fyStart: 1 })?.due).toBe('2026-07-30');
    expect(describeFollows(aoc4.schedule!.follows!, 'AGM')).toBe('30 days after AGM');
    expect(describeFollows(csr2.schedule!.follows!, 'AOC-4')).toBe('on the AOC-4 due date');
    expect(describeFollows({ rule: 'agm', within: { days: -22 } }, 'AGM')).toBe('22 days before AGM');
    expect(describeFollows({ rule: 'itr', within: { months: -1 }, from: 'due' }, 'ITR')).toBe('1 month before the ITR due date');
    expect(describeSchedule(aoc4, rules)).toBe('Annually, 30 days after AGM');
    expect(describeSchedule(agm)).toBe('Annually, within 6 months after the financial year ends');
  });

  it('rejects chains that point nowhere, loop or mix year bases', () => {
    const errors = (rs: Rule[]) => validateRules(rs).join('\n');
    expect(errors([aoc4])).toMatch(/follows unknown or unscheduled rule "agm"/);
    const a = rule({ id: 'a-rule', schedule: { kind: 'annual', day: 1, follows: { rule: 'b-rule', within: { days: 1 } } } });
    const b = rule({ id: 'b-rule', schedule: { kind: 'annual', day: 1, follows: { rule: 'a-rule', within: { days: 1 } } } });
    expect(errors([a, b])).toMatch(/chain loops back/);
    const tax = rule({ id: 'tax-rule', schedule: { kind: 'annual', day: 1, follows: { rule: 'agm', within: { days: 1 } } } });
    expect(errors([agm, tax])).toMatch(/entityYear must match agm/);
    expect(errors([agm, aoc4, csr2])).toBe('');
  });
});

describe('custom ranges reaching back', () => {
  it('starts up to 15 months back, never in the future', () => {
    expect(minHorizonStart('2026-10-15')).toBe('2025-07-15');
    expect(clampStart('2026-10-15', '2024-01-01')).toBe('2025-07-15');
    expect(clampStart('2026-10-15', '2026-12-01')).toBe('2026-10-15');
    expect(horizonRange('custom', '2026-10-15', '2027-01-15', { customFrom: '2026-01-01' })).toMatchObject({ from: '2026-01-01', to: '2027-01-15' });
  });

  it('ends "FY end" at the end of the entity\'s year', () => {
    expect(horizonRange('fy', '2026-10-15').to).toBe('2027-03-31');
    expect(horizonRange('fy', '2026-10-15', undefined, { fyStart: 1 }).to).toBe('2026-12-31');
  });

  it('keeps a valid financial year and drops a bad one when loading state', () => {
    expect(normalizeState({ profile: { fyStart: 1 } }).profile.fyStart).toBe(1);
    expect(normalizeState({ profile: { fyStart: 13 } }).profile.fyStart).toBe(4);
    expect(normalizeState({ trackingSince: 'soon' }, '2026-10-15').trackingSince).toBe('2026-10-15');
    // A record without a real date would move every step that runs from it.
    const filed = normalizeState({ filed: { 'a@1': { filedOn: '' }, 'b@1': { filedOn: '2026-09-12' } } }).filed;
    expect(Object.keys(filed)).toEqual(['b@1']);
  });

  it('changes one preference and keeps the rest, the reference currency included', () => {
    const s = withPrefs(emptyState('2026-10-15'), { currency: 'USD' });
    const next = withPrefs(s, { horizon: 'custom', customFrom: '2026-01-01', customEnd: '2027-01-01' });
    expect(next.prefs).toMatchObject({ currency: 'USD', horizon: 'custom', customFrom: '2026-01-01', sort: 'due' });
  });
});

describe('chains in the real data', () => {
  const bundle = loadBundle();

  it('reproduces every researched April-March date through its chain and exact placement', () => {
    const chained = expandOptions(bundle);
    const own = { ...chained, rules: undefined };
    for (const r of bundle.rules.filter((x) => x.schedule?.follows || x.schedule?.after)) {
      // The legacy placement alone: what older readers of the data compute.
      const legacy = { ...r, schedule: { ...r.schedule!, after: undefined, follows: undefined } };
      const a = expandRule(r, '2025-01-01', '2028-12-31', chained).map((o) => `${o.periodKey}=${o.due}`);
      const b = expandRule(legacy, '2025-01-01', '2028-12-31', own).map((o) => `${o.periodKey}=${o.due}`);
      expect(a, r.id).toEqual(b);
    }
  });

  it('keeps the April-March dates of rules moved to an exact day count', () => {
    const due = (id: string) => expandRule(bundle.rules.find((r) => r.id === id)!, '2026-04-01', '2027-05-31', expandOptions(bundle)).map((o) => o.due);
    expect(due('mca-llp-form11-annual')).toEqual(['2026-05-30', '2027-05-30']);
    expect(due('sebi-integrated-filing-governance-quarterly')).toEqual(['2026-04-30', '2026-07-30', '2026-10-30', '2027-01-30', '2027-04-30']);
  });

  it('keeps a filing pulled back before tracking began, as overdue', () => {
    const filed = { 'mca-agm-annual@FY2025-26': { filedOn: '2026-08-01' } };
    const rows = buildRows({ bundle, profile: DEFAULT_PROFILE, today: '2026-10-15', to: '2026-12-31', filed, planned: [], trackingSince: '2026-09-20', includeOverdue: true });
    const row = (id: string) => rows.find((r) => r.rule.id === id && r.occ.periodKey === 'FY2025-26');
    expect(row('mca-adt1-annual')).toMatchObject({ state: 'overdue' });
    expect(row('mca-adt1-annual')?.occ.due).toBe('2026-08-15');
    expect(row('mca-aoc4-annual')).toMatchObject({ state: 'overdue' });
    expect(row('mca-aoc4-annual')?.occ.due).toBe('2026-08-31');
  });

  it('keeps one record for the AGM under both of its deadlines', () => {
    const top = bundle.rules.find((r) => r.id === 'sebi-agm-top100-annual')!;
    const key = recordKey(top, { key: 'sebi-agm-top100-annual@FY2025-26', periodKey: 'FY2025-26' });
    expect(key).toBe('mca-agm-annual@FY2025-26');
    const filed = { [key]: { filedOn: '2026-08-20' } };
    const rows = buildRows({ bundle, profile: DEFAULT_PROFILE, today: '2026-08-25', to: '2026-12-31', filed, planned: [], trackingSince: '2026-04-01', includeOverdue: true });
    const row = (id: string) => rows.find((r) => r.rule.id === id && r.occ.periodKey === 'FY2025-26');
    expect(row('sebi-agm-top100-annual')?.state).toBe('filed');
    expect(row('mca-agm-annual')?.state).toBe('filed');
    expect(row('mca-aoc4-annual')?.occ.due).toBe('2026-09-19');
    expect([...anchorRules(bundle)].sort()).toEqual(['gst-gstr9-annual', 'mca-agm-annual', 'sebi-agm-top100-annual']);
  });

  it('moves the AGM chain with the date the AGM was held', () => {
    const filed = { 'mca-agm-annual@FY2025-26': { filedOn: '2026-09-12' } };
    const rows = buildRows({ bundle, profile: DEFAULT_PROFILE, today: '2026-09-15', to: '2026-12-31', filed, planned: [], trackingSince: '2026-09-01' });
    const due = (id: string) => rows.find((r) => r.rule.id === id)?.occ.due;
    expect(due('mca-aoc4-annual')).toBe('2026-10-12');
    expect(due('mca-mgt7-annual')).toBe('2026-11-11');
    expect(due('mca-adt1-annual')).toBe('2026-09-26');
    expect(due('mca-csr2-annual')).toBe('2026-10-12');
    expect(rows.find((r) => r.rule.id === 'mca-aoc4-annual')?.chainNote).toBe('30 days after AGM, held 12 Sep 2026');
  });

  it('traces the chain both ways', () => {
    const filed = { 'mca-agm-annual@FY2025-26': { filedOn: '2026-09-12' } };
    const opts = expandOptions(bundle, { filed });
    const aoc = bundle.rules.find((r) => r.id === 'mca-aoc4-annual')!;
    const occ = occurrenceFor(aoc, 'FY2025-26', opts)!;
    const steps = lineage(bundle, { rule: aoc, occ, state: 'upcoming', daysLeft: 0, exposure: 0 }, { profile: DEFAULT_PROFILE, filed });
    expect(steps.map((s) => `${s.level}:${s.rule.code}`)).toEqual(['-1:AGM', '0:AOC-4', '1:CSR-2']);
    expect(steps[0].filed?.filedOn).toBe('2026-09-12');
    const agmRule = bundle.rules.find((r) => r.id === 'mca-agm-annual')!;
    const agmOcc = occurrenceFor(agmRule, 'FY2025-26', opts)!;
    const down = lineage(bundle, { rule: agmRule, occ: agmOcc, state: 'filed', daysLeft: 0, exposure: 0 }, { profile: DEFAULT_PROFILE, filed });
    expect(down.filter((s) => s.level === 1).map((s) => s.rule.code)).toEqual(['REG 34', 'ADT-1', 'AOC-4', 'MGT-15', 'MGT-7', 'MGT-7A']);
    expect(down.filter((s) => s.level === 2).map((s) => s.rule.code)).toEqual(['BRSR', 'CSR-2']);
  });

  it('notes a chained date for the table and exports', () => {
    const all = rulesById(bundle);
    const ta = bundle.rules.find((r) => r.id === 'income-tax-tp-report-1961-act')!;
    const [o] = expandRule(ta, '2026-04-01', '2027-03-31', expandOptions(bundle));
    expect(o.due).toBe('2026-10-31');
    expect(chainNote(o, all)).toBe('1 month before the ITR TP due date');
  });
});
