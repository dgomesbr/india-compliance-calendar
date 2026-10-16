import { describe, expect, it } from 'vitest';
import { addMonths } from '../src/lib/dates.ts';
import { loadEvents, loadHolidays, loadRules } from '../src/lib/load.ts';
import { expandRule } from '../src/lib/schedule.ts';
import { validateEvents, validateHolidays, validateRules } from '../src/lib/validate.ts';

const rules = loadRules();

describe('data files', () => {
  it('has rules', () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it('passes rule validation', () => {
    expect(validateRules(rules)).toEqual([]);
  });

  it('passes holiday validation', () => {
    expect(validateHolidays(loadHolidays())).toEqual([]);
  });

  it('passes planner event validation', () => {
    expect(validateEvents(loadEvents(), rules)).toEqual([]);
  });

  it('expands every scheduled rule to at least one date from the 15-month look back to 48 months ahead', () => {
    // Rules that ended (the 1961-Act twins, the annual DIR-3 KYC) only have dates in the look back.
    const from = addMonths('2026-04-01', -15);
    const to = addMonths('2026-04-01', 48);
    const silent = rules.filter((r) => r.schedule && r.schedule.kind !== 'fixed' && expandRule(r, from, to).length === 0);
    expect(silent.map((r) => r.id)).toEqual([]);
  });

  it('keeps overrides on real periods of their rule', () => {
    const problems: string[] = [];
    for (const r of rules) {
      for (const o of r.overrides ?? []) {
        const hit = expandRule(r, '2020-01-01', '2032-12-31').some((occ) => occ.periodKey === o.period);
        if (!hit) problems.push(`${r.id}: override period ${o.period} matches no occurrence`);
      }
    }
    expect(problems).toEqual([]);
  });
});
