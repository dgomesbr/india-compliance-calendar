import { describe, expect, it } from 'vitest';
import { addMonths, fyEnd, relativeDays, todayIST } from '../src/lib/dates.ts';
import { delayCost, exposure30, exposureLine, formatINR, formatINRCompact } from '../src/lib/exposure.ts';
import { describeRange, horizonRange, maxHorizonEnd } from '../src/lib/horizon.ts';
import { buildCalendar, escapeText, foldLine } from '../src/lib/ics.ts';
import { toCSV } from '../src/lib/csv.ts';

describe('dates', () => {
  it('takes today in IST', () => {
    // 2026-10-14 20:00 UTC is 15 Oct 01:30 IST.
    expect(todayIST(Date.UTC(2026, 9, 14, 20, 0))).toBe('2026-10-15');
    expect(todayIST(Date.UTC(2026, 9, 14, 18, 0))).toBe('2026-10-14');
  });
  it('clamps month arithmetic', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonths('2026-10-14', 24)).toBe('2028-10-14');
    expect(fyEnd('2026-10-14')).toBe('2027-03-31');
    expect(fyEnd('2027-02-01')).toBe('2027-03-31');
  });
  it('describes relative days', () => {
    expect(relativeDays('2026-10-14', '2026-10-14')).toBe('Today');
    expect(relativeDays('2026-10-14', '2026-10-20')).toBe('In 6 days');
    expect(relativeDays('2026-10-14', '2026-10-11')).toBe('3 days ago');
  });
});

describe('horizons', () => {
  const today = '2026-10-14';
  it('covers the presets', () => {
    expect(horizonRange('1w', today).to).toBe('2026-10-21');
    expect(horizonRange('2w', today).to).toBe('2026-10-28');
    expect(horizonRange('1m', today).to).toBe('2026-11-14');
    expect(horizonRange('1q', today).to).toBe('2027-01-14');
    expect(horizonRange('ye', today).to).toBe('2026-12-31');
    expect(horizonRange('fy', today).to).toBe('2027-03-31');
  });
  it('caps custom horizons at 24 months', () => {
    expect(maxHorizonEnd(today)).toBe('2028-10-14');
    expect(horizonRange('custom', today, '2030-01-01').to).toBe('2028-10-14');
    expect(horizonRange('custom', today, '2026-01-01').to).toBe(today);
    expect(horizonRange('custom', today).to).toBe('2027-04-14');
  });
  it('describes a range', () => {
    expect(describeRange({ from: '2026-10-14', to: '2026-11-14' })).toBe('14 Oct - 14 Nov 2026');
    expect(describeRange({ from: '2026-10-14', to: '2027-01-14' })).toBe('14 Oct 2026 - 14 Jan 2027');
  });
});

describe('exposure', () => {
  it('caps per-day fees and adds flat penalties', () => {
    const gst = { lateFeePerDay: 50, lateFeeCap: 10000 };
    expect(delayCost(gst, 30)).toBe(1500);
    expect(delayCost(gst, 400)).toBe(10000);
    const mca = { fixedPenalty: 10000, lateFeePerDay: 100, maxPenalty: 200000 };
    expect(delayCost(mca, 30)).toBe(13000);
    expect(delayCost(mca, 5000)).toBe(200000);
    expect(delayCost(mca, 0)).toBe(0);
  });
  it('sorts by the 30-day cost and describes interest', () => {
    expect(exposure30({ exposure: { lateFeePerDay: 200 } })).toBe(6000);
    expect(exposure30({})).toBe(0);
    expect(exposureLine({ exposure: { lateFeePerDay: 200, interestPctPerMonth: 1.5 } })).toBe(
      'Rs 6,000 + interest 1.5% a month',
    );
    expect(exposureLine({ exposure: { percentOfTurnover: 0.5, maxPenalty: 150000 } })).toBe(
      'Rs 1,50,000 + 0.5% of turnover, up to Rs 1,50,000',
    );
  });
  it('formats rupees with Indian grouping', () => {
    expect(formatINR(150000)).toBe('Rs 1,50,000');
    expect(formatINRCompact(150000)).toBe('Rs 1.5 L');
    expect(formatINRCompact(25000000)).toBe('Rs 2.5 Cr');
  });
});

describe('ics', () => {
  it('escapes text and folds long lines at 75 octets', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    const folded = foldLine('DESCRIPTION:' + 'x'.repeat(200));
    for (const line of folded.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.split('\r\n').slice(1).every((l) => l.startsWith(' '))).toBe(true);
  });
  it('builds an all-day event with alarms and CRLF endings', () => {
    const ics = buildCalendar({
      name: 'Test',
      stamp: new Date(Date.UTC(2026, 9, 14, 0, 0, 0)),
      events: [{ uid: 'a@icc', date: '2026-10-20', summary: 'GSTR-3B due, Sep 2026', alarmsDaysBefore: [7, 1] }],
    });
    expect(ics).toContain('DTSTART;VALUE=DATE:20261020\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261021\r\n');
    expect(ics).toContain('DTSTAMP:20261014T000000Z\r\n');
    expect(ics).toContain('SUMMARY:GSTR-3B due\\, Sep 2026\r\n');
    expect(ics.match(/BEGIN:VALARM/g)?.length).toBe(2);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '').includes('\n')).toBe(false);
  });
});

describe('csv', () => {
  it('quotes cells that need it', () => {
    expect(toCSV(['a', 'b'], [['x,y', 'say "hi"']])).toBe('a,b\r\n"x,y","say ""hi"""\r\n');
  });
});
