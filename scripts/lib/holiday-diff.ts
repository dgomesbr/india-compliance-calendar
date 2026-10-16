// Applying an official holiday list to ours, with the safeguards the monthly update needs:
// a short or failed response never wipes a list, a curated entry (one that carries a note,
// such as a date moved by a later order) is never removed or moved by a source that has not
// caught up, and every change is recorded with its source and date.

import { formatDate, type ISODate } from '../../src/lib/dates.ts';
import type { Holiday, HolidayList } from '../../src/lib/types.ts';

export interface SourceHoliday {
  date: ISODate;
  name: string;
}

export interface ListChange {
  list: string;
  source: string;
  added: Holiday[];
  removed: Holiday[];
  moved: { from: ISODate; to: ISODate; name: string }[];
  /** Source dates that disagree with curated entries; left for a person to resolve. */
  conflicts: { date: ISODate; name: string; reason: string }[];
  created?: boolean;
}

export interface ApplyResult {
  list: HolidayList;
  change: ListChange | null;
  /** Why nothing was applied, when the response looked wrong. */
  skipped?: string;
}

const STOP = new Set(['holiday', 'holidays', 'festival', 'birthday', 'first', 'second', 'last', 'the', 'and', 'day']);

function tokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  );
}

const shareName = (a: string, b: string) => [...tokens(a)].some((t) => tokens(b).has(t));
const daysApart = (a: ISODate, b: ISODate) => Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;

/**
 * Bring `list` in line with `source` (dates are what count; our curated names stay).
 * Returns the updated list (verified today) and what changed, or `skipped` when the
 * source returned too little to trust.
 */
export function applySource(list: HolidayList, source: SourceHoliday[], sourceName: string, today: ISODate): ApplyResult {
  const unique = [...new Map(source.map((h) => [h.date, h])).values()].filter((h) => h.date.startsWith(String(list.year)));
  if (unique.length < Math.ceil(list.holidays.length * 0.6)) {
    return { list, change: null, skipped: `${sourceName} returned ${unique.length} dates for a list of ${list.holidays.length}` };
  }
  const ours = new Map(list.holidays.map((h) => [h.date, h]));
  const theirs = new Map(unique.map((h) => [h.date, h]));
  const change: ListChange = { list: list.id, source: sourceName, added: [], removed: [], moved: [], conflicts: [] };

  const gone = list.holidays.filter((h) => !theirs.has(h.date) && !(h.actual && theirs.has(h.actual)));
  const removable = gone.filter((h) => !h.note);
  for (const h of gone.filter((g) => g.note)) {
    change.conflicts.push({ date: h.date, name: h.name, reason: `${sourceName} no longer lists this curated date` });
  }

  const next = list.holidays.filter((h) => !removable.includes(h));
  for (const h of unique.filter((u) => !ours.has(u.date) && !list.holidays.some((x) => x.actual === u.date))) {
    const from = removable.find((r) => daysApart(r.date, h.date) <= 45 && shareName(r.name, h.name));
    if (from) {
      removable.splice(removable.indexOf(from), 1);
      change.moved.push({ from: from.date, to: h.date, name: from.name });
      next.push({ date: h.date, name: from.name, note: `Moved from ${formatDate(from.date, { weekday: false })} by ${sourceName} (monthly holiday update, ${today}).` });
    } else {
      change.added.push(h);
      next.push({ date: h.date, name: h.name, note: `Added from ${sourceName} by the monthly holiday update on ${today}.` });
    }
  }
  change.removed = removable;
  const kept = next.filter((h) => !removable.includes(h)).sort((a, b) => a.date.localeCompare(b.date));
  const changed = change.added.length + change.removed.length + change.moved.length > 0;
  return {
    list: { ...list, holidays: changed ? kept : list.holidays, verified: today },
    change: changed || change.conflicts.length ? change : null,
  };
}

/** A next-year list modelled on this year's, filled from the source. */
export function createFrom(template: HolidayList, year: number, source: SourceHoliday[], sourceName: string, today: ISODate): HolidayList {
  const y0 = String(template.year);
  return {
    ...template,
    id: template.id.replace(y0, String(year)),
    title: template.title.replace(y0, String(year)),
    year,
    source: { ...template.source, title: template.source.title.replace(y0, String(year)) },
    verified: today,
    notes: `Created from ${sourceName} by the monthly holiday update on ${today}.`,
    holidays: [...new Map(source.map((h) => [h.date, h])).values()]
      .filter((h) => h.date.startsWith(String(year)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((h) => ({ date: h.date, name: h.name })),
  };
}
