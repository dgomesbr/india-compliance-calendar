// The cost of a delay as a curve: the fixed rupee cost against days late, as far
// as the law fixes it. Shared by the detail panel and the entry pages.

import { delayCost, formatINRCompact } from './exposure.ts';
import type { Exposure } from './types.ts';

export interface DelayPoint {
  day: number;
  cost: number;
}

/** A curve only says something when the cost grows with each day late. */
export function hasDelayCurve(e: Exposure | undefined): boolean {
  return Boolean(e?.lateFeePerDay);
}

/** Corners of the cost curve over [0, maxDays]; it is straight between them. */
export function delaySeries(e: Exposure | undefined, maxDays = 365): DelayPoint[] {
  const pts: DelayPoint[] = [];
  for (let day = 0; day <= maxDays; day++) {
    const cost = delayCost(e, day) ?? 0;
    const n = pts.length;
    if (n >= 2) {
      const a = pts[n - 2];
      const b = pts[n - 1];
      // b sits on the straight line from a to this point: move it here instead of adding one.
      if ((b.cost - a.cost) * (day - b.day) === (cost - b.cost) * (b.day - a.day)) {
        pts[n - 1] = { day, cost };
        continue;
      }
    }
    pts.push({ day, cost });
  }
  return pts;
}

/** Round a maximum up to 1, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 times a power of ten. */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) if (m * p >= v) return m * p;
  return 10 * p;
}

export interface DelayGeometry {
  width: number;
  height: number;
  /** Plot box inside the chart. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  max: number;
  x: (day: number) => number;
  y: (cost: number) => number;
  line: string;
  area: string;
  yTicks: { value: number; y: number; label: string }[];
  xTicks: { day: number; x: number; label: string }[];
}

const X_TICKS = [0, 30, 90, 180, 365];
const X_TICKS_NARROW = [0, 90, 180, 365];

export function delayGeometry(points: DelayPoint[], width: number, height: number, maxDays = 365): DelayGeometry {
  const left = 58;
  const right = width - 14;
  const top = 14;
  const bottom = height - 24;
  const max = niceMax(Math.max(0, ...points.map((p) => p.cost)));
  const x = (day: number) => left + (day / maxDays) * (right - left);
  const y = (cost: number) => top + (1 - cost / max) * (bottom - top);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)} ${y(p.cost).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const area = points.length
    ? `${line} L${x(last.day).toFixed(1)} ${bottom.toFixed(1)} L${x(points[0].day).toFixed(1)} ${bottom.toFixed(1)} Z`
    : '';
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    max,
    x,
    y,
    line,
    area,
    yTicks: [0, max / 2, max].map((value) => ({ value, y: y(value), label: value ? formatINRCompact(value) : 'Rs 0' })),
    xTicks: (width < 480 ? X_TICKS_NARROW : X_TICKS)
      .filter((d) => d <= maxDays)
      .map((day) => ({ day, x: x(day), label: day ? `${day} days` : 'Due' })),
  };
}

/** Plain-language summary of the curve for screen readers and the table view. */
export function delaySummary(e: Exposure | undefined, days: number[] = [30, 90, 365]): string {
  return days.map((d) => `${formatINRCompact(delayCost(e, d) ?? 0)} at ${d} days`).join(', ');
}
