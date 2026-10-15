import { describe, expect, it } from 'vitest';
import { delayGeometry, delaySeries, delaySummary, hasDelayCurve, niceMax } from '../src/lib/delay.ts';
import { delayCost } from '../src/lib/exposure.ts';

describe('cost-of-delay curve', () => {
  const capped = { lateFeePerDay: 50, lateFeeCap: 5000 };

  it('charts only costs that grow per day', () => {
    expect(hasDelayCurve(capped)).toBe(true);
    expect(hasDelayCurve({ fixedPenalty: 10000 })).toBe(false);
    expect(hasDelayCurve(undefined)).toBe(false);
  });

  it('keeps only the corners of the curve', () => {
    // Rs 50 a day reaches the Rs 5,000 cap on day 100, then stays flat.
    expect(delaySeries(capped, 365)).toEqual([
      { day: 0, cost: 0 },
      { day: 100, cost: 5000 },
      { day: 365, cost: 5000 },
    ]);
  });

  it('matches delayCost on every day', () => {
    const e = { lateFeePerDay: 200, fixedPenalty: 1000, maxPenalty: 20000 };
    const pts = delaySeries(e, 365);
    const at = (d: number) => {
      const i = pts.findIndex((p) => p.day >= d);
      const b = pts[i];
      if (b.day === d) return b.cost;
      const a = pts[i - 1];
      return a.cost + ((b.cost - a.cost) * (d - a.day)) / (b.day - a.day);
    };
    for (const d of [0, 1, 2, 30, 94, 95, 96, 200, 365]) expect(at(d)).toBeCloseTo(delayCost(e, d) ?? 0);
  });

  it('rounds the axis to a readable maximum', () => {
    expect(niceMax(5000)).toBe(5000);
    expect(niceMax(36500)).toBe(40000);
    expect(niceMax(1)).toBe(1);
    expect(niceMax(0)).toBe(1);
  });

  it('lays the curve inside the plot box', () => {
    const g = delayGeometry(delaySeries(capped, 365), 360, 156, 365);
    expect(g.x(0)).toBe(g.left);
    expect(g.x(365)).toBe(g.right);
    expect(g.y(0)).toBe(g.bottom);
    expect(g.y(g.max)).toBe(g.top);
    expect(g.line.startsWith('M')).toBe(true);
    expect(g.area.endsWith('Z')).toBe(true);
    expect(g.xTicks.map((t) => t.label)).toEqual(['Due', '90 days', '180 days', '365 days']);
    const wide = delayGeometry(delaySeries(capped, 365), 640, 196, 365);
    expect(wide.xTicks.map((t) => t.label)).toEqual(['Due', '30 days', '90 days', '180 days', '365 days']);
  });

  it('summarises the curve in words', () => {
    expect(delaySummary(capped)).toBe('Rs 1,500 at 30 days, Rs 4,500 at 90 days, Rs 5,000 at 365 days');
  });
});
