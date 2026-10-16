// The monthly holiday update (GitHub Actions, update-holidays.yml).
//   node scripts/update-holidays.ts
//
// Indian holidays move: festivals follow the moon, the Centre and the states declare or
// shift days during the year, and RBI adds bank holidays for local events such as polls.
// Once a month this reads the official lists that answer from a build runner, applies the
// changes to data/holidays (adding the next year when its source publishes it), records
// what changed in data/holiday-updates.json, and prints a summary. The calendars abroad
// are refreshed the same way from their authorities' feeds.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { todayIST, type ISODate } from '../src/lib/dates.ts';
import type { HolidayList } from '../src/lib/types.ts';
import { applySource, createFrom, type ListChange, type SourceHoliday } from './lib/holiday-diff.ts';
import { nseHolidays, portalHolidays, rbiHolidays, RBI_OFFICES, UA } from './lib/india-holidays.ts';

const ROOT = process.cwd();
const DIR = join(ROOT, 'data', 'holidays');
const today = todayIST();
const year = Number(today.slice(0, 4));

// ---------- the holiday files, kept as written ----------

interface HolidayFile {
  header: string;
  lists: HolidayList[];
  changed: boolean;
}

const files = new Map<string, HolidayFile>();
for (const name of readdirSync(DIR).filter((f) => f.endsWith('.yaml'))) {
  const text = readFileSync(join(DIR, name), 'utf8');
  files.set(name, { header: text.split('\n')[0], lists: (parse(text) as { lists: HolidayList[] }).lists ?? [], changed: false });
}

function find(pred: (l: HolidayList) => boolean): { file: string; index: number; list: HolidayList } | null {
  for (const [file, f] of files) {
    const index = f.lists.findIndex(pred);
    if (index >= 0) return { file, index, list: f.lists[index] };
  }
  return null;
}

function put(file: string, list: HolidayList, index?: number) {
  const f = files.get(file) ?? { header: `# Official holiday lists for ${list.year}.`, lists: [], changed: false };
  if (index === undefined) f.lists.push(list);
  else f.lists[index] = list;
  f.changed = true;
  files.set(file, f);
}

const changes: ListChange[] = [];
const confirmed: string[] = [];
const skipped: { source: string; reason: string }[] = [];

/** Apply a source to the list matching `pred` for `y`; create it from last year's when the source is ahead of us. */
function update(pred: (l: HolidayList) => boolean, y: number, src: SourceHoliday[], sourceName: string, newFile = `${y}.yaml`) {
  const hit = find((l) => pred(l) && l.year === y);
  if (hit) {
    const r = applySource(hit.list, src, sourceName, today);
    if (r.skipped) return void skipped.push({ source: sourceName, reason: r.skipped });
    put(hit.file, r.list, hit.index);
    if (r.change) changes.push(r.change);
    else confirmed.push(hit.list.id);
    return;
  }
  const template = find((l) => pred(l) && l.year === y - 1);
  if (!template || !src.length) return;
  const created = createFrom(template.list, y, src, sourceName, today);
  put(newFile, created);
  changes.push({ list: created.id, source: sourceName, added: created.holidays, removed: [], moved: [], conflicts: [], created: true });
}

const attempt = async (source: string, fn: () => Promise<void>) => {
  try {
    await fn();
  } catch (e) {
    skipped.push({ source, reason: e instanceof Error ? e.message : String(e) });
  }
};

// ---------- India ----------

for (const y of [year, year + 1]) {
  await attempt(`RBI holiday matrix ${y}`, async () => {
    const byState = await rbiHolidays(y, Object.keys(RBI_OFFICES));
    for (const [scope, src] of byState) update((l) => l.kind === 'bank' && l.scope === scope, y, src, 'RBI holiday matrix');
  });
  await attempt(`National Portal of India holidays ${y}`, async () => {
    const { gazetted, restricted } = await portalHolidays(y);
    update((l) => l.kind === 'gazetted' && l.scope === 'IN', y, gazetted, 'National Portal of India (DoPT list)');
    if (restricted.length) update((l) => l.kind === 'restricted' && l.scope === 'IN', y, restricted, 'National Portal of India (DoPT list)');
  });
}
await attempt('NSE trading holidays', async () => {
  for (const y of [year, year + 1]) {
    let src: SourceHoliday[] = [];
    try {
      src = await nseHolidays('trading', y);
    } catch (e) {
      // Next year's list is often not out yet; only this year's failure is news.
      if (y === year) throw e;
    }
    if (src.length) update((l) => l.kind === 'exchange-trading' && l.scope === 'NSE', y, src, 'NSE holiday API');
  }
});
await attempt('NSE settlement holidays', async () => {
  for (const y of [year, year + 1]) {
    let src: SourceHoliday[] = [];
    try {
      src = await nseHolidays('clearing', y);
    } catch (e) {
      // Next year's list is often not out yet; only this year's failure is news.
      if (y === year) throw e;
    }
    if (src.length) update((l) => l.kind === 'exchange-settlement' && l.scope === 'NSE', y, src, 'NSE holiday API');
  }
});

// ---------- abroad ----------

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const pad = (n: number) => String(n).padStart(2, '0');
const get = async (url: string, accept = '*/*') => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, signal: AbortSignal.timeout(40_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
};

await attempt('OPM federal holidays feed', async () => {
  const ics = await get('https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/holidays.ics', 'text/calendar');
  const events = ics.split('BEGIN:VEVENT').slice(1).map((e) => ({
    date: /DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/.exec(e),
    name: /SUMMARY:([^\r\n]*)/.exec(e)?.[1].replace(/\\,/g, ',').trim() ?? 'Federal holiday',
  }));
  for (const y of [year, year + 1]) {
    const src = events
      .filter((e) => e.date && Number(e.date[1]) === y && !/inauguration/i.test(e.name))
      .map((e) => ({ date: `${e.date![1]}-${e.date![2]}-${e.date![3]}`, name: e.name }));
    if (src.length) update((l) => l.kind === 'statutory' && l.scope === 'US', y, src, 'OPM federal holidays feed', `abroad-${y}.yaml`);
  }
});

await attempt('Labour Program general holidays', async () => {
  const js = await get('https://wages-salaires.service.canada.ca/_conf/assets/js/general_holiday.js');
  const en = js.slice(js.indexOf('holidayJsonEN'), js.indexOf('holidayJsonFR') > 0 ? js.indexOf('holidayJsonFR') : undefined);
  const entries = [...en.matchAll(/"date":\s*"(\d{4}-\d{2}-\d{2})",\s*"name":\s*"([^"]*)"/g)].map((m) => ({
    date: m[1],
    // "Thanksgiving Day October 12, 2026" -> "Thanksgiving Day"
    name: m[2].replace(/\s+[A-Z][a-z]+ \d{1,2}, \d{4}$/, '').trim(),
  }));
  for (const y of [year, year + 1]) {
    const src = entries.filter((e) => e.date.startsWith(`${y}-`));
    if (src.length) update((l) => l.kind === 'statutory' && l.scope === 'CA', y, src, 'Labour Program general holidays', `abroad-${y}.yaml`);
  }
});

await attempt('Payments Canada closure schedule', async () => {
  const html = await get('https://www.payments.ca/system-closure-schedule', 'text/html');
  for (const y of [year, year + 1]) {
    const table = new RegExp(`<h2[^>]*>\\s*${y}\\s*</h2>\\s*<table>([\\s\\S]*?)</table>`).exec(html)?.[1];
    if (!table) continue;
    const src: (SourceHoliday & { actual?: string })[] = [];
    for (const row of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const cells = [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      const when = (text: string) => {
        const m = /([A-Za-z]+)\s+(\d{1,2})\s*$/.exec(text ?? '');
        const month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
        return m && month >= 0 ? `${y}-${pad(month + 1)}-${pad(Number(m[2]))}` : null;
      };
      const closure = when(cells[2]);
      if (closure) src.push({ date: closure, name: cells[0].replace(/^Thanksgiving$/, 'Thanksgiving Day') });
    }
    if (!src.length) continue;
    // A year we drafted from the rule becomes the published list.
    const hit = find((l) => l.kind === 'bank' && l.scope === 'CA-ON' && l.year === y);
    if (hit && hit.list.confidence === 'medium') {
      const published: HolidayList = {
        ...hit.list,
        confidence: 'high',
        verified: today,
        source: { title: 'Payments Canada, system closure schedule', url: 'https://www.payments.ca/system-closure-schedule' },
        notes: `Payments Canada's published ${y} closures of Lynx and the ACSS: the ten federal statutory holidays, a holiday on a weekend closing the next business day. Easter Monday, Family Day and the Civic Holiday are processing days.`,
      };
      const r = applySource(published, src, 'Payments Canada closure schedule', today);
      put(hit.file, r.list, hit.index);
      changes.push(r.change ?? { list: hit.list.id, source: 'Payments Canada closure schedule', added: [], removed: [], moved: [], conflicts: [] });
    } else update((l) => l.kind === 'bank' && l.scope === 'CA-ON', y, src, 'Payments Canada closure schedule', `abroad-${y}.yaml`);
  }
});

// ---------- write and record ----------

for (const [name, f] of files) {
  if (!f.changed) continue;
  writeFileSync(join(DIR, name), `${f.header}\n${stringify({ lists: f.lists }, { lineWidth: 0 })}`);
}

const LOG = join(ROOT, 'data', 'holiday-updates.json');
const log = existsSync(LOG) ? (JSON.parse(readFileSync(LOG, 'utf8')) as { runs: unknown[] }) : { runs: [] };
const run = { date: today, changes, confirmed, skipped };
log.runs = [run, ...log.runs.filter((r) => (r as { date: ISODate }).date !== today)].slice(0, 12);
writeFileSync(LOG, `${JSON.stringify(log, null, 1)}\n`);

const out = ['# Monthly holiday update', '', `Run ${today}.`, ''];
out.push(`${confirmed.length} lists confirmed unchanged against their sources.`, '');
if (changes.length) {
  out.push('## Changes applied', '');
  for (const c of changes) {
    const parts = [
      c.created ? `created with ${c.added.length} dates` : '',
      c.added.length && !c.created ? `added ${c.added.map((h) => `${h.date} (${h.name})`).join(', ')}` : '',
      c.removed.length ? `removed ${c.removed.map((h) => `${h.date} (${h.name})`).join(', ')}` : '',
      c.moved.length ? `moved ${c.moved.map((m) => `${m.name} from ${m.from} to ${m.to}`).join(', ')}` : '',
      c.conflicts.length ? `left for review: ${c.conflicts.map((x) => `${x.date} ${x.name} (${x.reason})`).join(', ')}` : '',
    ].filter(Boolean);
    out.push(`- ${c.list} (${c.source}): ${parts.join('; ') || 'promoted to the published list'}`);
  }
  out.push('');
}
if (skipped.length) {
  out.push('## Not updated', '');
  for (const s of skipped) out.push(`- ${s.source}: ${s.reason}`);
}
console.log(out.join('\n'));
