// Every URL the calendar cites, and a polite reachability check for each.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadHolidays, loadRules, loadYamlFile } from '../../src/lib/load.ts';

const run = promisify(execFile);

// Names the project in every request, as the feed collector does; no browser disguise.
export const UA = 'india-compliance-calendar/0.1 (+https://github.com/dgomesbr/india-compliance-calendar; source refresher)';

/** URL -> where it is cited (rule ids, holiday list ids, catalogue entries). Templated API URLs are left out. */
export function citedUrls(root: string = process.cwd()): Map<string, string[]> {
  const urls = new Map<string, string[]>();
  const add = (url: string | undefined, where: string) => {
    if (!url || /[{}]/.test(url)) return;
    urls.set(url, [...(urls.get(url) ?? []), where]);
  };
  for (const r of loadRules(root)) {
    for (const s of r.sources) add(s.url, r.id);
    for (const o of r.overrides ?? []) add(o.source?.url, `${r.id} (${o.period})`);
  }
  for (const l of loadHolidays(root)) {
    add(l.source.url, l.id);
    for (const s of l.alsoSee ?? []) add(s.url, l.id);
  }
  for (const s of loadYamlFile<{ sources: { id: string; url: string }[] }>(root, 'data', 'sources.yaml')?.sources ?? []) add(s.url, `source ${s.id}`);
  return urls;
}

/**
 * ok: the page answered. refused: the server answered but turned an automated request away
 * (401, 403, 405, 418, 429 and the like), which says nothing about the link. not-found: 404 or
 * 410, the one result that needs a person. unreachable: no answer from this runner, which for
 * Indian government sites outside India is common.
 */
export type LinkStatus = 'ok' | 'refused' | 'not-found' | 'unreachable';

export interface LinkResult {
  url: string;
  status: LinkStatus;
  detail: string;
  citedBy: string[];
}

const classify = (code: number): LinkStatus => (code >= 200 && code < 400 ? 'ok' : code === 404 || code === 410 ? 'not-found' : code > 0 ? 'refused' : 'unreachable');

async function viaFetch(url: string, method: 'HEAD' | 'GET'): Promise<number> {
  const r = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(20_000) });
  await r.body?.cancel();
  return r.status;
}

/** Some government servers refuse Node's TLS handshake but answer curl; it also follows their certificate chains. */
async function viaCurl(url: string): Promise<number> {
  try {
    const { stdout } = await run('curl', ['-s', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null', '-L', '--max-time', '25', '-A', UA, '-w', '%{http_code}', url]);
    return Number(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

async function check(url: string): Promise<{ status: LinkStatus; detail: string }> {
  let code = 0;
  let detail = '';
  try {
    code = await viaFetch(url, 'HEAD');
    // Plenty of servers answer HEAD badly; ask again with GET before judging.
    if (classify(code) !== 'ok') code = await viaFetch(url, 'GET');
  } catch (e) {
    detail = e instanceof Error ? (e.name === 'TimeoutError' ? 'timeout' : e.message) : String(e);
    code = await viaCurl(url);
  }
  const status = classify(code);
  return { status, detail: code ? `HTTP ${code}` : detail || 'no answer' };
}

/** Check every URL, eight at a time; returns every result that is not ok. */
export async function checkLinks(urls: Map<string, string[]>): Promise<LinkResult[]> {
  const list = [...urls.keys()];
  const out: LinkResult[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (i < list.length) {
        const url = list[i++];
        const { status, detail } = await check(url);
        if (status !== 'ok') out.push({ url, status, detail, citedBy: (urls.get(url) ?? []).slice(0, 5) });
      }
    }),
  );
  return out.sort((a, b) => a.status.localeCompare(b.status) || a.url.localeCompare(b.url));
}

export function linkReport(total: number, results: LinkResult[]): string {
  const count = (s: LinkStatus) => results.filter((r) => r.status === s).length;
  const lines = [
    `## Source links\n\n${total} URLs checked: ${total - results.length} answered, ${count('refused')} answered but refused an automated request, ${count('unreachable')} did not answer from this runner, ${count('not-found')} not found.\n`,
  ];
  const notFound = results.filter((r) => r.status === 'not-found');
  if (notFound.length) {
    lines.push('Not found (recheck and replace these):\n', '| URL | Result | Cited by |', '|---|---|---|');
    for (const r of notFound) lines.push(`| ${r.url} | ${r.detail} | ${r.citedBy.slice(0, 3).join(', ')} |`);
  }
  const unreachable = results.filter((r) => r.status === 'unreachable');
  if (unreachable.length) {
    lines.push('', 'Did not answer from this runner (Indian government sites often refuse requests from outside India):\n', '| URL | Result | Cited by |', '|---|---|---|');
    for (const r of unreachable) lines.push(`| ${r.url} | ${r.detail} | ${r.citedBy.slice(0, 3).join(', ')} |`);
  }
  return lines.join('\n');
}
