import { describe, expect, it } from 'vitest';
import { applySource, createFrom } from '../scripts/lib/holiday-diff.ts';
import { asciiName, nseDate, parseRbiList } from '../scripts/lib/india-holidays.ts';
import { toExcelCSV, toTSV } from '../src/lib/csv.ts';
import { formatRef, moneyFormat, toRef, type Fx } from '../src/lib/money.ts';
import type { HolidayList } from '../src/lib/types.ts';

const list = (holidays: HolidayList['holidays']): HolidayList => ({
  id: 'bank-mh-2026', title: 'Bank holidays 2026 - Maharashtra', kind: 'bank', scope: 'MH', year: 2026,
  authority: 'RBI', source: { title: 'RBI holiday matrix 2026', url: 'https://www.rbi.org.in/Scripts/HolidayMatrixDisplay.aspx' },
  verified: '2026-10-14', confidence: 'high', holidays,
});

describe('reading the official holiday lists', () => {
  it('parses an RBI regional office list by month', () => {
    const html = `<h3>Mumbai regional office holiday list for the year 2026 </h3><table>
      <tr><th class="tableheader" colspan="3"><span class="dop_header"> May</span></th></tr>
      <tr><td> 1</td><td>Maharashtra Din/Buddha Pournima</td><td>*</td></tr>
      <tr><td> 28</td><td>Bakri ID (Id-Uz-Zuha)</td><td>*</td></tr>
      <tr><th class="tableheader" colspan="3"><span class="dop_header"> June</span></th></tr>
      <tr><td> 26</td><td>Muharram</td><td>*</td></tr></table>`;
    expect(parseRbiList(html, 2026)).toEqual([
      { date: '2026-05-01', name: 'Maharashtra Din / Buddha Pournima' },
      { date: '2026-05-28', name: 'Bakri ID (Id-Uz-Zuha)' },
      { date: '2026-06-26', name: 'Muharram' },
    ]);
  });

  it('reads NSE dates and keeps names ASCII', () => {
    expect(nseDate('26-Jan-2026')).toBe('2026-01-26');
    expect(nseDate('not a date')).toBeNull();
    const curly = `Banks${String.fromCharCode(0x2019)} Closing ${String.fromCharCode(0x2013)} April`;
    expect(asciiName(curly)).toBe("Banks' Closing - April");
  });
});

describe('applying a source to a list', () => {
  const ours = list([
    { date: '2026-05-01', name: 'Maharashtra Day' },
    { date: '2026-05-27', name: 'Bakri Id (Id-uz-Zuha)' },
    { date: '2026-06-26', name: 'Muharram' },
    { date: '2026-08-15', name: 'Independence Day' },
  ]);

  it('moves a holiday that the source now gives on another day', () => {
    const r = applySource(ours, [
      { date: '2026-05-01', name: 'Maharashtra Din' },
      { date: '2026-05-28', name: 'Bakri ID (Id-Uz-Zuha)' },
      { date: '2026-06-26', name: 'Muharram' },
      { date: '2026-08-15', name: 'Independence Day' },
    ], 'RBI holiday matrix', '2026-11-01');
    expect(r.change?.moved).toEqual([{ from: '2026-05-27', to: '2026-05-28', name: 'Bakri Id (Id-uz-Zuha)' }]);
    expect(r.list.holidays.map((h) => h.date)).toEqual(['2026-05-01', '2026-05-28', '2026-06-26', '2026-08-15']);
    expect(r.list.holidays[1].note).toMatch(/^Moved from 27 May 2026 by RBI holiday matrix/);
    expect(r.list.verified).toBe('2026-11-01');
  });

  it('adds a newly declared holiday and keeps our names for known dates', () => {
    const r = applySource(ours, [...ours.holidays.map((h) => ({ date: h.date, name: `${h.name} (RBI)` })), { date: '2026-01-15', name: 'Municipal elections' }], 'RBI holiday matrix', '2026-11-01');
    expect(r.change?.added.map((h) => h.date)).toEqual(['2026-01-15']);
    expect(r.list.holidays.find((h) => h.date === '2026-05-01')?.name).toBe('Maharashtra Day');
  });

  it('never removes a curated date, and flags it instead', () => {
    const curated = list([...ours.holidays.slice(0, 3), { date: '2026-08-15', name: 'Independence Day', note: 'Kept by a later order.' }]);
    const r = applySource(curated, ours.holidays.slice(0, 3), 'RBI holiday matrix', '2026-11-01');
    expect(r.list.holidays.map((h) => h.date)).toContain('2026-08-15');
    expect(r.change?.conflicts.map((c) => c.date)).toEqual(['2026-08-15']);
  });

  it('skips a source that returned too little to trust', () => {
    const r = applySource(ours, [{ date: '2026-05-01', name: 'Maharashtra Day' }], 'RBI holiday matrix', '2026-11-01');
    expect(r.skipped).toMatch(/returned 1 dates for a list of 4/);
    expect(r.list).toBe(ours);
  });

  it('confirms an unchanged list without recording a change', () => {
    const r = applySource(ours, ours.holidays, 'RBI holiday matrix', '2026-11-01');
    expect(r.change).toBeNull();
    expect(r.list.verified).toBe('2026-11-01');
  });

  it('creates next year from this year when the source publishes it', () => {
    const next = createFrom(ours, 2027, [{ date: '2027-01-26', name: 'Republic Day' }], 'RBI holiday matrix', '2026-12-01');
    expect(next.id).toBe('bank-mh-2027');
    expect(next.title).toBe('Bank holidays 2027 - Maharashtra');
    expect(next.holidays).toEqual([{ date: '2027-01-26', name: 'Republic Day' }]);
  });
});

describe('reference amounts', () => {
  const fx: Fx = { date: '2026-10-15', cadPerInr: 0.01493, usdPerInr: 0.010517, usdcad: 1.4196, source: 'Bank of Canada', url: 'https://www.bankofcanada.ca/' };

  it('converts rupees and formats the reference currency', () => {
    expect(toRef(1500, fx, 'CAD')).toBeCloseTo(22.395);
    expect(formatRef(22.395, 'CAD')).toBe('CA$22.40');
    expect(formatRef(29_517, 'CAD', true)).toBe('CA$29.5K');
    expect(formatRef(1_250, 'USD')).toBe('US$1,250');
  });

  it('puts the reference first and the rupee figure in brackets', () => {
    expect(moneyFormat(fx, 'CAD').both(15_000)).toBe('CA$224 (Rs 15,000)');
    expect(moneyFormat(fx, 'USD').both(15_000)).toBe('US$158 (Rs 15,000)');
    expect(moneyFormat(null).both(15_000)).toBe('Rs 15,000');
  });
});

describe('exports for spreadsheets', () => {
  it('copies tab-separated rows and downloads CSV with a byte order mark', () => {
    expect(toTSV(['a', 'b'], [['x\ty', 2]])).toBe('a\tb\r\nx y\t2\r\n');
    const csv = toExcelCSV(['a'], [['1, 2']]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('a\r\n"1, 2"\r\n');
  });
});
