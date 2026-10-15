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

// ISO 3166-2:IN as revised on 23 Nov 2023 (TG->TS, OR->OD, CT->CG, UT->UK).
const STATE_FIX: Record<string, string> = { TG: 'TS', OR: 'OD', CT: 'CG', UT: 'UK', DN: 'DH', DD: 'DH' };

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
  // GST and trade
  'gst-cmp02-opt-in': 'CMP-02',
  'gst-cmp08-composition': 'CMP-08',
  'gst-first-appeal': 'APL-01',
  'gst-gstat-appeal': 'APL-05',
  'gst-gstat-backlog-deadline': 'APL-05',
  'gst-gstr1-quarterly-qrmp': 'GSTR-1 Q',
  'gst-gstr3b-qrmp-22': 'GSTR-3B Q',
  'gst-gstr3b-qrmp-24': 'GSTR-3B Q',
  'gst-itc04-annual': 'ITC-04',
  'gst-itc04-halfyearly': 'ITC-04',
  'gst-lut-rfd11': 'LUT RFD-11',
  'gst-pmt06-qrmp': 'PMT-06',
  'gst-refund-time-limit': 'RFD-01',
  'gst-three-year-filing-bar': '3-YEAR BAR',
  'gst-itc-credit-note-cutoff': 'ITC CUTOFF',
  'gst-gta-forward-charge-option': 'GTA ANNEX V',
  'gst-specified-premises-declaration': 'ANNEX VII',
  'gst-qrmp-option-window': 'QRMP OPTION',
  'trade-iec-annual-update': 'IEC UPDATE',
  'trade-rodtep-annual-return': 'RODTEP ARR',
  'trade-customs-warehouse-monthly-return': 'MOOWR',
  // income tax
  'income-tax-advance-tax': 'ADVANCE TAX',
  'income-tax-advance-tax-presumptive': 'ADV TAX 44AD',
  'income-tax-belated-return': 'ITR BELATED',
  'income-tax-revised-return': 'ITR REVISED',
  'income-tax-updated-return': 'ITR-U',
  'income-tax-itr-audit': 'ITR AUDIT',
  'income-tax-itr-business-non-audit': 'ITR BUSINESS',
  'income-tax-itr-non-audit': 'ITR',
  'income-tax-itr-transfer-pricing': 'ITR TP',
  'income-tax-cbcr-1961-act': '3CEAD',
  'income-tax-cbcr-form-59': 'FORM 59',
  'income-tax-challan-statement-1961-act': '26QB-26QE',
  'income-tax-form-141-challan-statement': 'FORM 141',
  'income-tax-donation-statement-1961-act': '10BD',
  'income-tax-donation-statement-form-113': 'FORM 113',
  'income-tax-15g-15h-statement-1961-act': '15G/15H',
  'income-tax-form-121-declarations': 'FORM 121',
  'income-tax-form-16-1961-act': 'FORM 16',
  'income-tax-form-130-salary-certificate': 'FORM 130',
  'income-tax-form-16a-1961-act': 'FORM 16A',
  'income-tax-form-27d-1961-act': 'FORM 27D',
  'income-tax-form-131-133-certificates': 'FORM 131',
  'income-tax-form-132-certificate': 'FORM 132',
  'income-tax-form-24g-1961-act': 'FORM 24G',
  'income-tax-form-137-book-adjustment': 'FORM 137',
  'income-tax-form-15cc-1961-act': 'FORM 15CC',
  'income-tax-form-147-remittance-statement': 'FORM 147',
  'income-tax-form-61-1961-act': 'FORM 61',
  'income-tax-form-98-declarations': 'FORM 98',
  'income-tax-ftc-form-67-1961-act': 'FORM 67',
  'income-tax-ftc-form-44': 'FORM 44',
  'income-tax-lo-statement-1961-act': 'FORM 49C',
  'income-tax-lo-statement-form-162': 'FORM 162',
  'income-tax-master-file-1961-act': '3CEAA',
  'income-tax-master-file-form-56': 'FORM 56',
  'income-tax-new-regime-opt-out': '10-IEA',
  'income-tax-npo-audit-form-112': 'FORM 112',
  'income-tax-trust-audit-1961-act': '10B/10BB',
  'income-tax-reportable-account-1961-act': 'FORM 61B',
  'income-tax-reportable-account-form-166': 'FORM 166',
  'income-tax-sft-1961-act': 'FORM 61A',
  'income-tax-sft-form-165': 'FORM 165',
  'income-tax-tax-audit-1961-act': '3CA-3CD',
  'income-tax-tax-audit-form-26': 'FORM 26',
  'income-tax-tcs-deposit-1961-act': 'TCS PAY',
  'income-tax-tds-deposit-1961-act': 'TDS PAY',
  'income-tax-tds-tcs-deposit': 'TDS/TCS PAY',
  'income-tax-tcs-statement-1961-act': '27EQ',
  'income-tax-tcs-statement': 'FORM 143',
  'income-tax-tds-statements-1961-act': '24Q/26Q/27Q',
  'income-tax-tds-statements': 'FORM 138-144',
  'income-tax-tp-report-1961-act': '3CEB',
  'income-tax-tp-report-form-48': 'FORM 48',
  // labour
  'labour-bocw-cess-completion-return': 'BOCW CESS',
  'labour-bonus-payment-annual': 'BONUS',
  'labour-career-centre-employment-return': 'FORM XXVI',
  'labour-career-centre-vacancy-notice': 'FORM XXV',
  'labour-codes-contractor-half-yearly-return': 'CONTRACTOR RTN',
  'labour-codes-unified-annual-return': 'UNIFIED RETURN',
  'labour-epf-ecr-monthly': 'PF ECR',
  'labour-epfo-eec-2026-deadline': 'EPFO EEC',
  'labour-epfo-vishwas-2026-deadline': 'EPFO VISHWAS',
  'labour-esic-contribution-monthly': 'ESIC',
  'labour-gig-aggregator-final-return': 'GIG FINAL',
  'labour-gig-aggregator-provisional-contribution': 'GIG PROVISIONAL',
  'labour-osh-registration-update': 'OSH REG',
  'labour-wages-monthly-payment': 'WAGES',
  // other regulators
  'other-battery-epr-annual-return': 'EPR BATTERY',
  'other-bmw-annual-report-form-iv': 'BMW FORM IV',
  'other-env-statement-form-v': 'ENV STATEMENT',
  'other-epr-plastic-annual-return': 'EPR PLASTIC',
  'other-ewaste-annual-return': 'EPR E-WASTE',
  'other-ewaste-quarterly-return': 'EPR E-WASTE Q',
  'other-fssai-annual-return-d1': 'FSSAI D-1',
  'other-hazardous-waste-annual-return': 'HW FORM 4',
  'other-posh-ic-annual-report': 'POSH',
  'other-rera-annual-audit-form5': 'RERA FORM 5',
  'other-rera-quarterly-update': 'RERA QPR',
  'other-swm-bulk-waste-generator-annual-return': 'SWM BULK',
};

/** State levies: "PT MH", "PT EC KA", "LWF DL" and so on. */
function stateCode(id: string, states: string[] | undefined): string | null {
  const st = (states?.[0] ?? '').toUpperCase();
  if (!st) return null;
  if (id.startsWith('state-lwf-')) return `LWF ${st}`;
  if (!id.startsWith('state-pt-')) return null;
  if (id.endsWith('-ptec')) return `PTEC ${st}`;
  if (id.includes('-ptrc-')) return `PTRC ${st}`;
  if (id.endsWith('-enrolment')) return `PT EC ${st}`;
  if (id.includes('-entity-')) return `PT ${st} SELF`;
  if (id.includes('quarterly')) return `PT ${st} QTR`;
  if (id.includes('annual-return')) return `PT ${st} ANNUAL`;
  return `PT ${st}`;
}

/** Applicability refinements the entity profile understands (see src/lib/profile.ts). */
const TAGS: Record<string, string[]> = {
  'mca-agm-annual': ['not-opc'],
  'gst-gstr1-monthly': ['gst-monthly'],
  'gst-gstr3b-monthly': ['gst-monthly'],
  'gst-gstr1-quarterly-qrmp': ['gst-qrmp'],
  'gst-gstr3b-qrmp-22': ['gst-qrmp'],
  'gst-gstr3b-qrmp-24': ['gst-qrmp'],
  'gst-iff-qrmp': ['gst-qrmp'],
  'gst-pmt06-qrmp': ['gst-qrmp'],
  'gst-cmp08-composition': ['gst-composition'],
  'gst-gstr4-annual': ['gst-composition'],
  'gst-gstr9-annual': ['gst-regular'],
  'gst-gstr9c-reconciliation': ['gst-regular'],
  'gst-itc04-annual': ['gst-regular'],
  'gst-itc04-halfyearly': ['gst-regular'],
  'gst-lut-rfd11': ['gst-regular'],
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
  out.code =
    CODES[id] ??
    stateCode(id, r.states as string[] | undefined) ??
    (typeof r.code === 'string' && r.code ? r.code : codeFor(r as Partial<Rule>));
  // Overrides apply to everyone; a state-scoped extension is kept as a note instead.
  if (Array.isArray(out.overrides)) {
    const scoped = (out.overrides as { states?: string[]; period: string; due: string; reason: string }[]).filter((o) => o.states?.length);
    if (scoped.length) {
      out.overrides = (out.overrides as { states?: string[] }[]).filter((o) => !o.states?.length);
      const text = scoped.map((o) => `State-specific extension (${o.states!.join(', ')}): ${o.period} moved to ${o.due}. ${o.reason}`).join(' ');
      out.notes = out.notes ? `${out.notes} ${text}` : text;
      if (!(out.overrides as unknown[]).length) delete out.overrides;
    }
  }
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
  const h = deep(JSON.parse(readFileSync(R('holidays.json'), 'utf8'))) as { lists: { id: string; year: number; scope: string }[] };
  for (const l of h.lists) l.scope = STATE_FIX[l.scope] ?? l.scope;
  const years = [...new Set(h.lists.map((l) => l.year))].sort();
  for (const y of years) {
    const lists = h.lists.filter((l) => l.year === y);
    writeFileSync(join(ROOT, 'data', 'holidays', `${y}.yaml`), `# Official holiday lists for ${y}.\n` + YAML.stringify({ lists }, { lineWidth: 0 }));
    console.log(`data/holidays/${y}.yaml: ${lists.length} lists`);
  }
}

/** Sources the calendar uses today, and how. */
const USED: Record<string, string> = {
  'sebi-rss': 'Collected daily into the regulator feed.',
  'rbi-notifications-rss': 'Collected daily into the regulator feed.',
  'rbi-press-releases-rss': 'Collected daily into the regulator feed.',
  'it-efiling-rss': 'Collected daily into the regulator feed.',
  'gst-portal-news': 'Collected daily into the regulator feed.',
  'bse-rss-feeds': 'Collected daily, filtered to listing-compliance notices.',
  'nse-rss-feeds': 'Collected daily, filtered to listing-compliance circulars.',
  'dopt-holiday-om': 'Source of the central gazetted and restricted holiday lists.',
  'indiagov-central-holidays-api': 'Cross-check of the central holiday lists.',
  'rbi-holiday-matrix': 'Source of the bank holiday lists by state.',
  'nse-holiday-api': 'Source of the exchange trading and settlement holidays.',
  'bse-holidays-page': 'Source of the BSE trading holidays.',
  'it-efiling-tax-calendar-api': 'Cross-check of every income-tax occurrence against the official tax calendar.',
  'cbic-taxinfo-api': 'Source register of CGST notifications behind the GST rules and extensions.',
};

if (existsSync(R('data-sources.json'))) {
  const s = (deep(JSON.parse(readFileSync(R('data-sources.json'), 'utf8'))) as Record<string, unknown>[]).map((x) =>
    USED[String(x.id)] ? { ...x, used: true, usedFor: USED[String(x.id)] } : x,
  );
  writeFileSync(join(ROOT, 'data', 'sources.yaml'), '# Catalogue of open datasets and official sources surveyed for the calendar.\n' + YAML.stringify({ sources: s }, { lineWidth: 0 }));
  console.log(`data/sources.yaml: ${(s as unknown[]).length}`);
}
