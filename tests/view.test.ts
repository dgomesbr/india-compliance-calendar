import { describe, expect, it } from 'vitest';
import { appliesTo, DEFAULT_PROFILE, type Profile } from '../src/lib/profile.ts';
import { importState, emptyState, exportState } from '../src/lib/store.ts';
import type { Bundle, Rule } from '../src/lib/types.ts';
import { buildRows, countStates, rowState, sortRows } from '../src/lib/view.ts';

function rule(id: string, partial: Partial<Rule> = {}): Rule {
  return {
    id,
    code: id.toUpperCase(),
    title: id,
    category: 'gst',
    authority: 'Test',
    summary: 'Test',
    applicability: 'Test',
    audience: ['gst'],
    frequency: 'monthly',
    schedule: { kind: 'monthly', day: 20, monthOffset: 1 },
    law: 'Test',
    sources: [{ title: 'Test', url: 'https://example.gov.in' }],
    verified: '2026-10-14',
    confidence: 'high',
    ...partial,
  };
}

function bundle(rules: Rule[]): Bundle {
  return {
    meta: { generated: '', confirmedThrough: '2027-06-30', site: '', version: '0', counts: { rules: rules.length, categories: {} } },
    rules,
    holidays: [
      {
        id: 'central', title: 'Central', kind: 'gazetted', scope: 'IN', year: 2026, authority: 'DoPT',
        source: { title: 'DoPT', url: 'https://dopt.gov.in' }, verified: '2026-10-14', confidence: 'high',
        holidays: [{ date: '2026-11-20', name: 'Test holiday' }],
      },
    ],
    events: [
      { id: 'agm', title: 'AGM held', description: '', category: 'mca', steps: [{ code: 'AOC-4', title: 'Accounts', within: { days: 30 }, law: 'S137' }] },
    ],
  };
}

describe('rowState', () => {
  it('orders filed, overdue, before tracking, soon, extended and upcoming', () => {
    expect(rowState('2026-10-10', '2026-10-15', { filedOn: '2026-10-09' }, false)).toBe('filed');
    expect(rowState('2026-10-10', '2026-10-15', undefined, false, '2026-10-01')).toBe('overdue');
    expect(rowState('2026-10-10', '2026-10-15', undefined, false, '2026-10-12')).toBe('past');
    expect(rowState('2026-10-22', '2026-10-15', undefined, true)).toBe('soon');
    expect(rowState('2026-11-22', '2026-10-15', undefined, true)).toBe('extended');
    expect(rowState('2026-11-22', '2026-10-15', undefined, false)).toBe('upcoming');
  });
});

describe('buildRows', () => {
  const b = bundle([
    rule('gstr3b', { exposure: { lateFeePerDay: 50, lateFeeCap: 10000 } }),
    rule('pf', { category: 'labour', audience: ['employer'], schedule: { kind: 'monthly', day: 15, monthOffset: 1 } }),
  ]);
  const base = { bundle: b, profile: DEFAULT_PROFILE, filed: {}, planned: [], trackingSince: '2026-10-01' };

  it('includes overdue items since tracking began and flags holidays', () => {
    const rows = buildRows({ ...base, today: '2026-10-18', to: '2026-11-30', includeOverdue: true });
    const states = rows.map((r) => `${r.rule.id}:${r.occ.due}:${r.state}`);
    expect(states).toContain('pf:2026-10-15:overdue');
    expect(states).toContain('gstr3b:2026-10-20:soon');
    const nov = rows.find((r) => r.rule.id === 'gstr3b' && r.occ.due === '2026-11-20');
    expect(nov?.closed).toEqual(['Test holiday']);
  });

  it('drops filed past items and keeps filed future ones as filed', () => {
    const filed = { 'pf@2026-09': { filedOn: '2026-10-14' }, 'gstr3b@2026-09': { filedOn: '2026-10-16' } };
    const rows = buildRows({ ...base, filed, today: '2026-10-18', to: '2026-10-31', includeOverdue: true });
    expect(rows.find((r) => r.occ.key === 'pf@2026-09')).toBeUndefined();
    expect(rows.find((r) => r.occ.key === 'gstr3b@2026-09')?.state).toBe('filed');
  });

  it('adds planned event deadlines', () => {
    const planned = [{ id: 'p1', eventId: 'agm', date: '2026-09-30', created: '2026-09-30' }];
    const rows = buildRows({ ...base, planned, today: '2026-10-15', to: '2026-11-30' });
    const aoc = rows.find((r) => r.planned);
    expect(aoc?.occ.due).toBe('2026-10-30');
    expect(aoc?.rule.code).toBe('AOC-4');
  });

  it('sorts by exposure with filed items last', () => {
    const rows = buildRows({ ...base, today: '2026-10-15', to: '2026-11-30' });
    const sorted = sortRows(rows, 'exposure');
    expect(sorted[0].rule.id).toBe('gstr3b');
    expect(countStates(rows).upcoming + countStates(rows).soon).toBe(rows.length);
  });
});

describe('appliesTo', () => {
  const p = (x: Partial<Profile>): Profile => ({ ...DEFAULT_PROFILE, ...x });
  it('shows everything by default', () => {
    expect(appliesTo(rule('a', { audience: ['listed'] }), DEFAULT_PROFILE)).toBe(true);
  });
  it('narrows by entity, GST mode and state', () => {
    const company = p({ entity: 'private-company', gst: 'monthly', states: ['MH'] });
    expect(appliesTo(rule('listed', { audience: ['listed'] }), company)).toBe(false);
    expect(appliesTo(rule('qrmp', { tags: ['gst-qrmp'] }), company)).toBe(false);
    expect(appliesTo(rule('monthly', { tags: ['gst-monthly'] }), company)).toBe(true);
    expect(appliesTo(rule('ka-pt', { category: 'state', audience: ['employer'], states: ['KA'] }), company)).toBe(false);
    expect(appliesTo(rule('mh-pt', { category: 'state', audience: ['employer'], states: ['MH'] }), company)).toBe(true);
    expect(appliesTo(rule('mgt7a', { audience: ['company'], tags: ['opc-small'] }), company)).toBe(false);
    expect(appliesTo(rule('mgt7a', { audience: ['company'], tags: ['opc-small'] }), p({ entity: 'opc' }))).toBe(true);
  });
  it('honours switched-off activities in the everything profile', () => {
    expect(appliesTo(rule('pf', { audience: ['employer'] }), p({ employer: false }))).toBe(false);
  });
});

describe('team state export and import', () => {
  it('merges filed records, newer filing wins', () => {
    const mine = emptyState('2026-10-01');
    mine.filed = { a: { filedOn: '2026-10-05' }, b: { filedOn: '2026-10-06' } };
    const theirs = emptyState('2026-09-01');
    theirs.filed = { a: { filedOn: '2026-10-07', ack: 'X1' }, c: { filedOn: '2026-10-02' } };
    const { state, filedAdded } = importState(mine, exportState(theirs));
    expect(filedAdded).toBe(1);
    expect(state.filed.a.ack).toBe('X1');
    expect(state.filed.b.filedOn).toBe('2026-10-06');
    expect(state.trackingSince).toBe('2026-09-01');
  });
  it('rejects files that are not JSON', () => {
    expect(() => importState(emptyState(), 'not json')).toThrow();
  });
});
