// Review horizons: how far ahead the team wants to see obligations, and for a custom
// range, how far back.

import { addDays, addMonths, formatDate, iso, parts, type ISODate } from './dates.ts';
import { entityYearOf, INDIAN_FY_START } from './fiscal.ts';

export const HORIZON_PRESETS = ['1w', '2w', '1m', '1q', 'ye', 'fy', 'custom'] as const;
export type HorizonPreset = (typeof HORIZON_PRESETS)[number];

export const HORIZON_LABEL: Record<HorizonPreset, string> = {
  '1w': '1 week',
  '2w': '2 weeks',
  '1m': '1 month',
  '1q': '1 quarter',
  ye: 'Year end',
  fy: 'FY end',
  custom: 'Custom',
};

export const MAX_CUSTOM_MONTHS = 24;
/** A custom range may start this many months back. */
export const MAX_LOOKBACK_MONTHS = 15;

export interface HorizonRange {
  preset: HorizonPreset;
  from: ISODate;
  to: ISODate;
}

/** Latest end date a custom horizon may use. */
export function maxHorizonEnd(today: ISODate): ISODate {
  return addMonths(today, MAX_CUSTOM_MONTHS);
}

/** Earliest start a custom range may use. */
export function minHorizonStart(today: ISODate): ISODate {
  return addMonths(today, -MAX_LOOKBACK_MONTHS);
}

export function clampEnd(today: ISODate, end: ISODate): ISODate {
  if (end < today) return today;
  const max = maxHorizonEnd(today);
  return end > max ? max : end;
}

/** A custom start between 15 months back and today. */
export function clampStart(today: ISODate, start: ISODate | undefined): ISODate {
  if (!start || start > today) return today;
  const min = minHorizonStart(today);
  return start < min ? min : start;
}

/** Default end for a custom horizon when none is chosen yet. */
export function defaultCustomEnd(today: ISODate): ISODate {
  return addMonths(today, 6);
}

export interface HorizonOptions {
  /** Start of a custom range; today when absent. */
  customFrom?: ISODate;
  /** First month of the entity's financial year, for "FY end". */
  fyStart?: number;
}

export function horizonRange(preset: HorizonPreset, today: ISODate, customEnd?: ISODate, opts: HorizonOptions = {}): HorizonRange {
  const { y } = parts(today);
  let to: ISODate;
  let from = today;
  switch (preset) {
    case '1w':
      to = addDays(today, 7);
      break;
    case '2w':
      to = addDays(today, 14);
      break;
    case '1m':
      to = addMonths(today, 1);
      break;
    case '1q':
      to = addMonths(today, 3);
      break;
    case 'ye':
      to = iso(y, 12, 31);
      break;
    case 'fy':
      to = entityYearOf(today, opts.fyStart ?? INDIAN_FY_START).to;
      break;
    case 'custom':
      to = clampEnd(today, customEnd ?? defaultCustomEnd(today));
      from = clampStart(today, opts.customFrom);
      break;
  }
  return { preset, from, to };
}

/** "14 Oct - 14 Nov 2026" */
export function describeRange(r: { from: ISODate; to: ISODate }): string {
  const sameYear = r.from.slice(0, 4) === r.to.slice(0, 4);
  return `${formatDate(r.from, { weekday: false, year: !sameYear })} - ${formatDate(r.to, { weekday: false })}`;
}
