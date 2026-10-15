// Collects regulator RSS/Atom feeds into data/updates.json.
// Run by the daily GitHub Actions build. A failing feed keeps its previous
// items, so one blocked regulator never empties the list.
//
//   node scripts/fetch-feeds.ts            write data/updates.json
//   node scripts/fetch-feeds.ts --dry-run  print a summary only

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import type { Update } from '../src/lib/types.ts';

interface Feed {
  id: string;
  name: string;
  url: string;
  category?: Update['category'];
  /** Only keep items whose title matches this regular expression. */
  include?: string;
  /** rss (RSS or Atom, default), wp-json (WordPress REST list) or gst-news (GST portal JSON). */
  format?: 'rss' | 'wp-json' | 'gst-news';
}

const ROOT = process.cwd();
const OUT = join(ROOT, 'data', 'updates.json');
const PER_SOURCE = 25;
const TOTAL = 250;
// Browser-compatible, still naming the project, so basic bot filters on public feeds let it through.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 india-compliance-calendar/0.1 (+https://github.com/dgomesbr/india-compliance-calendar)';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, ' - ')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block: string, name: string): string | null {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(block);
  return m ? m[1] : null;
}

function atomLink(block: string): string | null {
  const alt = /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i.exec(block);
  const any = /<link[^>]*href=["']([^"']+)["']/i.exec(block);
  return (alt ?? any)?.[1] ?? null;
}

function toISODate(raw: string | null): string | null {
  if (!raw) return null;
  const t = Date.parse(decode(raw));
  if (Number.isNaN(t)) {
    const m = /(\d{1,2})[-/ ](\w{3})[-/ ,]+(\d{4})/.exec(raw);
    if (m) {
      const t2 = Date.parse(`${m[1]} ${m[2]} ${m[3]}`);
      if (!Number.isNaN(t2)) return new Date(t2 + 330 * 60_000).toISOString().slice(0, 10);
    }
    return null;
  }
  return new Date(t + 330 * 60_000).toISOString().slice(0, 10);
}

/** Parse RSS 2.0, RSS 1.0 (RDF) or Atom into updates. */
export function parseFeed(xml: string, feed: Feed): Update[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]);
  const out: Update[] = [];
  const include = feed.include ? new RegExp(feed.include, 'i') : null;
  for (const b of blocks) {
    const title = decode(tag(b, 'title') ?? '');
    let link = decode(tag(b, 'link') ?? '') || atomLink(b) || decode(tag(b, 'guid') ?? '');
    link = link.trim();
    const date = toISODate(tag(b, 'pubDate') ?? tag(b, 'dc:date') ?? tag(b, 'updated') ?? tag(b, 'published'));
    if (!title || !/^https?:\/\//.test(link)) continue;
    if (include && !include.test(title)) continue;
    out.push({
      id: `${feed.id}:${link}`,
      source: feed.id,
      sourceName: feed.name,
      title: title.length > 280 ? `${title.slice(0, 277)}...` : title,
      url: link,
      date: date ?? new Date().toISOString().slice(0, 10),
      ...(feed.category ? { category: feed.category } : {}),
    });
  }
  return out;
}

function item(feed: Feed, title: string, url: string, date: string | null): Update {
  const t = decode(title);
  return {
    id: `${feed.id}:${url}`,
    source: feed.id,
    sourceName: feed.name,
    title: t.length > 280 ? `${t.slice(0, 277)}...` : t,
    url,
    date: date ?? new Date().toISOString().slice(0, 10),
    ...(feed.category ? { category: feed.category } : {}),
  };
}

/** WordPress REST lists (the ministries' digifootprint CMS): title.rendered, link, date. */
export function parseWpJson(text: string, feed: Feed): Update[] {
  const list = JSON.parse(text) as { title?: { rendered?: string }; link?: string; date?: string }[];
  if (!Array.isArray(list)) throw new Error('not a WordPress list');
  return list
    .filter((x) => x.title?.rendered && x.link)
    .map((x) => item(feed, x.title!.rendered!, x.link!, x.date ? x.date.slice(0, 10) : null));
}

/** GST portal news: {data: [{id, title, date: "dd/mm/yyyy"}]}. */
export function parseGstNews(text: string, feed: Feed): Update[] {
  const doc = JSON.parse(text) as { data?: { id?: number | string; title?: string; date?: string; linkURl?: string; IsExternal?: string }[] };
  if (!Array.isArray(doc.data)) throw new Error('unexpected GST news shape');
  return doc.data
    .filter((x) => x.title && x.id !== undefined)
    .map((x) => {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(x.date ?? '');
      const date = m ? `${m[3]}-${m[2]}-${m[1]}` : null;
      return item(feed, x.title!, `https://www.gst.gov.in/newsandupdates/read/${x.id}`, date);
    });
}

function decodeBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Some portals send Windows-1252 smart quotes inside a UTF-8 response.
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Some government CDNs refuse Node's TLS fingerprint but serve curl; retry through it. */
function curlText(url: string, headers: Record<string, string>): string {
  const args = ['-sSL', '--compressed', '-m', '25', '-f'];
  for (const [k, v] of Object.entries(headers)) args.push('-H', `${k}: ${v}`);
  args.push(url);
  return decodeBytes(new Uint8Array(execFileSync('curl', args, { maxBuffer: 20 * 1024 * 1024 })));
}

async function fetchText(url: string, format: Feed['format']): Promise<string> {
  try {
    return await fetchDirect(url, format);
  } catch (first) {
    try {
      return curlText(url, headersFor(format));
    } catch {
      throw first;
    }
  }
}

function headersFor(format: Feed['format']): Record<string, string> {
  const accept = format && format !== 'rss' ? 'application/json, text/plain, */*' : 'application/rss+xml, application/xml, text/xml, */*';
  const headers: Record<string, string> = { 'User-Agent': UA, Accept: accept, 'Accept-Language': 'en-IN,en;q=0.9' };
  if (format === 'gst-news') headers.Referer = 'https://www.gst.gov.in/newsandupdates';
  return headers;
}

async function fetchDirect(url: string, format: Feed['format']): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const r = await fetch(url, { headers: headersFor(format), signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return decodeBytes(new Uint8Array(await r.arrayBuffer()));
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry-run');
  const feeds = (YAML.parse(readFileSync(join(ROOT, 'data', 'feeds.yaml'), 'utf8')) as { feeds: Feed[] }).feeds;
  const previous: Update[] = existsSync(OUT) ? ((JSON.parse(readFileSync(OUT, 'utf8')) as { items?: Update[] }).items ?? []) : [];
  const items: Update[] = [];
  const sources: { id: string; name: string; ok: boolean; count: number; error?: string }[] = [];

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const text = await fetchText(feed.url, feed.format);
        const include = feed.include ? new RegExp(feed.include, 'i') : null;
        const parsed = (feed.format === 'wp-json' ? parseWpJson(text, feed) : feed.format === 'gst-news' ? parseGstNews(text, feed) : parseFeed(text, feed))
          .filter((u) => !include || include.test(u.title));
        if (!parsed.length) throw new Error('no items parsed');
        const kept = parsed.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, PER_SOURCE);
        items.push(...kept);
        sources.push({ id: feed.id, name: feed.name, ok: true, count: kept.length });
      } catch (e) {
        const old = previous.filter((u) => u.source === feed.id);
        items.push(...old);
        sources.push({ id: feed.id, name: feed.name, ok: false, count: old.length, error: e instanceof Error ? e.message : String(e) });
      }
    }),
  );

  const seen = new Set<string>();
  const unique = items
    .filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.source.localeCompare(b.source)))
    .slice(0, TOTAL);
  sources.sort((a, b) => a.id.localeCompare(b.id));

  for (const s of sources) console.log(`${s.ok ? 'ok  ' : 'FAIL'} ${s.id.padEnd(16)} ${String(s.count).padStart(3)}${s.error ? `  ${s.error}` : ''}`);
  console.log(`${unique.length} items from ${sources.filter((s) => s.ok).length}/${sources.length} feeds`);
  if (!dry) writeFileSync(OUT, `${JSON.stringify({ fetched: new Date().toISOString(), sources, items: unique }, null, 1)}\n`);
}

if (process.argv[1]?.endsWith('fetch-feeds.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
