// Penalty exposure: what a delay costs, as far as the law fixes it.
// Interest on unpaid tax depends on the amount, so it is reported, not summed.

import type { Exposure, Rule } from './types.ts';

/** Fixed rupee cost of filing `daysLate` days late: late fees plus flat penalties. */
export function delayCost(e: Exposure | undefined, daysLate: number): number | null {
  if (!e) return null;
  const perDay = e.lateFeePerDay ?? null;
  const fixed = e.fixedPenalty ?? null;
  if (perDay === null && fixed === null) return e.maxPenalty ?? null;
  let fee = perDay !== null ? perDay * Math.max(0, daysLate) : 0;
  if (e.lateFeeCap !== null && e.lateFeeCap !== undefined) fee = Math.min(fee, e.lateFeeCap);
  let total = fee + (daysLate > 0 && fixed !== null ? fixed : 0);
  if (e.maxPenalty !== null && e.maxPenalty !== undefined) total = Math.min(total, e.maxPenalty);
  return total;
}

/** Sort key for "penalty exposure": the fixed cost of a 30-day delay. */
export function exposure30(rule: Pick<Rule, 'exposure'>): number {
  return delayCost(rule.exposure, 30) ?? 0;
}

export function interestNote(e: Exposure | undefined): string | null {
  if (!e) return null;
  if (e.interestPctPerMonth) return `interest ${trimNum(e.interestPctPerMonth)}% a month`;
  if (e.interestPctPerAnnum) return `interest ${trimNum(e.interestPctPerAnnum)}% a year`;
  return null;
}

export function turnoverNote(e: Exposure | undefined): string | null {
  if (!e?.percentOfTurnover) return null;
  const cap = e.maxPenalty ? `, up to ${formatINR(e.maxPenalty)}` : '';
  return `${trimNum(e.percentOfTurnover)}% of turnover${cap}`;
}

function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** "Rs 1,50,000" with Indian digit grouping. */
export function formatINR(n: number): string {
  return `Rs ${inr.format(Math.round(n))}`;
}

/** Compact form for tight columns: "Rs 1.5 L", "Rs 2 Cr", "Rs 9,500". */
export function formatINRCompact(n: number): string {
  if (n >= 1e7) return `Rs ${trimNum(Number((n / 1e7).toFixed(2)))} Cr`;
  if (n >= 1e5) return `Rs ${trimNum(Number((n / 1e5).toFixed(2)))} L`;
  return formatINR(n);
}

/** One-line summary used in tables: "Rs 6,000 + interest 1.5% a month". */
export function exposureLine(rule: Pick<Rule, 'exposure'>, daysLate = 30): string {
  const e = rule.exposure;
  if (!e) return 'Not quantified';
  const parts: string[] = [];
  const cost = delayCost(e, daysLate);
  if (cost) parts.push(formatINR(cost));
  const turnover = turnoverNote(e);
  if (turnover) parts.push(turnover);
  const interest = interestNote(e);
  if (interest) parts.push(interest);
  if (!parts.length && e.other?.length) return e.other[0];
  return parts.length ? parts.join(' + ') : 'Not quantified';
}
