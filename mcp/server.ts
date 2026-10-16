#!/usr/bin/env node
// India Compliance Calendar MCP server.
// Zero dependencies: newline-delimited JSON-RPC 2.0 over stdio, per the Model
// Context Protocol. Runs on Node 22.18+ (native TypeScript type stripping) and
// reuses the site's own engine, so answers match the website exactly.

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { addDays, addMonths, diffDays, formatDate, isISODate, todayIST, weekday, WEEKDAYS_SHORT } from '../src/lib/dates.ts';
import { exposure30, exposureLine } from '../src/lib/exposure.ts';
import { HORIZON_PRESETS, horizonRange, MAX_CUSTOM_MONTHS, type HorizonPreset } from '../src/lib/horizon.ts';
import { appliesTo, DEFAULT_PROFILE, ENTITY_TYPES, type Profile } from '../src/lib/profile.ts';
import { describeSchedule, expandRule, expandRules } from '../src/lib/schedule.ts';
import { AUDIENCES, CATEGORIES, type Bundle, type Occurrence, type Rule, type Update } from '../src/lib/types.ts';
import { isFyStart } from '../src/lib/fiscal.ts';
import { chainNote, eventOccurrences, expandOptions, rulesById } from '../src/lib/view.ts';

const VERSION = '0.1.0';
const SUPPORTED = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_DATA = 'https://dgomesbr.github.io/india-compliance-calendar/api/v1/bundle.json';
const DATA_URL = process.env.ICC_DATA_URL ?? DEFAULT_DATA;
const CACHE_MS = 6 * 3600_000;

let cache: { at: number; bundle: Bundle; updates: Update[] } | null = null;

async function read(location: string): Promise<string> {
  if (/^https?:\/\//.test(location)) {
    const r = await fetch(location, { headers: { 'User-Agent': `india-compliance-calendar-mcp/${VERSION}` } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${location}`);
    return r.text();
  }
  return readFileSync(location, 'utf8');
}

async function data(): Promise<{ bundle: Bundle; updates: Update[] }> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const bundle = JSON.parse(await read(DATA_URL)) as Bundle;
  let updates: Update[] = [];
  try {
    const u = JSON.parse(await read(DATA_URL.replace(/bundle\.json$/, 'updates.json'))) as { items?: Update[] };
    updates = u.items ?? [];
  } catch {
    updates = [];
  }
  cache = { at: Date.now(), bundle, updates };
  return cache;
}

function siteOf(bundle: Bundle): string {
  return bundle.meta.site || DATA_URL.replace(/api\/v1\/bundle\.json$/, '');
}

function occView(o: Occurrence, r: Rule, today: string, site: string, rules?: ReadonlyMap<string, Rule>) {
  const after = o.chain && rules ? chainNote(o, rules) : undefined;
  return {
    due: o.due,
    weekday: WEEKDAYS_SHORT[weekday(o.due)],
    daysLeft: diffDays(today, o.due),
    code: r.code,
    title: r.title,
    period: o.periodLabel,
    category: r.category,
    authority: r.authority,
    exposure30: exposure30(r),
    exposure: exposureLine(r),
    ...(o.extended ? { extendedFrom: o.originalDue, extensionReason: o.extended.reason } : {}),
    ...(o.chain ? { follows: { ruleId: o.chain.ruleId, date: o.chain.date, from: o.chain.from, ...(after ? { note: after } : {}) } } : {}),
    projected: o.projected,
    ruleId: r.id,
    url: `${site}o/${r.id}/`,
    source: r.sources[0]?.url,
  };
}

const str = { type: 'string' } as const;
const dateStr = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'YYYY-MM-DD' } as const;
const fiscalYearStart = {
  type: 'integer',
  minimum: 1,
  maximum: 12,
  description:
    'First month of the entity financial year (1-12, default 4 for April). Company-law, LLP and SEBI dates follow it; income tax and GST stay April-March.',
} as const;

const TOOLS = [
  {
    name: 'upcoming_obligations',
    title: 'Upcoming obligations',
    description:
      'Indian statutory obligations falling due in a horizon (next week up to 24 months), optionally filtered by law, audience, state and entity profile, ordered by due date or penalty exposure. Dates are IST.',
    inputSchema: {
      type: 'object',
      properties: {
        horizon: { type: 'string', enum: [...HORIZON_PRESETS], description: '1w, 2w, 1m, 1q, ye (to 31 Dec), fy (to the end of the financial year) or custom', default: '1m' },
        months: { type: 'integer', minimum: 1, maximum: MAX_CUSTOM_MONTHS, description: 'For horizon=custom: months ahead (max 24)' },
        from: { ...dateStr, description: 'Start date, default today (IST)' },
        to: { ...dateStr, description: 'End date; overrides horizon (capped at 24 months from start)' },
        categories: { type: 'array', items: { type: 'string', enum: [...CATEGORIES] } },
        audience: { type: 'array', items: { type: 'string', enum: [...AUDIENCES] }, description: 'Keep rules for any of these audiences' },
        states: { type: 'array', items: str, description: 'State codes such as MH, KA, DL for state levies' },
        entity: { type: 'string', enum: [...ENTITY_TYPES], description: 'Entity type for applicability' },
        gst: { type: 'string', enum: ['any', 'monthly', 'qrmp', 'composition', 'none'] },
        sort: { type: 'string', enum: ['due', 'exposure', 'law'], default: 'due' },
        limit: { type: 'integer', minimum: 1, maximum: 500, default: 50 },
        fiscalYearStart,
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_obligation',
    title: 'Get obligation',
    description: 'One obligation by rule id or form code: schedule, applicability, law, penalty exposure, sources and the next due dates.',
    inputSchema: {
      type: 'object',
      properties: { id: { ...str, description: 'Rule id, e.g. gst-gstr3b-monthly' }, code: { ...str, description: 'Form code, e.g. GSTR-3B' }, fiscalYearStart },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'search_obligations',
    title: 'Search obligations',
    description: 'Find obligations by form, law, section, authority or keyword.',
    inputSchema: {
      type: 'object',
      properties: { query: str, limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'event_deadlines',
    title: 'Deadlines after an event',
    description:
      'Every filing that runs from an event on a date, such as an AGM, share allotment, director change, charge creation or foreign investment. Call without arguments to list event ids.',
    inputSchema: {
      type: 'object',
      properties: { event: { ...str, description: 'Event id from the list' }, date: dateStr },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'check_date',
    title: 'Check a date',
    description: 'Weekday, holidays in the published lists and every obligation due on a date.',
    inputSchema: { type: 'object', properties: { date: dateStr, fiscalYearStart }, required: ['date'], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'list_holidays',
    title: 'List holidays',
    description: 'Holidays between two dates from the published lists: India (central gazetted and restricted, state bank, exchange), and Canada federal, Ontario public and bank, and US federal and Federal Reserve holidays.',
    inputSchema: {
      type: 'object',
      properties: {
        from: dateStr,
        to: dateStr,
        kind: { type: 'string', enum: ['gazetted', 'restricted', 'bank', 'exchange-trading', 'exchange-settlement', 'statutory'] },
        scope: { ...str, description: 'IN, an Indian state code, NSE or BSE; or CA, CA-ON or US for the calendars abroad' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'regulatory_updates',
    title: 'Regulatory updates',
    description: 'Latest circulars, notifications and press releases collected from Indian regulators by the daily build.',
    inputSchema: {
      type: 'object',
      properties: { source: { ...str, description: 'Source id, e.g. sebi or rbi' }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
];

type Args = Record<string, unknown>;

function profileFrom(a: Args): Profile {
  const p: Profile = { ...DEFAULT_PROFILE };
  if (typeof a.entity === 'string') p.entity = a.entity as Profile['entity'];
  if (typeof a.gst === 'string') p.gst = a.gst as Profile['gst'];
  if (Array.isArray(a.states)) p.states = a.states.map(String).map((s) => s.toUpperCase());
  if (Array.isArray(a.categories)) p.categories = a.categories as Profile['categories'];
  return p;
}

async function call(name: string, a: Args): Promise<unknown> {
  const { bundle, updates } = await data();
  const site = siteOf(bundle);
  const today = todayIST();
  // Company-law and SEBI dates follow the entity's financial year when one is given.
  const opts = expandOptions(bundle, { fyStart: isFyStart(a.fiscalYearStart) ? a.fiscalYearStart : undefined });
  const byId = rulesById(bundle);

  switch (name) {
    case 'upcoming_obligations': {
      const from = typeof a.from === 'string' && isISODate(a.from) ? a.from : today;
      const months = typeof a.months === 'number' ? Math.min(MAX_CUSTOM_MONTHS, Math.max(1, Math.round(a.months))) : undefined;
      const asked = typeof a.horizon === 'string' && (HORIZON_PRESETS as readonly string[]).includes(a.horizon) ? (a.horizon as HorizonPreset) : null;
      const preset: HorizonPreset = asked ?? (months ? 'custom' : '1m');
      let to = horizonRange(preset, from, months ? addMonths(from, months) : undefined, { fyStart: opts.fyStart }).to;
      if (typeof a.to === 'string' && isISODate(a.to)) to = a.to < addMonths(from, MAX_CUSTOM_MONTHS) ? a.to : addMonths(from, MAX_CUSTOM_MONTHS);
      const profile = profileFrom(a);
      let rules = bundle.rules.filter((r) => appliesTo(r, profile));
      if (Array.isArray(a.audience) && a.audience.length) {
        const want = new Set(a.audience.map(String));
        rules = rules.filter((r) => r.audience.some((x) => want.has(x)));
      }
      let items = expandRules(rules, from, to, opts).map((o) => occView(o, byId.get(o.ruleId)!, today, site, byId));
      if (a.sort === 'exposure') items.sort((x, y) => y.exposure30 - x.exposure30 || (x.due < y.due ? -1 : 1));
      else if (a.sort === 'law') items.sort((x, y) => CATEGORIES.indexOf(x.category) - CATEGORIES.indexOf(y.category) || (x.due < y.due ? -1 : 1));
      const total = items.length;
      items = items.slice(0, typeof a.limit === 'number' ? a.limit : 50);
      return { today, from, to, total, returned: items.length, items, note: 'Information only, not legal advice. Confirm on the official portal.' };
    }
    case 'get_obligation': {
      const id = typeof a.id === 'string' ? a.id : '';
      const code = typeof a.code === 'string' ? a.code.toLowerCase() : '';
      const matches = bundle.rules.filter((r) => r.id === id || (code && (r.code.toLowerCase() === code || r.form?.toLowerCase() === code)));
      if (!matches.length) throw new UserError(`No obligation with ${id ? `id "${id}"` : `code "${a.code}"`}. Try search_obligations.`);
      return matches.map((r) => ({
        ...r,
        when: describeSchedule(r, byId),
        exposureAt30Days: exposureLine(r),
        url: `${site}o/${r.id}/`,
        next: r.schedule ? expandRule(r, today, addMonths(today, 24), opts).slice(0, 6).map((o) => occView(o, r, today, site, byId)) : [],
      }));
    }
    case 'search_obligations': {
      const q = String(a.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      if (!q.length) throw new UserError('query is required');
      const hits = bundle.rules
        .map((r) => {
          const hay = `${r.code} ${r.form ?? ''} ${r.title} ${r.summary} ${r.law} ${r.authority} ${r.category}`.toLowerCase();
          const score = q.reduce((s, w) => s + (hay.includes(w) ? 1 : 0) + (r.code.toLowerCase().includes(w) ? 2 : 0), 0);
          return { r, score, all: q.every((w) => hay.includes(w)) };
        })
        .filter((x) => x.all)
        .sort((x, y) => y.score - x.score)
        .slice(0, typeof a.limit === 'number' ? a.limit : 20)
        .map(({ r }) => ({ id: r.id, code: r.code, title: r.title, category: r.category, frequency: r.frequency, when: describeSchedule(r, byId) }));
      return { query: a.query, count: hits.length, results: hits };
    }
    case 'event_deadlines': {
      const list = bundle.events.map((e) => ({ id: e.id, title: e.title, steps: e.steps.length }));
      if (!a.event) return { events: list };
      const ev = bundle.events.find((e) => e.id === a.event);
      if (!ev) throw new UserError(`Unknown event "${a.event}". Known events: ${list.map((e) => e.id).join(', ')}`);
      const date = typeof a.date === 'string' && isISODate(a.date) ? a.date : today;
      return {
        event: ev.title,
        date,
        deadlines: eventOccurrences(ev, date, null).map((o, i) => ({
          due: o.due,
          daysLeft: diffDays(today, o.due),
          code: ev.steps[i].code,
          title: ev.steps[i].title,
          within: ev.steps[i].within,
          law: ev.steps[i].law,
          note: ev.steps[i].note,
          ruleId: ev.steps[i].ruleId,
        })),
      };
    }
    case 'check_date': {
      const date = String(a.date ?? '');
      if (!isISODate(date)) throw new UserError('date must be YYYY-MM-DD');
      const hols = bundle.holidays.flatMap((l) => l.holidays.filter((h) => h.date === date).map((h) => ({ name: h.name, list: l.title, kind: l.kind, scope: l.scope })));
      const due = expandRules(bundle.rules, date, date, opts).map((o) => occView(o, byId.get(o.ruleId)!, today, site, byId));
      return { date, weekday: WEEKDAYS_SHORT[weekday(date)], formatted: formatDate(date), holidays: hols, obligationsDue: due };
    }
    case 'list_holidays': {
      const from = typeof a.from === 'string' && isISODate(a.from) ? a.from : today;
      const to = typeof a.to === 'string' && isISODate(a.to) ? a.to : addDays(from, 365);
      const out = bundle.holidays
        .filter((l) => (!a.kind || l.kind === a.kind) && (!a.scope || l.scope === String(a.scope).toUpperCase()))
        .flatMap((l) => l.holidays.filter((h) => h.date >= from && h.date <= to).map((h) => ({ ...h, list: l.title, kind: l.kind, scope: l.scope, source: l.source.url })))
        .sort((x, y) => (x.date < y.date ? -1 : 1));
      return { from, to, count: out.length, holidays: out };
    }
    case 'regulatory_updates': {
      const items = updates.filter((u) => !a.source || u.source === a.source).slice(0, typeof a.limit === 'number' ? a.limit : 20);
      return { count: items.length, items };
    }
  }
  throw new UserError(`Unknown tool "${name}"`);
}

class UserError extends Error {}

// ---------- JSON-RPC over stdio ----------

interface Message {
  jsonrpc: '2.0';
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function send(msg: unknown): void {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function reply(id: Message['id'], result: unknown): void {
  send({ jsonrpc: '2.0', id, result });
}

function fail(id: Message['id'], code: number, message: string): void {
  send({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

async function handle(msg: Message): Promise<void> {
  const { id, method, params = {} } = msg;
  const isRequest = id !== undefined && id !== null;
  switch (method) {
    case 'initialize': {
      const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : SUPPORTED[0];
      return reply(id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'india-compliance-calendar', title: 'India Compliance Calendar', version: VERSION },
        instructions:
          'Indian statutory due dates with sources and penalty exposure. Start with upcoming_obligations (horizon 1w to 24 months). Dates are IST; the financial year runs April to March. Projected dates are computed from the standing rule. Information only, not legal advice.',
      });
    }
    case 'ping':
      return reply(id, {});
    case 'tools/list':
      return reply(id, { tools: TOOLS });
    case 'tools/call': {
      const name = String(params.name ?? '');
      const args = (params.arguments ?? {}) as Args;
      try {
        const result = await call(name, args);
        return reply(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 1) }],
          structuredContent: Array.isArray(result) ? { results: result } : result,
          isError: false,
        });
      } catch (e) {
        const text = e instanceof UserError ? e.message : `Could not load calendar data from ${DATA_URL}: ${e instanceof Error ? e.message : String(e)}`;
        return reply(id, { content: [{ type: 'text', text }], isError: true });
      }
    }
    default:
      if (method?.startsWith('notifications/')) return;
      if (isRequest) return fail(id, -32601, `Method not found: ${method}`);
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg: Message;
  try {
    msg = JSON.parse(line) as Message;
  } catch {
    fail(null, -32700, 'Parse error');
    return;
  }
  handle(msg).catch((e) => fail(msg.id, -32603, e instanceof Error ? e.message : String(e)));
});

process.stderr.write(`india-compliance-calendar MCP ${VERSION}: data from ${DATA_URL}\n`);
