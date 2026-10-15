// One-time import of the research hand-off (research/*.json) into data/.
// Kept for reproducibility; day-to-day edits happen in the YAML directly.
//   node scripts/import-research.ts

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { CATEGORIES, type Rule } from '../src/lib/types.ts';

const ROOT = process.cwd();
const R = (f: string) => join(ROOT, 'research', f);

const ASCII: [RegExp, string][] = [
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[–—−]/g, ' - '],
  [/…/g, '...'],
  [/₹\s?/g, 'Rs '],
  [/ /g, ' '],
  [/≤/g, '<='],
  [/≥/g, '>='],
  [/×/g, 'x'],
  [/→/g, '->'],
  [/°/g, ' deg'],
];

export function ascii(s: string): string {
  let out = s;
  for (const [re, rep] of ASCII) out = out.replace(re, rep);
  return out.normalize('NFKD').replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '').replace(/ {2,}/g, ' ').replace(/ - - /g, ' - ');
}

function deep<T>(v: T): T {
  if (typeof v === 'string') return ascii(v) as T;
  if (Array.isArray(v)) return v.map(deep) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) as T;
  return v;
}

const STATE_FIX: Record<string, string> = { TS: 'TG', OR: 'OD', CT: 'CG', UT: 'UK', DN: 'DH', DD: 'DH' };

function codeFor(r: Partial<Rule> & { form?: string; title?: string; id?: string }): string {
  const form = (r.form ?? '').split(/[;,/(]| and | or /i)[0].trim();
  if (form && form.length <= 16) return form.replace(/^Form\s+/i, '').toUpperCase().replace(/\s+/g, ' ');
  const words = (r.title ?? r.id ?? 'RULE').replace(/\(.*?\)/g, '').split(/\s+/).filter((w) => /^[A-Z0-9-]{2,}$/.test(w));
  if (words.length) return words.slice(0, 2).join(' ');
  return (r.id ?? 'RULE').split('-').slice(1, 3).join('-').toUpperCase();
}

/** Curated catalog codes where the form name alone does not make a good number. */
const CODES: Record<string, string> = {
  'mca-agm-annual': 'AGM',
  'mca-aoc4-opc-annual': 'AOC-4 OPC',
  'mca-dir3-kyc-change-event': 'DIR-3 KYC',
  'mca-dir3-kyc-triennial': 'DIR-3 KYC',
  'mca-dir3-kyc-triennial-new-din': 'DIR-3 KYC',
  'mca-llp-form11-annual': 'LLP-11',
  'mca-llp-form4d-event': 'LLP-4D',
  'mca-llp-form8-annual': 'LLP-8',
  'mca-llp-ben2-event': 'LLP BEN-2',
  'sebi-agm-top100-annual': 'AGM TOP 100',
  'sebi-annual-report-reg34': 'REG 34',
  'sebi-brsr-annual': 'BRSR',
  'sebi-integrated-filing-financial-quarterly': 'IF-FIN',
  'sebi-integrated-filing-governance-quarterly': 'IF-GOV',
  'sebi-reconciliation-share-capital-audit-quarterly': 'REG 76',
  'sebi-reg52-debt-results-quarterly': 'REG 52',
  'sebi-reg74-5-certificate-quarterly': 'REG 74(5)',
  'sebi-sdd-compliance-certificate-annual': 'SDD',
  'sebi-secretarial-compliance-report-annual': 'REG 24A',
  'sebi-shareholding-pattern-quarterly': 'REG 31',
  'rbi-fema-bo-lo-po-aac-annual': 'AAC',
  'rbi-fema-fla-annual': 'FLA',
  'rbi-fema-form-cn-event': 'FORM CN',
  'rbi-fema-form-di-event': 'FORM DI',
  'rbi-fema-form-esop-event': 'FORM ESOP',
  'rbi-fema-form-llp-event': 'FORM LLP',
  'rbi-fema-odi-evidence-event': 'ODI PROOF',
  'rbi-fema-odi-form-fc-event': 'FORM FC',
  'rbi-fema-odi-apr-annual': 'APR',
  'rbi-fema-opi-halfyearly': 'FORM OPI',
  'rbi-fema-grn-quarterly': 'FORM GRN',
  'rbi-fema-ecb1-event': 'ECB 1',
  'rbi-fema-ecb2-monthly': 'ECB 2',
};

/** Applicability refinements the entity profile understands (see src/lib/profile.ts). */
const TAGS: Record<string, string[]> = {
  'mca-agm-annual': ['not-opc'],
  'mca-aoc4-annual': ['not-opc'],
  'mca-aoc4-opc-annual': ['opc'],
  'mca-mgt7-annual': ['not-opc-small'],
  'mca-mgt7a-annual': ['opc-small'],
  'mca-pas6-halfyearly': ['not-opc-small', 'unlisted'],
};

const KEEP = [
  'id', 'code', 'title', 'form', 'category', 'authority', 'summary', 'applicability', 'audience', 'tags', 'frequency',
  'schedule', 'trigger', 'law', 'penalty', 'exposure', 'states', 'effective', 'overrides', 'sources', 'verified',
  'confidence', 'notes',
];

function clean(raw: Record<string, unknown>): Rule {
  const r = deep(raw) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of KEEP) if (r[k] !== undefined && r[k] !== null && !(Array.isArray(r[k]) && !(r[k] as unknown[]).length)) out[k] = r[k];
  const id = String(r.id ?? '');
  out.code = CODES[id] ?? (typeof r.code === 'string' && r.code ? r.code : codeFor(r as Partial<Rule>));
  if (TAGS[id]) out.tags = [...new Set([...((out.tags as string[]) ?? []), ...TAGS[id]])];
  if (Array.isArray(out.states)) out.states = (out.states as string[]).map((s) => STATE_FIX[s.toUpperCase()] ?? s.toUpperCase());
  if (out.exposure && typeof out.exposure === 'object') {
    out.exposure = Object.fromEntries(Object.entries(out.exposure as object).filter(([, v]) => v !== null && !(Array.isArray(v) && !v.length)));
  }
  if (out.effective && typeof out.effective === 'object') {
    const e = out.effective as { from?: string | null; to?: string | null };
    if (!e.from && !e.to) delete out.effective;
  }
  return out as unknown as Rule;
}

const files = ['income-tax.json', 'gst.json', 'corporate.json', 'labour.json'].filter((f) => existsSync(R(f)));
const rules: Rule[] = [];
for (const f of files) {
  const list = JSON.parse(readFileSync(R(f), 'utf8')) as Record<string, unknown>[];
  for (const raw of list) rules.push(clean(raw));
  console.log(`${f}: ${list.length} rules`);
}

const seen = new Set<string>();
for (const r of rules) {
  if (seen.has(r.id)) console.warn(`duplicate id ${r.id}`);
  seen.add(r.id);
}

const doc = new YAML.Document();
for (const c of CATEGORIES) {
  const list = rules.filter((r) => r.category === c).sort((a, b) => a.id.localeCompare(b.id));
  if (!list.length) continue;
  const text = YAML.stringify({ rules: list }, { lineWidth: 0, defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN' });
  const header = `# ${c} obligations. See docs/DATA_MODEL.md for the schema.\n# Every rule cites its sources; edit with care and keep prose ASCII.\n`;
  writeFileSync(join(ROOT, 'data', 'rules', `${c}.yaml`), header + text);
  console.log(`data/rules/${c}.yaml: ${list.length}`);
}
void doc;

if (existsSync(R('holidays.json'))) {
  const h = deep(JSON.parse(readFileSync(R('holidays.json'), 'utf8'))) as { lists: { id: string; year: number }[] };
  const years = [...new Set(h.lists.map((l) => l.year))].sort();
  for (const y of years) {
    const lists = h.lists.filter((l) => l.year === y);
    writeFileSync(join(ROOT, 'data', 'holidays', `${y}.yaml`), `# Official holiday lists for ${y}.\n` + YAML.stringify({ lists }, { lineWidth: 0 }));
    console.log(`data/holidays/${y}.yaml: ${lists.length} lists`);
  }
}

if (existsSync(R('data-sources.json'))) {
  const s = deep(JSON.parse(readFileSync(R('data-sources.json'), 'utf8')));
  writeFileSync(join(ROOT, 'data', 'sources.yaml'), '# Catalogue of open datasets and official sources surveyed for the calendar.\n' + YAML.stringify({ sources: s }, { lineWidth: 0 }));
  console.log(`data/sources.yaml: ${(s as unknown[]).length}`);
}
