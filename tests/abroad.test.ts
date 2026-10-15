import { describe, expect, it } from 'vitest';
import { abroadDays, abroadMeaning, easter, nthWeekday, ruleHolidays, victoriaDay } from '../src/lib/abroad.ts';
import { centralHolidays, closedDays } from '../src/lib/view.ts';
import type { HolidayList } from '../src/lib/types.ts';

const dates = (cal: Parameters<typeof ruleHolidays>[0], y: number) => ruleHolidays(cal, y).map((h) => h.date);

describe('holiday rules abroad', () => {
  it('finds Easter, Victoria Day and nth weekdays', () => {
    expect(easter(2026)).toBe('2026-04-05');
    expect(easter(2027)).toBe('2027-03-28');
    expect(victoriaDay(2026)).toBe('2026-05-18');
    expect(victoriaDay(2027)).toBe('2027-05-24');
    expect(nthWeekday(2026, 11, 4, 4)).toBe('2026-11-26');
    expect(nthWeekday(2026, 5, 1, -1)).toBe('2026-05-25');
  });

  it('observes US federal holidays on the nearest weekday, across the year end', () => {
    expect(dates('us-federal', 2026)).toEqual([
      '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19', '2026-07-03',
      '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25',
    ]);
    // 1 January 2028 is a Saturday, so it is observed on 31 December 2027.
    expect(dates('us-federal', 2027)).toContain('2027-12-31');
    expect(dates('us-federal', 2027)).toEqual(expect.arrayContaining(['2027-06-18', '2027-07-05', '2027-12-24']));
  });

  it('keeps the Federal Reserve open the Friday before a Saturday holiday', () => {
    const fed = dates('us-fed-bank', 2027);
    expect(fed).not.toContain('2027-06-18');
    expect(fed).toContain('2027-07-05');
    expect(dates('us-fed-bank', 2026)).toContain('2026-07-04');
  });

  it('closes the Canadian payment systems on the next business day, never on Family Day or the Civic Holiday', () => {
    expect(dates('ca-on-bank', 2026)).toEqual([
      '2026-01-01', '2026-04-03', '2026-05-18', '2026-07-01', '2026-09-07', '2026-09-30',
      '2026-10-12', '2026-11-11', '2026-12-25', '2026-12-28',
    ]);
    expect(dates('ca-on-bank', 2027).slice(-2)).toEqual(['2027-12-27', '2027-12-28']);
    expect(ruleHolidays('ca-on-bank', 2026).find((h) => h.date === '2026-12-28')?.actual).toBe('2026-12-26');
  });

  it('lists the Canadian and Ontario holidays on their legal dates', () => {
    expect(dates('ca-federal', 2026)).toEqual([
      '2026-01-01', '2026-04-03', '2026-05-18', '2026-07-01', '2026-09-07', '2026-09-30',
      '2026-10-12', '2026-11-11', '2026-12-25', '2026-12-26',
    ]);
    expect(dates('ca-on-statutory', 2026)).toContain('2026-02-16');
    expect(dates('ca-on-statutory', 2026)).not.toContain('2026-11-11');
  });
});

describe('holidays abroad in the views', () => {
  const list = (id: string, kind: HolidayList['kind'], scope: string, holidays: HolidayList['holidays']): HolidayList => ({
    id, title: id, kind, scope, year: 2026, authority: 'Test', source: { title: 'Test', url: `https://example.org/${id}` },
    verified: '2026-10-15', confidence: 'high', holidays,
  });
  const bundle = {
    holidays: [
      list('central', 'gazetted', 'IN', [{ date: '2026-10-20', name: 'Dussehra' }]),
      list('ca', 'statutory', 'CA', [{ date: '2026-10-12', name: 'Thanksgiving Day' }]),
      list('on', 'statutory', 'CA-ON', [{ date: '2026-10-12', name: 'Thanksgiving Day' }]),
      list('on-bank', 'bank', 'CA-ON', [{ date: '2026-10-12', name: 'Thanksgiving Day' }]),
      list('us', 'statutory', 'US', [{ date: '2026-10-12', name: 'Columbus Day' }]),
      list('fed', 'bank', 'US', [{ date: '2026-10-12', name: 'Columbus Day' }]),
    ],
  };

  it('merges a holiday across the lists that carry it', () => {
    const day = abroadDays(bundle, ['CA', 'CA-ON', 'US']).get('2026-10-12')!;
    expect(day.map((h) => h.country)).toEqual(['CA', 'US']);
    expect(abroadMeaning(day[0])).toBe('federal and Ontario statutory holiday; payment systems closed');
    expect(abroadMeaning(day[1])).toBe('federal holiday; Federal Reserve closed');
    expect(abroadDays(bundle, ['US']).get('2026-10-12')!.map((h) => h.country)).toEqual(['US']);
  });

  it('never moves or flags an Indian due date', () => {
    expect([...centralHolidays(bundle).keys()]).toEqual(['2026-10-20']);
    expect(closedDays(bundle, ['MH']).has('2026-10-12')).toBe(false);
  });
});
