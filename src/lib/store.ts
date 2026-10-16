// Browser-only team state: profile, filed status, owners, planned events.
// Nothing leaves the browser; teams share it by exporting and importing JSON.

import { todayIST, type ISODate } from './dates.ts';
import type { HorizonPreset } from './horizon.ts';
import { DEFAULT_CURRENCY, isCurrency, type RefCurrency } from './money.ts';
import { DEFAULT_PROFILE, type Profile } from './profile.ts';

export interface FiledRecord {
  filedOn: ISODate;
  ack?: string;
  owner?: string;
  note?: string;
}

export interface PlannedEvent {
  id: string;
  eventId: string;
  date: ISODate;
  label?: string;
  created: ISODate;
}

export interface Prefs {
  horizon: HorizonPreset;
  customEnd?: ISODate;
  sort: 'due' | 'exposure' | 'law';
  /** Reference currency shown beside the rupee amounts. */
  currency: RefCurrency;
}

export interface TeamState {
  version: 1;
  profile: Profile;
  filed: Record<string, FiledRecord>;
  /** Default owner per rule id. */
  owners: Record<string, string>;
  planned: PlannedEvent[];
  /** Overdue counts only from here, so a first visit is not a wall of red. */
  trackingSince: ISODate;
  prefs: Prefs;
}

const KEY = 'icc.state.v1';

export function emptyState(today: ISODate = todayIST()): TeamState {
  return {
    version: 1,
    profile: { ...DEFAULT_PROFILE },
    filed: {},
    owners: {},
    planned: [],
    trackingSince: today,
    prefs: { horizon: '1m', sort: 'due', currency: DEFAULT_CURRENCY },
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Merge unknown input into a valid state, keeping what is well-formed. */
export function normalizeState(raw: unknown, today: ISODate = todayIST()): TeamState {
  const base = emptyState(today);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<TeamState>;
  return {
    version: 1,
    profile: { ...base.profile, ...(r.profile ?? {}) },
    filed: r.filed && typeof r.filed === 'object' ? r.filed : {},
    owners: r.owners && typeof r.owners === 'object' ? r.owners : {},
    planned: Array.isArray(r.planned) ? r.planned : [],
    trackingSince: typeof r.trackingSince === 'string' ? r.trackingSince : base.trackingSince,
    prefs: {
      ...base.prefs,
      ...(r.prefs ?? {}),
      currency: isCurrency(r.prefs?.currency) ? r.prefs.currency : base.prefs.currency,
    },
  };
}

export function loadState(): TeamState {
  const s = storage();
  if (!s) return emptyState();
  try {
    const text = s.getItem(KEY);
    if (!text) {
      const fresh = emptyState();
      s.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    return normalizeState(JSON.parse(text));
  } catch {
    return emptyState();
  }
}

export function saveState(state: TeamState): void {
  storage()?.setItem(KEY, JSON.stringify(state));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('icc:state', { detail: state }));
}

export interface ExportFile extends TeamState {
  exportedAt: string;
  app: 'india-compliance-calendar';
}

export function exportState(state: TeamState): string {
  const file: ExportFile = { ...state, app: 'india-compliance-calendar', exportedAt: new Date().toISOString() };
  return JSON.stringify(file, null, 2);
}

/** Import a teammate's export. Filed records merge; the newer filing date wins. */
export function importState(current: TeamState, text: string): { state: TeamState; filedAdded: number } {
  const incoming = normalizeState(JSON.parse(text));
  const filed = { ...current.filed };
  let filedAdded = 0;
  for (const [key, rec] of Object.entries(incoming.filed)) {
    const mine = filed[key];
    if (!mine || rec.filedOn > mine.filedOn) {
      if (!mine) filedAdded++;
      filed[key] = rec;
    }
  }
  const plannedIds = new Set(current.planned.map((p) => p.id));
  return {
    state: {
      ...current,
      filed,
      owners: { ...incoming.owners, ...current.owners },
      planned: [...current.planned, ...incoming.planned.filter((p) => !plannedIds.has(p.id))],
      trackingSince: incoming.trackingSince < current.trackingSince ? incoming.trackingSince : current.trackingSince,
    },
    filedAdded,
  };
}
