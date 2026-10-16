import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { abroadDays, abroadMeaning, COUNTRY_LABEL, type AbroadHoliday } from '../lib/abroad.ts';
import { baseUrl, fetchUpdates, useBundle, useMoney, useTeamState, useToday } from '../lib/client.ts';
import { addMonths, diffDays, formatDate, lastDayOfMonth, parts, relativeDays, shiftMonth, type ISODate } from '../lib/dates.ts';
import { interestNote } from '../lib/exposure.ts';
import {
  describeRange,
  HORIZON_LABEL,
  HORIZON_PRESETS,
  horizonRange,
  MAX_CUSTOM_MONTHS,
  maxHorizonEnd,
  type HorizonPreset,
} from '../lib/horizon.ts';
import { useCountUp, useFlip, useInView, useThumb } from '../lib/motion.ts';
import { isEverything } from '../lib/profile.ts';
import type { TeamState } from '../lib/store.ts';
import { CATEGORIES, CATEGORY_LABEL, type Category, type Update } from '../lib/types.ts';
import {
  buildRows,
  countStates,
  hasOpenExtension,
  matchesQuery,
  matchesState,
  shortAuthority,
  sortRows,
  STATE_LABEL,
  type Row,
  type RowState,
  type SortKey,
} from '../lib/view.ts';
import Detail, { Law } from './Detail.tsx';
import { Icon } from './Icon.tsx';
import { Money, MoneyContext, useMoneyFormat } from './Money.tsx';
import Timeline, { type DateRange } from './Timeline.tsx';

const READOUT: RowState[] = ['overdue', 'soon', 'extended', 'upcoming', 'filed'];
const SORT_LABEL: Record<SortKey, string> = { due: 'Due date', exposure: 'Penalty exposure', law: 'Law' };
const PAGE = 120;
/** Shorter names for the phone cover, where three figures share a 358px row. */
const SHORT_LABEL: Partial<Record<RowState, string>> = { soon: 'Due in 7 days' };

function readUrl(): Partial<{ h: HorizonPreset; end: string; sort: SortKey; law: Category[]; q: string }> {
  if (typeof location === 'undefined') return {};
  const p = new URLSearchParams(location.search);
  const h = p.get('h') as HorizonPreset | null;
  const sort = p.get('sort') as SortKey | null;
  return {
    h: h && (HORIZON_PRESETS as readonly string[]).includes(h) ? h : undefined,
    end: p.get('end') ?? undefined,
    sort: sort && sort in SORT_LABEL ? sort : undefined,
    law: (p.get('law') ?? '').split(',').filter((c): c is Category => (CATEGORIES as readonly string[]).includes(c)),
    q: p.get('q') ?? undefined,
  };
}

function monthsBetween(from: ISODate, to: ISODate): number {
  for (let m = 1; m <= MAX_CUSTOM_MONTHS; m++) if (addMonths(from, m) >= to) return m;
  return MAX_CUSTOM_MONTHS;
}

/** A state count set large in the band; it filters the table like a toggle. */
function Figure({ state, count, on, loading, index, onToggle }: {
  state: RowState;
  count: number;
  on: boolean;
  loading: boolean;
  index: number;
  onToggle: () => void;
}) {
  const shown = Math.round(useCountUp(loading ? 0 : count));
  return (
    <button
      type="button"
      class={`figure${on ? ' is-on' : ''}${!loading && count > 0 ? ' has-items' : ''}`}
      data-state={state}
      aria-pressed={on}
      disabled={loading}
      onClick={onToggle}
      style={{ '--i': index }}
    >
      <span class="figure-n num">{loading ? '-' : shown}</span>
      <span class="figure-label">
        {SHORT_LABEL[state] ? (
          <>
            <span class="label-long">{STATE_LABEL[state]}</span>
            <span class="label-short">{SHORT_LABEL[state]}</span>
          </>
        ) : (
          STATE_LABEL[state]
        )}
      </span>
    </button>
  );
}

function ExposureFigure({ value, loading }: { value: number; loading: boolean }) {
  const money = useMoneyFormat();
  const shown = Math.round(useCountUp(loading ? 0 : value, 700));
  const ref = money.ref(shown, true);
  return (
    <div class="figure figure-total" style={{ '--i': 5 }}>
      <span class="figure-n num">{loading ? '-' : ref ?? money.inr(shown, true)}</span>
      <span class="figure-label">
        {!loading && ref && <span class="figure-inr num">({money.inr(value, true)})</span>}
        <span class="label-long">Fixed cost if every open item runs 30 days late</span>
        <span class="label-short">Cost at 30 days</span>
      </span>
    </div>
  );
}

export default function Overview() {
  const data = useBundle();
  const [team, saveTeam] = useTeamState();
  const today = useToday();
  const url = useMemo(readUrl, []);
  const money = useMoney(data.status === 'ready' ? data.data : null, team);

  const [horizon, setHorizon] = useState<HorizonPreset>(url.h ?? '1m');
  const [customEnd, setCustomEnd] = useState<ISODate | undefined>(url.end);
  const [sort, setSort] = useState<SortKey>(url.sort ?? 'due');
  const [laws, setLaws] = useState<Category[]>(url.law ?? []);
  const [states, setStates] = useState<RowState[]>([]);
  const [query, setQuery] = useState(url.q ?? '');
  const [day, setDay] = useState<DateRange | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [limit, setLimit] = useState(PAGE);
  const [flash, setFlash] = useState<string | null>(null);
  const initialised = useRef(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const segRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLElement>(null);
  const bandLit = useInView(bandRef);

  // Saved preferences apply when the URL does not say otherwise.
  useEffect(() => {
    if (!team || initialised.current) return;
    initialised.current = true;
    if (!url.h) setHorizon(team.prefs.horizon);
    if (!url.end && team.prefs.customEnd) setCustomEnd(team.prefs.customEnd);
    if (!url.sort) setSort(team.prefs.sort);
  }, [team]);

  useEffect(() => {
    fetchUpdates().then((u) => setUpdates(u.slice(0, 6))).catch(() => setUpdates([]));
  }, []);

  useEffect(() => {
    if (!initialised.current) return;
    const p = new URLSearchParams();
    if (horizon !== '1m') p.set('h', horizon);
    if (horizon === 'custom' && customEnd) p.set('end', customEnd);
    if (sort !== 'due') p.set('sort', sort);
    if (laws.length) p.set('law', laws.join(','));
    if (query) p.set('q', query);
    const qs = p.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
    if (team && (team.prefs.horizon !== horizon || team.prefs.sort !== sort || team.prefs.customEnd !== customEnd)) {
      saveTeam({ ...team, prefs: { horizon, sort, customEnd } });
    }
  }, [horizon, customEnd, sort, laws, query]);

  // A new view starts from the top of the list again.
  useEffect(() => setLimit(PAGE), [horizon, customEnd, sort, laws, query, states, day]);

  const range = horizonRange(horizon, today, customEnd);
  // The title animates when the horizon changes, not when the island first replaces the static band.
  const rangeKey = `${range.from}|${range.to}`;
  const firstRange = useRef(rangeKey);

  // The timeline always shows a few months of context past a short horizon.
  const plotTo = useMemo(() => {
    const t = parts(today);
    const e = shiftMonth(t.y, t.m, 4);
    const end = lastDayOfMonth(e.y, e.m);
    return range.to > end ? range.to : end;
  }, [today, range.to]);

  const wideRows = useMemo(() => {
    if (data.status !== 'ready' || !team) return [];
    const profile = { ...team.profile, categories: laws.length ? laws : team.profile.categories };
    return buildRows({
      bundle: data.data,
      profile,
      today,
      to: plotTo,
      filed: team.filed,
      planned: team.planned,
      trackingSince: team.trackingSince,
      includeOverdue: true,
    });
  }, [data, team, today, plotTo, laws]);

  const allRows = useMemo(() => wideRows.filter((r) => r.occ.due <= range.to), [wideRows, range.to]);
  const counts = useMemo(() => {
    const matching = allRows.filter((r) => matchesQuery(r, query));
    // Extended counts every open item with a notified extension, as the pills and the aside do.
    return { ...countStates(matching), extended: matching.filter(hasOpenExtension).length };
  }, [allRows, query]);

  const rows = useMemo(() => {
    let r = allRows.filter((x) => matchesQuery(x, query));
    if (states.length) r = r.filter((x) => states.some((s) => matchesState(x, s)));
    if (day) r = r.filter((x) => x.occ.due >= day.from && x.occ.due <= day.to);
    return sortRows(r, sort);
  }, [allRows, query, states, day, sort]);

  const selectedRow = selected ? allRows.find((r) => r.occ.key === selected) ?? null : null;

  // Banks and offices closed abroad within the horizon, for teams that pay or meet across borders.
  const closedAbroad = useMemo(() => {
    if (data.status !== 'ready' || !team) return [] as { date: ISODate; h: AbroadHoliday }[];
    const days = abroadDays(data.data, team.profile.abroad ?? []);
    return [...days.entries()]
      .filter(([d]) => d >= today && d <= range.to)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .flatMap(([date, hs]) => hs.map((h) => ({ date, h })))
      .slice(0, 6);
  }, [data, team, today, range.to]);
  const thumb = useThumb(segRef, '.seg-btn.is-on', [horizon]);

  useEffect(() => {
    const d = sheet.current;
    if (!d) return;
    const small = window.matchMedia('(max-width: 1099px)').matches;
    if (selectedRow && small && !d.open) d.showModal();
    if (!selectedRow && d.open) d.close();
  }, [selectedRow]);

  if (data.status === 'error') {
    return (
      <div class="page ov-error" role="alert">
        <p class="fig">No data</p>
        <p>{data.message} Check your connection and reload. The same data is also published as JSON and calendar feeds on the Subscribe page.</p>
        <button class="btn" type="button" onClick={() => location.reload()}><span class="btn-label">Reload</span></button>
      </div>
    );
  }

  const loading = data.status === 'loading' || !team;
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const quickFile = (row: Row) => {
    if (!team) return;
    const next: TeamState = { ...team, filed: { ...team.filed, [row.occ.key]: { filedOn: today, owner: team.owners[row.rule.id] } } };
    saveTeam(next);
    setFlash(row.occ.key);
    setTimeout(() => setFlash((k) => (k === row.occ.key ? null : k)), 1200);
  };
  const unfile = (row: Row) => {
    if (!team) return;
    const f = { ...team.filed };
    delete f[row.occ.key];
    saveTeam({ ...team, filed: f });
  };

  const atRisk = allRows.filter((r) => r.state !== 'filed').slice().sort((a, b) => b.exposure - a.exposure).slice(0, 5);
  const moved = allRows.filter((r) => r.occ.extended && r.state !== 'filed').slice(0, 5);
  const closedDays = allRows.filter((r) => r.closed && r.state !== 'filed' && r.daysLeft >= 0).slice(0, 5);
  const profileName = team && !isEverything(team.profile) ? team.profile.name : 'All obligations';
  const horizonExposure = allRows.filter((r) => r.state !== 'filed').reduce((s, r) => s + r.exposure, 0);
  const filtering = Boolean(query || laws.length || states.length || day);

  return (
    <MoneyContext.Provider value={money}>
    <div class="ov">
      <section class="band band-live ov-band" aria-labelledby="ov-title" ref={bandRef} data-lit={bandLit || undefined}>
        <div class="page band-inner">
          <div class="band-head">
            <h1 id="ov-title" class={`band-title display num${rangeKey !== firstRange.current ? ' is-swap' : ''}`} key={rangeKey}>
              {describeRange(range).replace(' - ', '\u00a0- ')}
            </h1>
            <p class="band-sub">
              {profileName}
              {team && team.trackingSince && <> - tracking filings since {formatDate(team.trackingSince, { weekday: false })}</>}
            </p>
          </div>
          <div class="band-figures" role="group" aria-label="Filter by state">
            {READOUT.map((s, i) => (
              <Figure
                state={s}
                count={counts[s]}
                on={states.includes(s)}
                loading={loading}
                index={i}
                onToggle={() => setStates(toggle(states, s))}
              />
            ))}
            <ExposureFigure value={horizonExposure} loading={loading} />
          </div>
        </div>
      </section>

      <section class="page ov-head" aria-label="Horizon, order and filters">
        <div class="ov-controls" role="group" aria-label="Horizon and order">
          <div class="seg" role="group" aria-label="Horizon" ref={segRef}>
            {thumb && (
              <span
                class="seg-thumb"
                aria-hidden="true"
                style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)`, width: `${thumb.w}px`, height: `${thumb.h}px` }}
              />
            )}
            {HORIZON_PRESETS.map((h) => (
              <button
                type="button"
                aria-pressed={horizon === h}
                class={`seg-btn${horizon === h ? ' is-on' : ''}`}
                onClick={() => {
                  setHorizon(h);
                  setDay(null);
                }}
              >
                {HORIZON_LABEL[h]}
              </button>
            ))}
          </div>
          <div class="ov-sort">
            <label class="label" for="ov-sort">Order by</label>
            <span class="ov-sort-field">
              <Icon name="sort" />
              <select id="ov-sort" class="select" value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}>
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                  <option value={k}>{SORT_LABEL[k]}</option>
                ))}
              </select>
            </span>
          </div>
          <div class="ov-search">
            <label class="visually-hidden" for="ov-q">Search obligations</label>
            <Icon name="search" />
            <input
              id="ov-q"
              class="input"
              type="search"
              placeholder="Search form or law"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        {horizon === 'custom' && (
          <div class="ov-custom">
            <label class="label" for="ov-months">Months ahead</label>
            <input
              id="ov-months"
              type="range"
              min={1}
              max={MAX_CUSTOM_MONTHS}
              value={monthsBetween(today, range.to)}
              onInput={(e) => setCustomEnd(addMonths(today, Number((e.target as HTMLInputElement).value)))}
            />
            <output class="num" for="ov-months">{monthsBetween(today, range.to)} months</output>
            <label class="label" for="ov-end">Until</label>
            <input
              id="ov-end"
              class="input num"
              type="date"
              min={today}
              max={maxHorizonEnd(today)}
              value={range.to}
              onChange={(e) => setCustomEnd((e.target as HTMLInputElement).value)}
            />
            <span class="faint">Up to {MAX_CUSTOM_MONTHS} months ahead</span>
          </div>
        )}

        <div class="ov-filters">
          <div class="laws" role="group" aria-label="Laws">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                class={`law-btn${laws.includes(c) ? ' is-on' : ''}`}
                data-law={c}
                aria-pressed={laws.includes(c)}
                onClick={() => setLaws(toggle(laws, c))}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
            {laws.length > 0 && (
              <button type="button" class="law-clear" onClick={() => setLaws([])}>Show all laws</button>
            )}
          </div>
        </div>
      </section>

      <section class="page ov-timeline" aria-labelledby="tl-title">
        <div class="tl-head">
          <h2 id="tl-title" class="tl-title">By law</h2>
          <p class="faint tl-note">Each mark is a due date, sized by the fixed cost of a 30-day delay. Select one to filter the table.</p>
        </div>
        {loading ? (
          <div class="skeleton tl-skeleton" />
        ) : (
          <Timeline rows={wideRows.filter((r) => matchesQuery(r, query))} today={today} to={range.to} selected={day} onPick={setDay} />
        )}
      </section>

      <div class="page ov-main">
        <section class="ov-list" aria-labelledby="ov-list-title">
          <div class="ov-list-head">
            <h2 id="ov-list-title">
              {loading ? 'Loading obligations' : `${rows.length} ${rows.length === 1 ? 'obligation' : 'obligations'}`}
              {day && (day.from === day.to ? <> on {formatDate(day.from)}</> : <> from {formatDate(day.from, { year: false })} to {formatDate(day.to)}</>)}
            </h2>
            {day && (
              <button type="button" class="btn btn-quiet" onClick={() => setDay(null)}>
                <span class="btn-label"><Icon name="x" />Clear date</span>
              </button>
            )}
          </div>
          {loading ? (
            <div class="table-skeleton">{Array.from({ length: 7 }, (_, i) => <div class="skeleton row-skeleton" style={{ '--i': i }} />)}</div>
          ) : rows.length === 0 ? (
            <div class="empty rise">
              <Icon name="calendar" class="icon empty-icon" />
              <p class="empty-title">Nothing due in this view.</p>
              <p class="muted">
                {filtering
                  ? 'Filters are narrowing the list. Clear them or widen the horizon.'
                  : `No obligation in this profile falls due before ${formatDate(range.to)}. Try a longer horizon.`}
              </p>
              <div class="form-actions">
                {filtering && (
                  <button class="btn" type="button" onClick={() => { setQuery(''); setLaws([]); setStates([]); setDay(null); }}>
                    <span class="btn-label">Clear filters</span>
                  </button>
                )}
                <button class="btn" type="button" onClick={() => setHorizon('1q')}><span class="btn-label">Show 1 quarter</span></button>
              </div>
            </div>
          ) : (
            <>
              <Table rows={rows.slice(0, limit)} sort={sort} today={today} selected={selected} flash={flash} onSelect={setSelected} onFile={quickFile} onUnfile={unfile} />
              {rows.length > limit && (
                <div class="more">
                  <span class="faint num">Showing {limit} of {rows.length}</span>
                  <button class="btn" type="button" onClick={() => setLimit(limit + PAGE)}><span class="btn-label">Show {Math.min(PAGE, rows.length - limit)} more</span></button>
                  <button class="btn btn-quiet" type="button" onClick={() => setLimit(rows.length)}><span class="btn-label">Show all</span></button>
                </div>
              )}
            </>
          )}
        </section>

        <aside class="ov-aside" aria-label={selectedRow ? 'Obligation details' : 'At risk'}>
          {selectedRow && team ? (
            <div class="aside-detail" key={selectedRow.occ.key}>
              <Detail row={selectedRow} today={today} state={team} bundle={data.status === 'ready' ? data.data : null} onSave={saveTeam} onClose={() => setSelected(null)} idp="a" />
            </div>
          ) : (
            <div class="aside-lists">
              <AsideList title="Costliest if late" empty="No open items with a fixed penalty in this horizon.">
                {atRisk.filter((r) => r.exposure > 0).map((r, i) => (
                  <li style={{ '--i': i }}>
                    <button type="button" class="aside-item" onClick={() => setSelected(r.occ.key)}>
                      <span class="aside-row">
                        <span class="aside-code fig">{r.rule.code}</span>
                        <span class="aside-amount num"><Money inr={r.exposure} compact /></span>
                      </span>
                      <span class="aside-bar" aria-hidden="true">
                        <span style={{ transform: `scaleX(${atRisk[0]?.exposure ? r.exposure / atRisk[0].exposure : 0})` }} />
                      </span>
                      <span class="aside-meta num"><Law row={r} /> {formatDate(r.occ.due, { year: false })}</span>
                    </button>
                  </li>
                ))}
              </AsideList>
              <AsideList title="Extended or moved" empty="No notified extensions in this horizon.">
                {moved.map((r, i) => (
                  <li style={{ '--i': i }}>
                    <button type="button" class="aside-item" onClick={() => setSelected(r.occ.key)}>
                      <span class="aside-code fig">{r.rule.code}</span>
                      <span class="aside-meta num">
                        {formatDate(r.occ.originalDue ?? r.occ.due, { year: false })} to {formatDate(r.occ.due, { year: false })}
                      </span>
                    </button>
                  </li>
                ))}
              </AsideList>
              <AsideList title="Due on a holiday or weekend" empty="No due date in this horizon falls on a closed day.">
                {closedDays.map((r, i) => (
                  <li style={{ '--i': i }}>
                    <button type="button" class="aside-item" onClick={() => setSelected(r.occ.key)}>
                      <span class="aside-code fig">{r.rule.code}</span>
                      <span class="aside-meta num">{formatDate(r.occ.due, { year: false })} - {r.closed?.join(', ')}</span>
                    </button>
                  </li>
                ))}
              </AsideList>
              {(team?.profile.abroad ?? []).length > 0 && (
                <AsideList title="Closed abroad" empty="No holiday in Canada, Ontario or the US falls in this horizon.">
                  {closedAbroad.map(({ date, h }, i) => (
                    <li style={{ '--i': i }}>
                      <a class="aside-item" href={`${baseUrl()}calendar/?d=${date}`}>
                        <span class="aside-row">
                          <span class="aside-code fig num">{formatDate(date, { year: false })}</span>
                          <span class="aside-country">{COUNTRY_LABEL[h.country]}</span>
                        </span>
                        <span class="aside-title">{h.name}</span>
                        <span class="aside-meta">{abroadMeaning(h)}</span>
                      </a>
                    </li>
                  ))}
                </AsideList>
              )}
              <AsideList title="From the regulators" empty="The regulator feed has not been collected yet.">
                {updates.map((u, i) => (
                  <li style={{ '--i': i }}>
                    <a class="aside-item" href={u.url} rel="noopener" target="_blank">
                      <span class="aside-title">{u.title}</span>
                      <span class="aside-meta">{u.sourceName} - {formatDate(u.date, { weekday: false })}</span>
                    </a>
                  </li>
                ))}
              </AsideList>
            </div>
          )}
        </aside>
      </div>

      <dialog class="sheet" ref={sheet} onClose={() => setSelected(null)} aria-label="Obligation details">
        {selectedRow && team && (
          <Detail row={selectedRow} today={today} state={team} bundle={data.status === 'ready' ? data.data : null} onSave={saveTeam} onClose={() => sheet.current?.close()} idp="s" />
        )}
      </dialog>
    </div>
    </MoneyContext.Provider>
  );
}

function AsideList({ title, empty, children }: { title: string; empty: string; children: ComponentChildren }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section class="aside-list">
      <h2>{title}</h2>
      {items.length ? <ul>{items}</ul> : <p class="aside-empty">{empty}</p>}
    </section>
  );
}

interface TableProps {
  rows: Row[];
  sort: SortKey;
  today: ISODate;
  selected: string | null;
  /** Row just marked filed; it gets a brief confirmation tint. */
  flash: string | null;
  onSelect: (key: string) => void;
  onFile: (row: Row) => void;
  onUnfile: (row: Row) => void;
}

function Table({ rows, sort, today, selected, flash, onSelect, onFile, onUnfile }: TableProps) {
  const ref = useRef<HTMLTableElement>(null);
  useFlip(ref, [rows, sort]);

  const groups: { date: ISODate | null; rows: Row[] }[] = [];
  if (sort === 'due') {
    for (const r of rows) {
      const last = groups[groups.length - 1];
      if (last && last.date === r.occ.due) last.rows.push(r);
      else groups.push({ date: r.occ.due, rows: [r] });
    }
  } else groups.push({ date: null, rows });

  return (
    <table class={`obl${sort === 'due' ? ' is-grouped' : ''}`} ref={ref}>
      <thead>
        <tr>
          <th scope="col" class="label col-due">{sort === 'due' ? 'When' : 'Due'}</th>
          <th scope="col" class="label col-code">Obligation</th>
          <th scope="col" class="label col-auth">Authority</th>
          <th scope="col" class="label col-exp">At 30 days</th>
          <th scope="col" class="label col-state">State</th>
          <th scope="col" class="col-act"><span class="visually-hidden">Filed</span></th>
        </tr>
      </thead>
      {groups.map((g) => (
        <tbody key={g.date ?? 'all'}>
          {g.date && (
            <tr class="obl-group" data-flip={`g:${g.date}`} key={`g:${g.date}`}>
              <th scope="colgroup" colSpan={6}>
                <span class="num">{formatDate(g.date)}</span>
                <span class="faint num"> - {relativeDays(today, g.date)}</span>
                {g.rows.length > 1 && <span class="faint num"> - {g.rows.length} obligations</span>}
              </th>
            </tr>
          )}
          {g.rows.map((r) => {
            const left = diffDays(today, r.occ.due);
            const interest = interestNote(r.rule.exposure);
            return (
              <tr
                key={r.occ.key}
                data-flip={r.occ.key}
                class={`obl-row state-${r.state}${selected === r.occ.key ? ' is-selected' : ''}${flash === r.occ.key ? ' is-flash' : ''}`}
                onClick={() => onSelect(r.occ.key)}
              >
                <td class="col-due num">
                  <span class="due-date">{formatDate(r.occ.due, { year: false })}</span>
                  <span class={`due-left state-${r.state}`}>{r.state === 'filed' ? 'Filed' : left === 0 ? 'Today' : left < 0 ? `${-left}d late` : `${left}d`}</span>
                </td>
                <td class="col-code">
                  <button
                    type="button"
                    class="obl-open"
                    aria-label={`${r.rule.code}, ${r.rule.title}, ${r.occ.periodLabel}. Open details`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(r.occ.key);
                    }}
                  >
                    <span class="obl-code-row">
                      <span class="obl-code fig">{r.rule.code}</span>
                      <Law row={r} />
                    </span>
                    <span class="obl-title">{r.rule.title}</span>
                  </button>
                  <span class="obl-period">
                    {r.occ.periodLabel}
                    {r.occ.projected && ' - projected'}
                  </span>
                </td>
                <td class="col-auth muted" title={r.rule.authority}><span class="auth-text">{shortAuthority(r.rule.authority)}</span></td>
                <td class="col-exp num">
                  {r.exposure ? <Money inr={r.exposure} compact stack /> : <span class="faint">-</span>}
                  {interest && <span class="exp-int faint">+ interest</span>}
                </td>
                <td class="col-state">
                  {r.state !== 'upcoming' && <span class="tag" data-state={r.state}>{STATE_LABEL[r.state]}</span>}
                  {r.occ.extended && r.state !== 'extended' && <span class="tag" data-state="extended">Extended</span>}
                  {r.filed?.owner && <span class="owner muted">{r.filed.owner}</span>}
                </td>
                <td class="col-act">
                  <button
                    type="button"
                    class={`file-btn${r.filed ? ' is-filed' : ''}`}
                    aria-pressed={Boolean(r.filed)}
                    aria-label={r.filed ? `Undo filed: ${r.rule.code} ${r.occ.periodLabel}` : `Mark filed: ${r.rule.code} ${r.occ.periodLabel}`}
                    title={r.filed ? 'Filed - click to undo' : 'Mark filed today'}
                    onClick={(e) => {
                      e.stopPropagation();
                      (r.filed ? onUnfile : onFile)(r);
                    }}
                  >
                    <svg class="icon check-draw" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      ))}
    </table>
  );
}
