// Reference amounts in Canadian or US dollars beside the rupee figures. The law fixes
// every penalty in rupees; the dollar value is a convenience for teams that budget in
// CAD or USD, at the Bank of Canada's daily rate, and the rupee stays on screen.

import { formatINR, formatINRCompact } from './exposure.ts';

export const REF_CURRENCIES = ['CAD', 'USD'] as const;
export type RefCurrency = (typeof REF_CURRENCIES)[number];
export const DEFAULT_CURRENCY: RefCurrency = 'CAD';

export const CURRENCY_LABEL: Record<RefCurrency, string> = { CAD: 'Canadian dollars', USD: 'US dollars' };
const SYMBOL: Record<RefCurrency, string> = { CAD: 'CA$', USD: 'US$' };

/** Daily rates from the Bank of Canada (data/fx.json). */
export interface Fx {
  /** Business day the rates are for. */
  date: string;
  cadPerInr: number;
  usdPerInr: number;
  usdcad: number;
  source: string;
  url: string;
  fetched?: string;
}

export function isCurrency(v: unknown): v is RefCurrency {
  return typeof v === 'string' && (REF_CURRENCIES as readonly string[]).includes(v);
}

export function toRef(inr: number, fx: Fx, cur: RefCurrency): number {
  return inr * (cur === 'CAD' ? fx.cadPerInr : fx.usdPerInr);
}

const whole = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const one = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 1 });

/** "CA$22.40", "CA$1,250", compact "CA$29.5K" or "US$1.2M". */
export function formatRef(amount: number, cur: RefCurrency, compact = false): string {
  const s = SYMBOL[cur];
  const a = Math.abs(amount);
  if (compact && a >= 1e6) return `${s}${one.format(amount / 1e6)}M`;
  if (compact && a >= 1e4) return `${s}${one.format(amount / 1e3)}K`;
  if (a < 100) return `${s}${cents.format(amount)}`;
  return `${s}${whole.format(amount)}`;
}

/** The rupee figure, compact for tight places. */
export function formatInr(inr: number, compact = false): string {
  return compact ? formatINRCompact(inr) : formatINR(inr);
}

/** "1 CAD = 66.98 INR, Bank of Canada, 15 Oct 2026" style note (date left to the caller's formatter). */
export function rateText(fx: Fx, cur: RefCurrency): string {
  const inrPerUnit = 1 / (cur === 'CAD' ? fx.cadPerInr : fx.usdPerInr);
  return `1 ${cur} = ${inrPerUnit.toFixed(2)} INR`;
}

export interface MoneyFormat {
  cur: RefCurrency;
  fx: Fx | null;
  /** Reference amount, or null when no rate is loaded. */
  ref: (inr: number, compact?: boolean) => string | null;
  inr: (inr: number, compact?: boolean) => string;
  /** One line, reference first: "CA$22.40 (Rs 1,500)", or the rupee figure alone without a rate. */
  both: (inr: number, compact?: boolean) => string;
}

export function moneyFormat(fx: Fx | null | undefined, cur: RefCurrency = DEFAULT_CURRENCY): MoneyFormat {
  const rate = fx ?? null;
  const ref = (inr: number, compact = false) => (rate ? formatRef(toRef(inr, rate, cur), cur, compact) : null);
  const inr = (n: number, compact = false) => formatInr(n, compact);
  return {
    cur,
    fx: rate,
    ref,
    inr,
    both: (n, compact = false) => {
      const r = ref(n, compact);
      return r ? `${r} (${inr(n, compact)})` : inr(n, compact);
    },
  };
}
