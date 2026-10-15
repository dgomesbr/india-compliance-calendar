// Node-only: reads the YAML data files into one bundle.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { CATEGORIES, type Bundle, type EventType, type HolidayList, type Meta, type Rule, type Update } from './types.ts';

function readYaml<T>(file: string): T {
  return YAML.parse(readFileSync(file, 'utf8')) as T;
}

function yamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
    .map((f) => join(dir, f));
}

export function loadRules(root: string = process.cwd()): Rule[] {
  const rules: Rule[] = [];
  for (const file of yamlFiles(join(root, 'data', 'rules'))) {
    const doc = readYaml<{ rules?: Rule[] } | Rule[]>(file);
    const list = Array.isArray(doc) ? doc : (doc?.rules ?? []);
    rules.push(...list);
  }
  const order = new Map(CATEGORIES.map((c, i) => [c, i]));
  return rules.sort((a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99) || a.id.localeCompare(b.id));
}

export function loadHolidays(root: string = process.cwd()): HolidayList[] {
  const lists: HolidayList[] = [];
  for (const file of yamlFiles(join(root, 'data', 'holidays'))) {
    const doc = readYaml<{ lists?: HolidayList[] } | HolidayList>(file);
    if (doc && 'lists' in doc && Array.isArray(doc.lists)) lists.push(...doc.lists);
    else if (doc) lists.push(doc as HolidayList);
  }
  return lists.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
}

export function loadEvents(root: string = process.cwd()): EventType[] {
  const file = join(root, 'data', 'events.yaml');
  if (!existsSync(file)) return [];
  return readYaml<{ events: EventType[] }>(file).events ?? [];
}

export function loadUpdates(root: string = process.cwd()): Update[] {
  const file = join(root, 'data', 'updates.json');
  if (!existsSync(file)) return [];
  const doc = JSON.parse(readFileSync(file, 'utf8')) as { items?: Update[] };
  return doc.items ?? [];
}

export interface UpdatesFile {
  fetched: string | null;
  sources: { id: string; name: string; ok: boolean; count: number; error?: string }[];
  items: Update[];
}

export function loadUpdatesFile(root: string = process.cwd()): UpdatesFile {
  const file = join(root, 'data', 'updates.json');
  if (!existsSync(file)) return { fetched: null, sources: [], items: [] };
  return JSON.parse(readFileSync(file, 'utf8')) as UpdatesFile;
}

export function loadYamlFile<T>(root: string, ...path: string[]): T | null {
  const file = join(root, ...path);
  return existsSync(file) ? readYaml<T>(file) : null;
}

interface MetaFile {
  confirmedThrough: string;
  version: string;
}

export function loadBundle(root: string = process.cwd(), site = ''): Bundle {
  const rules = loadRules(root);
  const meta = loadYamlFile<MetaFile>(root, 'data', 'meta.yaml') ?? { confirmedThrough: '2027-06-30', version: '0' };
  const categories: Record<string, number> = {};
  for (const r of rules) categories[r.category] = (categories[r.category] ?? 0) + 1;
  const fullMeta: Meta = {
    generated: new Date().toISOString(),
    confirmedThrough: meta.confirmedThrough,
    version: meta.version,
    site,
    counts: { rules: rules.length, categories },
  };
  return { meta: fullMeta, rules, holidays: loadHolidays(root), events: loadEvents(root) };
}
