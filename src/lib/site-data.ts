// Build-time data, loaded once per build for pages and endpoints.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addDays, addMonths, fyStartYear, iso, todayIST, type ISODate } from './dates.ts';
import { loadBundle, loadUpdatesFile, loadYamlFile, type UpdatesFile } from './load.ts';
import { expandRules } from './schedule.ts';
import { centralHolidays } from './view.ts';
import type { Bundle, Occurrence } from './types.ts';

let bundle: Bundle | null = null;
let updates: UpdatesFile | null = null;

/** Project root: ICC_ROOT, the working directory, or the nearest parent holding data/meta.yaml. */
function findRoot(): string {
  if (process.env.ICC_ROOT) return process.env.ICC_ROOT;
  if (existsSync(join(process.cwd(), 'data', 'meta.yaml'))) return process.cwd();
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'data', 'meta.yaml'))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return process.cwd();
}

export const ROOT = findRoot();

export const SITE_URL = `${(import.meta.env.SITE ?? 'https://dgomesbr.github.io').replace(/\/$/, '')}${import.meta.env.BASE_URL.replace(/\/?$/, '/')}`;

export function getBundle(): Bundle {
  if (!bundle || import.meta.env.DEV) bundle = loadBundle(ROOT, SITE_URL);
  return bundle;
}

export function getUpdates(): UpdatesFile {
  if (!updates || import.meta.env.DEV) updates = loadUpdatesFile(ROOT);
  return updates;
}

/** What the every-other-day source refresher found on its last run (data/source-status.json). */
export interface SourceStatus {
  checked: string;
  runner: string;
  official?: {
    source: string;
    window: string;
    items: number;
    unmatched: { date: string; items: string[] }[];
    calendarOnly: { date: string; codes: string[] }[];
    error?: string;
  }[];
  links: {
    total: number;
    answered: number;
    refused: number;
    unreachable: { url: string; detail: string; citedBy: string[] }[];
    notFound: { url: string; detail: string; citedBy: string[] }[];
  } | null;
  holidays: {
    checked: string[];
    drafted: string[];
    mismatches: { id: string; missing: string[]; extra: string[] }[];
    crossChecks: { source: string; year: number; list: string; missing: string[]; extra: string[]; error?: string }[];
  };
}

export function getSourceStatus(): SourceStatus | null {
  const file = join(ROOT, 'data', 'source-status.json');
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as SourceStatus;
  } catch {
    return null;
  }
}

/** What the monthly holiday update changed (data/holiday-updates.json), newest run first. */
export interface HolidayUpdateRun {
  date: string;
  changes: {
    list: string;
    source: string;
    added: { date: string; name: string }[];
    removed: { date: string; name: string }[];
    moved: { from: string; to: string; name: string }[];
    conflicts: { date: string; name: string; reason: string }[];
    created?: boolean;
  }[];
  confirmed: string[];
  skipped: { source: string; reason: string }[];
}

export function getHolidayUpdates(): HolidayUpdateRun[] {
  const file = join(ROOT, 'data', 'holiday-updates.json');
  if (!existsSync(file)) return [];
  try {
    return (JSON.parse(readFileSync(file, 'utf8')) as { runs?: HolidayUpdateRun[] }).runs ?? [];
  } catch {
    return [];
  }
}

export function buildDate(): ISODate {
  return todayIST();
}

/** Window published in occurrences.json and feeds: current FY start to 25 months ahead. */
export function publishedWindow(): { from: ISODate; to: ISODate } {
  const today = buildDate();
  return { from: iso(fyStartYear(today), 4, 1), to: addMonths(today, 25) };
}

export function occurrencesBetween(from: ISODate, to: ISODate, rules = getBundle().rules): Occurrence[] {
  const b = getBundle();
  return expandRules(rules, from, to, {
    confirmedThrough: b.meta.confirmedThrough,
    holidays: new Set(centralHolidays(b).keys()),
  });
}

export function upcoming(days: number, rules = getBundle().rules): Occurrence[] {
  const today = buildDate();
  return occurrencesBetween(today, addDays(today, days), rules);
}

export interface DataSource {
  id: string;
  name: string;
  publisher: string;
  url: string;
  category: string;
  format: string[];
  access: string;
  license: string;
  updates: string;
  reachable?: { status: number | string; checked: string; note?: string };
  machineReadable?: boolean;
  useInCalendar: string;
  ingestion: string;
  priority: string;
  used?: boolean;
}

export function getSources(): DataSource[] {
  return loadYamlFile<{ sources: DataSource[] }>(ROOT, 'data', 'sources.yaml')?.sources ?? [];
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category?: string;
  homepage?: string;
}

export function getFeeds(): FeedSource[] {
  return loadYamlFile<{ feeds: FeedSource[] }>(ROOT, 'data', 'feeds.yaml')?.feeds ?? [];
}
