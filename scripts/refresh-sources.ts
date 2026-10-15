// The every-other-day source refresher (GitHub Actions, refresh-sources.yml).
//   node scripts/refresh-sources.ts            check, draft and record; prints a Markdown summary
//   node scripts/refresh-sources.ts --no-net   skip the network (rules and drafts only)
//
// 1. Holiday calendars abroad: every published list for this year and next is checked
//    against its statutory rule, and against the authorities' own feeds as a second opinion. A year
//    whose list does not exist yet is drafted from the rule (confidence medium) so the
//    calendar never runs out; the published list replaces the draft when it appears.
// 2. The official due-date feeds that answer from a runner (the Income Tax e-Filing tax
//    calendar for the financial year, the GST portal's current-period dates) are compared
//    with the dates the rules produce.
// 3. Every cited source URL is checked for reachability.
// 4. The results go to data/source-status.json, which the Sources page shows.
// It never edits a published list: disagreements are reported for a person to resolve.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { RULE_CALENDARS, RULE_META, RULE_SCOPE, ruleHolidays, type RuleCalendar } from '../src/lib/abroad.ts';
import { todayIST } from '../src/lib/dates.ts';
import { loadBundle, loadHolidays } from '../src/lib/load.ts';
import type { Holiday, HolidayList } from '../src/lib/types.ts';
import { checkLinks, citedUrls, linkReport, UA, type LinkResult } from './lib/links.ts';
import { gstPortalDates, incomeTaxCalendar, type OfficialCheck } from './lib/official-dates.ts';
import { crossChecks, type CrossCheck } from './lib/open-holidays.ts';

const ROOT = process.cwd();
const OFFLINE = process.argv.includes('--no-net');
const today = todayIST();
const year = Number(today.slice(0, 4));

interface Mismatch {
  id: string;
  /** Rule dates the published list lacks. */
  missing: string[];
  /** Published dates the rule does not produce (one-off holidays, or an error to fix). */
  extra: string[];
}

/** Dates a list covers: its own dates plus the actual dates behind observed ones. */
function coveredDates(hs: Holiday[]): Set<string> {
  const out = new Set<string>();
  for (const h of hs) {
    out.add(h.date);
    if (h.actual) out.add(h.actual);
  }
  return out;
}

const lists = loadHolidays(ROOT);
const byId = new Map(lists.map((l) => [l.id, l]));
const latest = (cal: RuleCalendar): HolidayList | undefined =>
  lists.filter((l) => l.id.startsWith(`${cal}-`)).sort((a, b) => b.year - a.year)[0];

const checked: string[] = [];
const mismatches: Mismatch[] = [];
const drafted: HolidayList[] = [];

for (const y of [year, year + 1]) {
  for (const cal of RULE_CALENDARS) {
    const id = `${cal}-${y}`;
    const expected = ruleHolidays(cal, y);
    const list = byId.get(id);
    if (!list) {
      const base = latest(cal);
      const meta = RULE_META[cal];
      drafted.push({
        id,
        title: base ? base.title.replace(String(base.year), String(y)) : meta.title(y),
        kind: RULE_SCOPE[cal].kind,
        scope: RULE_SCOPE[cal].scope,
        year: y,
        authority: base?.authority ?? meta.authority,
        source: base?.source ?? meta.source,
        ...(base?.alsoSee ? { alsoSee: base.alsoSee } : {}),
        verified: today,
        confidence: 'medium',
        notes: `Drafted from the statutory rule by the source refresher on ${today}; replace with the authority's published list when it appears.`,
        holidays: expected,
      });
      continue;
    }
    checked.push(id);
    const ours = coveredDates(list.holidays);
    const rule = new Set(expected.map((h) => h.date));
    const missing = [...rule].filter((d) => !ours.has(d));
    const extra = list.holidays.map((h) => h.date).filter((d) => !rule.has(d));
    if (missing.length || extra.length) mismatches.push({ id, missing, extra });
  }
}

// Drafts go to data/holidays/abroad-YYYY.yaml, next to the published lists abroad.
for (const y of new Set(drafted.map((d) => d.year))) {
  const file = join(ROOT, 'data', 'holidays', `abroad-${y}.yaml`);
  const doc = existsSync(file) ? (parse(readFileSync(file, 'utf8')) as { lists?: HolidayList[] }) : { lists: [] };
  doc.lists = [...(doc.lists ?? []), ...drafted.filter((d) => d.year === y)];
  writeFileSync(file, `# Holiday calendars abroad for ${y}: Canada, Ontario and the United States.\n${stringify(doc, { lineWidth: 0 })}`);
}

let links: LinkResult[] = [];
let total = 0;
let cross: CrossCheck[] = [];
let official: OfficialCheck[] = [];
if (!OFFLINE) {
  const bundle = loadBundle(ROOT);
  official = [await incomeTaxCalendar(bundle, today, UA), await gstPortalDates(bundle, UA)];
  const urls = citedUrls(ROOT);
  total = urls.size;
  links = await checkLinks(urls);
  cross = await crossChecks(byId, [year, year + 1], UA);
}

const status = {
  checked: new Date().toISOString(),
  runner: process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'local',
  official,
  links: OFFLINE
    ? null
    : {
        total,
        answered: total - links.length,
        refused: links.filter((l) => l.status === 'refused').length,
        unreachable: links.filter((l) => l.status === 'unreachable'),
        notFound: links.filter((l) => l.status === 'not-found'),
      },
  holidays: { checked, drafted: drafted.map((d) => d.id), mismatches, crossChecks: cross },
};
writeFileSync(join(ROOT, 'data', 'source-status.json'), `${JSON.stringify(status, null, 1)}\n`);

const out: string[] = ['# Source refresh', '', `Run ${status.checked} (${status.runner}).`, ''];
if (official.length) {
  out.push('## Official due-date feeds', '');
  for (const c of official) {
    if (c.error) {
      out.push(`- ${c.source} (${c.window}): could not be read - ${c.error}.`);
      continue;
    }
    out.push(`- ${c.source} (${c.window}): ${c.items} items; ${c.unmatched.length} official dates with no matching obligation${c.calendarOnly.length ? `; ${c.calendarOnly.length} calendar dates the feed does not show` : ''}.`);
    for (const u of c.unmatched) out.push(`  - ${u.date}: ${u.items.join(', ')}`);
    for (const u of c.calendarOnly) out.push(`  - calendar only, ${u.date}: ${u.codes.join(', ')}`);
  }
  out.push('');
}
out.push('## Holiday calendars abroad', '');
out.push(`${checked.length} published lists checked against their statutory rules; ${mismatches.length} disagree.`);
for (const m of mismatches) out.push(`- ${m.id}: rule dates missing ${m.missing.join(', ') || 'none'}; extra dates ${m.extra.join(', ') || 'none'}`);
if (drafted.length) out.push('', `Drafted from the rule (no published list yet): ${drafted.map((d) => d.id).join(', ')}.`);
if (cross.length) {
  out.push('', '| Feed | Year | List | In the feed, not in our list | In our list, not in the feed | Note |', '|---|---|---|---|---|---|');
  for (const r of cross) out.push(`| ${r.source} | ${r.year} | ${r.list} | ${r.missing.join(', ') || '-'} | ${r.extra.join(', ') || '-'} | ${r.error ?? ''} |`);
}
out.push('');
if (!OFFLINE) out.push(linkReport(total, links));
console.log(out.join('\n'));
