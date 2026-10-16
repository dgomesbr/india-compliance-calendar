// Browser data access and shared hooks for the islands.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { todayIST } from './dates.ts';
import { DEFAULT_CURRENCY, moneyFormat, type MoneyFormat } from './money.ts';
import { loadState, saveState, type TeamState } from './store.ts';
import type { Bundle, Update } from './types.ts';

export function baseUrl(): string {
  if (typeof document === 'undefined') return '/';
  const meta = document.querySelector('meta[name="icc-base"]');
  return meta?.getAttribute('content') ?? '/';
}

let bundlePromise: Promise<Bundle> | null = null;

export function fetchBundle(): Promise<Bundle> {
  bundlePromise ??= fetch(`${baseUrl()}api/v1/bundle.json`).then((r) => {
    if (!r.ok) throw new Error(`Could not load the calendar data (HTTP ${r.status}).`);
    return r.json() as Promise<Bundle>;
  });
  return bundlePromise;
}

export async function fetchUpdates(): Promise<Update[]> {
  const r = await fetch(`${baseUrl()}api/v1/updates.json`);
  if (!r.ok) return [];
  const doc = (await r.json()) as { items?: Update[] };
  return doc.items ?? [];
}

export type Loadable<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string };

export function useBundle(): Loadable<Bundle> {
  const [s, set] = useState<Loadable<Bundle>>({ status: 'loading' });
  useEffect(() => {
    fetchBundle()
      .then((data) => set({ status: 'ready', data }))
      .catch((e: unknown) => set({ status: 'error', message: e instanceof Error ? e.message : String(e) }));
  }, []);
  return s;
}

/** Team state from localStorage, kept in sync across islands and tabs. */
export function useTeamState(): [TeamState | null, (next: TeamState) => void] {
  const [state, setState] = useState<TeamState | null>(null);
  useEffect(() => {
    setState(loadState());
    const onLocal = (e: Event) => setState((e as CustomEvent<TeamState>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'icc.state.v1') setState(loadState());
    };
    window.addEventListener('icc:state', onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('icc:state', onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return [state, (next) => saveState(next)];
}

/** Amount formatting for the team's reference currency and the bundle's rates. */
export function useMoney(bundle: Bundle | null, team: TeamState | null): MoneyFormat {
  const cur = team?.prefs.currency ?? DEFAULT_CURRENCY;
  const fx = bundle?.fx ?? null;
  return useMemo(() => moneyFormat(fx, cur), [fx, cur]);
}

/** Today in IST, refreshed when the tab regains focus after midnight. */
export function useToday(): string {
  const [today, setToday] = useState(todayIST());
  useEffect(() => {
    const check = () => setToday(todayIST());
    window.addEventListener('focus', check);
    const t = window.setInterval(check, 60_000);
    return () => {
      window.removeEventListener('focus', check);
      window.clearInterval(t);
    };
  }, []);
  return today;
}

export function downloadFile(name: string, mime: string, body: string): void {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
