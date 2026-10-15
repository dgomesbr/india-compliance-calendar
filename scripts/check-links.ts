// Checks every cited URL and prints a Markdown report (for the job summary).
//   node scripts/check-links.ts

import { loadHolidays, loadRules, loadYamlFile } from '../src/lib/load.ts';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const urls = new Map<string, string[]>();
const add = (url: string | undefined, where: string) => {
  if (!url) return;
  urls.set(url, [...(urls.get(url) ?? []), where]);
};
for (const r of loadRules()) {
  for (const s of r.sources) add(s.url, r.id);
  for (const o of r.overrides ?? []) add(o.source?.url, `${r.id} (${o.period})`);
}
for (const l of loadHolidays()) add(l.source.url, l.id);
for (const s of loadYamlFile<{ sources: { id: string; url: string }[] }>(process.cwd(), 'data', 'sources.yaml')?.sources ?? []) add(s.url, `source ${s.id}`);

async function check(url: string): Promise<string | null> {
  for (const method of ['HEAD', 'GET']) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const r = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA }, signal: ctrl.signal });
      if (r.ok) return null;
      if (method === 'GET') return `HTTP ${r.status}`;
    } catch (e) {
      if (method === 'GET') return e instanceof Error ? e.name === 'AbortError' ? 'timeout' : e.message : String(e);
    } finally {
      clearTimeout(t);
    }
  }
  return 'unreachable';
}

const list = [...urls.keys()];
const failures: [string, string][] = [];
let i = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (i < list.length) {
      const url = list[i++];
      const err = await check(url);
      if (err) failures.push([url, err]);
    }
  }),
);

console.log(`## Source links\n\n${list.length} URLs checked, ${failures.length} not resolving from this runner.\n`);
if (failures.length) {
  console.log('Indian government sites often block requests from outside India; a failure here is a prompt to recheck, not proof the link is dead.\n');
  console.log('| URL | Result | Cited by |\n|---|---|---|');
  for (const [url, err] of failures.sort()) console.log(`| ${url} | ${err} | ${(urls.get(url) ?? []).slice(0, 3).join(', ')} |`);
}
