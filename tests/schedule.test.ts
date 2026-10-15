import { describe, expect, it } from 'vitest';
import { describeSchedule, expandRule } from '../src/lib/schedule.ts';
import type { Rule } from '../src/lib/types.ts';

function rule(partial: Partial<Rule>): Rule {
  return {
    id: 'test-rule',
    code: 'TEST',
    title: 'Test rule',
    category: 'gst',
    authority: 'Test',
    summary: 'Test',
    applicability: 'Test',
    audience: ['gst'],
    frequency: 'monthly',
    law: 'Test',
    sources: [{ title: 'Test', url: 'https://example.gov.in' }],
    verified: '2026-10-14',
    confidence: 'high',
    ...partial,
  };
}

const dues = (r: Rule, from: string, to: string) => expandRule(r, from, to).map((o) => o.due);

describe('monthly', () => {
  it('places GSTR-3B on the 20th of the following month', () => {
    const r = rule({ schedule: { kind: 'monthly', day: 20, monthOffset: 1 } });
    expect(dues(r, '2026-10-01', '2027-01-31')).toEqual(['2026-10-20', '2026-11-20', '2026-12-20', '2027-01-20']);
    const [first] = expandRule(r, '2026-10-01', '2026-10-31');
    expect(first.periodKey).toBe('2026-09');
    expect(first.periodLabel).toBe('Sep 2026');
    expect(first.key).toBe('test-rule@2026-09');
  });

  it('applies the March exception for TDS deposits', () => {
    const r = rule({ schedule: { kind: 'monthly', day: 7, monthOffset: 1, except: { '3': { day: 30, monthOffset: 1 } } } });
    expect(dues(r, '2027-03-01', '2027-05-31')).toEqual(['2027-03-07', '2027-04-30', '2027-05-07']);
  });

  it('skips the last month of each quarter for PMT-06', () => {
    const r = rule({ schedule: { kind: 'monthly', day: 25, monthOffset: 1, skip: ['3', '6', '9', '12'] } });
    expect(dues(r, '2026-07-01', '2026-12-31')).toEqual(['2026-08-25', '2026-09-25', '2026-11-25', '2026-12-25']);
  });

  it('clamps day 31 to short months and supports "last"', () => {
    const r = rule({ schedule: { kind: 'monthly', day: 31, monthOffset: 1 } });
    expect(dues(r, '2027-02-01', '2027-04-30')).toEqual(['2027-02-28', '2027-03-31', '2027-04-30']);
    const last = rule({ schedule: { kind: 'monthly', day: 'last', monthOffset: 0 } });
    expect(dues(last, '2028-02-01', '2028-02-29')).toEqual(['2028-02-29']);
  });
});

describe('quarterly', () => {
  it('computes TDS statements with the Q4 exception', () => {
    const r = rule({
      frequency: 'quarterly',
      schedule: { kind: 'quarterly', day: 31, monthOffset: 1, except: { Q4: { day: 31, monthOffset: 2 } } },
    });
    const occ = expandRule(r, '2026-04-01', '2027-06-30');
    expect(occ.map((o) => o.due)).toEqual(['2026-05-31', '2026-07-31', '2026-10-31', '2027-01-31', '2027-05-31']);
    expect(occ[0].periodKey).toBe('FY2025-26-Q4');
    expect(occ[1].periodKey).toBe('FY2026-27-Q1');
    expect(occ[1].periodLabel).toBe('Q1 FY 2026-27 (Apr-Jun)');
  });

  it('places advance tax in the quarter end month', () => {
    const r = rule({ frequency: 'quarterly', schedule: { kind: 'quarterly', day: 15, monthOffset: 0 } });
    expect(dues(r, '2026-04-01', '2027-03-31')).toEqual(['2026-06-15', '2026-09-15', '2026-12-15', '2027-03-15']);
  });

  it('supports days after the quarter end (Reg 33: 45 days)', () => {
    const r = rule({ frequency: 'quarterly', schedule: { kind: 'quarterly', daysAfter: 45, except: { Q4: { daysAfter: 60 } } } });
    expect(dues(r, '2026-07-01', '2027-06-30')).toEqual(['2026-08-14', '2026-11-14', '2027-02-14', '2027-05-30']);
  });

  it('supports calendar quarters', () => {
    const r = rule({ frequency: 'quarterly', schedule: { kind: 'quarterly', basis: 'calendar', day: 30, monthOffset: 1 } });
    const occ = expandRule(r, '2026-01-01', '2026-12-31');
    expect(occ.map((o) => o.due)).toEqual(['2026-01-30', '2026-04-30', '2026-07-30', '2026-10-30']);
    expect(occ[1].periodKey).toBe('CY2026-Q1');
  });
});

describe('half-yearly and annual', () => {
  it('computes MSME-1 on the last day of the month after each half', () => {
    const r = rule({ frequency: 'half-yearly', schedule: { kind: 'half-yearly', day: 'last', monthOffset: 1 } });
    const occ = expandRule(r, '2026-04-01', '2027-04-30');
    expect(occ.map((o) => o.due)).toEqual(['2026-04-30', '2026-10-31', '2027-04-30']);
    expect(occ.map((o) => o.periodKey)).toEqual(['FY2025-26-H2', 'FY2026-27-H1', 'FY2026-27-H2']);
  });

  it('computes calendar halves (labour welfare fund)', () => {
    const r = rule({ frequency: 'half-yearly', schedule: { kind: 'half-yearly', basis: 'calendar', day: 15, monthOffset: 1 } });
    expect(dues(r, '2026-07-01', '2027-07-31')).toEqual(['2026-07-15', '2027-01-15', '2027-07-15']);
  });

  it('computes GSTR-9 on 31 December after the financial year', () => {
    const r = rule({ frequency: 'annual', schedule: { kind: 'annual', day: 31, monthOffset: 9 } });
    const occ = expandRule(r, '2026-04-01', '2028-12-31');
    expect(occ.map((o) => o.due)).toEqual(['2026-12-31', '2027-12-31', '2028-12-31']);
    expect(occ[0].periodKey).toBe('FY2025-26');
    expect(occ[0].periodLabel).toBe('FY 2025-26');
  });

  it('computes calendar-year rules due in the next January', () => {
    const r = rule({ frequency: 'annual', schedule: { kind: 'annual', basis: 'calendar', day: 15, monthOffset: 1 } });
    const occ = expandRule(r, '2027-01-01', '2027-12-31');
    expect(occ.map((o) => [o.periodKey, o.due])).toEqual([['CY2026', '2027-01-15']]);
  });

  it('repeats every three years from the anchor', () => {
    const r = rule({
      frequency: 'every-n-years',
      schedule: { kind: 'every-n-years', everyYears: 3, anchor: 'FY2027-28', day: 30, monthOffset: 3 },
    });
    expect(dues(r, '2026-01-01', '2034-12-31')).toEqual(['2028-06-30', '2031-06-30', '2034-06-30']);
  });
});

describe('fixed, overrides and effective windows', () => {
  it('lists fixed dates inside the window', () => {
    const r = rule({
      frequency: 'one-time',
      schedule: { kind: 'fixed', dates: [{ due: '2026-11-30', period: 'FY 2025-26' }, { due: '2027-11-30', period: 'FY 2026-27' }] },
    });
    expect(dues(r, '2026-04-01', '2027-03-31')).toEqual(['2026-11-30']);
  });

  it('moves a period to its notified extension and keeps the statutory date', () => {
    const r = rule({
      frequency: 'annual',
      schedule: { kind: 'annual', day: 30, monthOffset: 6 },
      overrides: [{ period: 'FY2025-26', due: '2026-10-31', reason: 'Extended by circular', source: { title: 'C', url: 'https://x.gov.in' } }],
    });
    const [occ] = expandRule(r, '2026-04-01', '2027-03-31');
    expect(occ.due).toBe('2026-10-31');
    expect(occ.originalDue).toBe('2026-09-30');
    expect(occ.extended?.reason).toBe('Extended by circular');
    expect(occ.projected).toBe(false);
  });

  it('only includes periods that start inside the effective window', () => {
    const r = rule({ schedule: { kind: 'monthly', day: 7, monthOffset: 1 }, effective: { from: '2026-04-01', to: null } });
    expect(dues(r, '2026-04-01', '2026-06-30')).toEqual(['2026-05-07', '2026-06-07']);
    const old = rule({ schedule: { kind: 'monthly', day: 7, monthOffset: 1 }, effective: { from: null, to: '2026-03-31' } });
    expect(dues(old, '2026-04-01', '2026-06-30')).toEqual(['2026-04-07']);
  });

  it('flags occurrences past the confirmed window as projected', () => {
    const r = rule({ schedule: { kind: 'monthly', day: 20, monthOffset: 1 } });
    const occ = expandRule(r, '2027-06-01', '2027-08-31', { confirmedThrough: '2027-06-30' });
    expect(occ.map((o) => o.projected)).toEqual([false, true, true]);
  });

  it('counts working days past weekends and holidays', () => {
    const r = rule({ schedule: { kind: 'monthly', workingDaysAfter: 7 } });
    // Month ends Wed 30 Sep 2026; 2 Oct (Fri) is a holiday.
    const occ = expandRule(r, '2026-10-01', '2026-10-31', { holidays: new Set(['2026-10-02']) });
    expect(occ.map((o) => o.due)).toEqual(['2026-10-12']);
  });
});

describe('describeSchedule', () => {
  it('reads like a sentence', () => {
    expect(describeSchedule(rule({ schedule: { kind: 'monthly', day: 20, monthOffset: 1 } }))).toBe(
      'Monthly, by the 20th of the following month',
    );
    expect(describeSchedule(rule({ schedule: { kind: 'quarterly', daysAfter: 45 } }))).toBe(
      'Quarterly, within 45 days after the quarter ends',
    );
    expect(describeSchedule(rule({ schedule: { kind: 'annual', day: 31, monthOffset: 9 } }))).toBe(
      'Annually, by the 31st of the 9th month after the financial year',
    );
  });
});
