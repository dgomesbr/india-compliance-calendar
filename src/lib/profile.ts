// Entity profile: narrows the calendar to the obligations that apply to us.

import type { Audience, Category, Rule } from './types.ts';

export const ENTITY_TYPES = [
  'any',
  'private-company',
  'public-unlisted',
  'listed-company',
  'small-company',
  'opc',
  'llp',
  'firm',
  'individual',
  'trust',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_LABEL: Record<EntityType, string> = {
  any: 'Show everything',
  'private-company': 'Private limited company',
  'public-unlisted': 'Unlisted public company',
  'listed-company': 'Listed company',
  'small-company': 'Small company',
  opc: 'One person company',
  llp: 'LLP',
  firm: 'Partnership firm',
  individual: 'Individual or HUF',
  trust: 'Trust, society or section 8',
};

export type GstMode = 'any' | 'monthly' | 'qrmp' | 'composition' | 'none';

export const GST_LABEL: Record<GstMode, string> = {
  any: 'Any GST status',
  monthly: 'Monthly returns',
  qrmp: 'Quarterly (QRMP)',
  composition: 'Composition scheme',
  none: 'Not registered',
};

export interface Profile {
  name: string;
  entity: EntityType;
  gst: GstMode;
  tds: boolean;
  employer: boolean;
  foreign: boolean;
  audit: boolean;
  transferPricing: boolean;
  importExport: boolean;
  /** State and UT codes where we operate (PT, LWF, GST state groups). Empty = all. */
  states: string[];
  /** Laws to show. Empty = all. */
  categories: Category[];
  /** Holiday calendars abroad to show beside the Indian ones (CA, CA-ON, US). */
  abroad: string[];
}

export const DEFAULT_PROFILE: Profile = {
  name: 'All obligations',
  entity: 'any',
  gst: 'any',
  tds: true,
  employer: true,
  foreign: true,
  audit: true,
  transferPricing: true,
  importExport: true,
  states: [],
  categories: [],
  abroad: ['CA', 'CA-ON', 'US'],
};

const COMPANY_TYPES: EntityType[] = ['private-company', 'public-unlisted', 'listed-company', 'small-company', 'opc'];

export function isEverything(p: Profile): boolean {
  return p.entity === 'any' && p.gst === 'any' && !p.states.length && !p.categories.length;
}

/** Audience tags this profile covers. */
export function profileAudiences(p: Profile): Set<Audience> {
  const a = new Set<Audience>();
  if (p.entity === 'any') {
    for (const x of ['company', 'listed', 'llp', 'firm', 'individual', 'trust'] as Audience[]) a.add(x);
  } else if (COMPANY_TYPES.includes(p.entity)) {
    a.add('company');
    if (p.entity === 'listed-company') a.add('listed');
  } else if (p.entity === 'llp') a.add('llp');
  else if (p.entity === 'firm') a.add('firm');
  else if (p.entity === 'individual') a.add('individual');
  else if (p.entity === 'trust') a.add('trust');
  if (p.gst !== 'none') a.add('gst');
  if (p.tds) a.add('tds');
  if (p.employer) a.add('employer');
  if (p.foreign) a.add('foreign');
  if (p.audit) a.add('audit');
  if (p.importExport) a.add('importer-exporter');
  return a;
}

/** Applicability refinements carried in rule.tags. */
function tagAllows(tag: string, p: Profile): boolean {
  const e = p.entity;
  switch (tag) {
    case 'gst-monthly':
      return p.gst === 'any' || p.gst === 'monthly';
    case 'gst-qrmp':
      return p.gst === 'any' || p.gst === 'qrmp';
    case 'gst-composition':
      return p.gst === 'any' || p.gst === 'composition';
    case 'gst-regular':
      return p.gst !== 'composition' && p.gst !== 'none';
    case 'opc-small':
      return e === 'any' || e === 'opc' || e === 'small-company';
    case 'not-opc-small':
      return e === 'any' || (COMPANY_TYPES.includes(e) && e !== 'opc' && e !== 'small-company');
    case 'opc':
      return e === 'any' || e === 'opc';
    case 'not-opc':
      return e !== 'opc';
    case 'public-company':
      return e === 'any' || e === 'public-unlisted' || e === 'listed-company';
    case 'unlisted':
      return e !== 'listed-company';
    case 'unlisted-public':
      return e === 'any' || e === 'public-unlisted';
    case 'transfer-pricing':
      return p.transferPricing;
    case 'non-audit':
      return e === 'any' || !COMPANY_TYPES.includes(e);
    default:
      return true;
  }
}

export function appliesTo(rule: Rule, p: Profile): boolean {
  if (p.categories.length && !p.categories.includes(rule.category)) return false;
  if (p.states.length && rule.states?.length && !rule.states.some((s) => p.states.includes(s))) return false;
  if (!(rule.tags ?? []).every((t) => tagAllows(t, p))) return false;
  if (p.entity === 'any' && p.gst === 'any') {
    // "Everything" still honours the activity switches the user turned off.
    const off = new Set<Audience>();
    if (!p.tds) off.add('tds');
    if (!p.employer) off.add('employer');
    if (!p.foreign) off.add('foreign');
    if (!p.importExport) off.add('importer-exporter');
    return !rule.audience.every((a) => off.has(a));
  }
  const covered = profileAudiences(p);
  return rule.audience.some((a) => covered.has(a));
}
