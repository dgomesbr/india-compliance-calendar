import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { fetchUpdates, useBundle, useTeamState, useToday } from '../lib/client.ts';
import { addMonths, diffDays, formatDate, lastDayOfMonth, parts, relativeDays, shiftMonth, type ISODate } from '../lib/dates.ts';
import { formatINR, formatINRCompact, interestNote } from '../lib/exposure.ts';
import {
  describeRange,
  HORIZON_LABEL,
  HORIZON_PRESETS,
  horizonRange,
  MAX_CUSTOM_MONTHS,
  maxHorizonEnd,
  type HorizonPreset,
} from '../lib/horizon.ts';
import { isEverything } from '../lib/profile.ts';
import type { TeamState } from '../lib/store.ts';
import { CATEGORIES, CATEGORY_LABEL, type Category, type Update } from '../lib/types.ts';
import {
  buildRows,
  countStates,
  matchesQuery,
  sortRows,
  STATE_LABEL,
  type Row,
  type RowState,
  shortAuthority,
  type SortKey,
} from '../lib/view.ts';
import Detail, { Law } from './Detail.tsx';
import { Icon } from './Icon.tsx';
import Timeline from './Timeline.tsx';

const READOUT: RowState[] = ['overdue', 'soon', 'extended', 'upcoming', 'filed'];
const SORT_LABEL: Record<SortKey, string> = { due: 'Due date', exposure: 'Penalty exposure', law: 'Law' };

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

export default function Overview() {
  const data = useBundle();
  const [team, saveTeam] = useTeamState();
  const today = useToday();
  const url = useMemo(readUrl, []);

  const [horizon, setHorizon] = useState<HorizonPreset>(url.h ?? '1m');
  const [customEnd, setCustomEnd] = useState<ISODate | undefined>(url.end);
  const [sort, setSort] = useState<SortKey>(url.sort ?? 'due');
  const [laws, setLaws] = useState<Category[]>(url.law ?? []);
  const [states, setStates] = useState<RowState[]>([]);
  const [query, setQuery] = useState(url.q ?? '');
  const [day, setDay] = useState<ISODate | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const initialised = useRef(false);
  const sheet = useRef<HTMLDialogElement>(null);

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

  const range = horizonRange(horizon, today, customEnd);

  // The plot always shows a few months of context past a short horizon.
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

  const counts = useMemo(() => countStates(allRows.filter((r) => matchesQuery(r, query))), [allRows, query]);

  const rows = useMemo(() => {
    let r = allRows.filter((x) => matchesQuery(x, query));
    if (states.length) r = r.filter((x) => states.includes(x.state));
    if (day) r = r.filter((x) => x.occ.due === day);
    return sortRows(r, sort);
  }, [allRows, query, states, day, sort]);

  const selectedRow = selected ? allRows.find((r) => r.occ.key === selected) ?? null : null;

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
    const next: TeamState = {
      ...team,
      filed: { ...team.filed, [row.occ.key]: { filedOn: today, owner: team.owners[row.rule.id] } },
    };
    saveTeam(next);
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

  return (
    <div class="ov">
      <section class="page ov-head" aria-labelledby="ov-title">
        <div class="ov-title-row">
          <h1 id="ov-title" class="fig ov-title num">{describeRange(range).replace(' - ', ' - ')}</h1>
          <p class="ov-sub muted">
            {profileName}
            {team && team.trackingSince && (
              <span class="faint"> - tracking filings since {formatDate(team.trackingSince, { weekday: false })}</span>
            )}
          </p>
        </div>

        <div class="ov-controls" role="group" aria-label="Horizon and order">
          <div class="seg" role="group" aria-label="Horizon">
            {HORIZON_PRESETS.map((h) => (
              <button
                type="button"
                aria-pressed={horizon === h}
                class={`seg-btn label${horizon === h ? ' is-on' : ''}`}
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
            <label class="label faint" for="ov-sort">Order by</label>
            <select id="ov-sort" class="select" value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option value={k}>{SORT_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div class="ov-search">
            <label class="visually-hidden" for="ov-q">Search obligations</label>
            <Icon name="search" />
            <input
              id="ov-q"
              class="input"
              type="search"
              placeholder="Search form, law or authority"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        {horizon === 'custom' && (
          <div class="ov-custom">
            <label class="label faint" for="ov-months">Months ahead</label>
            <input
              id="ov-months"
              type="range"
              min={1}
              max={MAX_CUSTOM_MONTHS}
              value={monthsBetween(today, range.to)}
              onInput={(e) => setCustomEnd(addMonths(today, Number((e.target as HTMLInputElement).value)))}
            />
            <output class="num" for="ov-months">{monthsBetween(today, range.to)} months</output>
            <label class="label faint" for="ov-end">Until</label>
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

        <div class="readout" role="group" aria-label="Filter by state">
          {READOUT.map((s) => (
            <button
              type="button"
              class={`readout-btn${states.includes(s) ? ' is-on' : ''}`}
              data-state={s}
              aria-pressed={states.includes(s)}
              onClick={() => setStates(toggle(states, s))}
              disabled={loading}
            >
              <span class="readout-block" aria-hidden="true" />
              <span class="num readout-n">{loading ? '-' : counts[s]}</span>
              <span class="label">{STATE_LABEL[s]}</span>
            </button>
          ))}
          <p class="readout-total faint num">
            {loading ? '' : `${formatINR(horizonExposure)} fixed exposure if every open item ran 30 days late`}
          </p>
        </div>
      </section>

      <section class="page ov-timeline" aria-labelledby="tl-title">
        <div class="tl-head">
          <h2 id="tl-title" class="tl-title">By law</h2>
          <p class="faint tl-note">Each mark is a due date; its size shows the fixed cost of a 30-day delay. Select one to filter the table.</p>
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
            <h2 id="ov-list-title" class="label">
              {loading ? 'Loading obligations' : `${rows.length} ${rows.length === 1 ? 'obligation' : 'obligations'}`}
              {day && <> on {formatDate(day)}</>}
            </h2>
            {day && (
              <button type="button" class="btn btn-quiet" onClick={() => setDay(null)}>
                <span class="btn-label"><Icon name="x" />Clear date</span>
              </button>
            )}
          </div>
          {loading ? (
            <div class="table-skeleton">{Array.from({ length: 7 }, () => <div class="skeleton row-skeleton" />)}</div>
          ) : rows.length === 0 ? (
            <div class="empty">
              <p class="empty-title">Nothing due in this view.</p>
              <p class="muted">
                {query || laws.length || states.length || day
                  ? 'Filters are narrowing the list. Clear them or widen the horizon.'
                  : 'No obligation in this profile falls due before ' + formatDate(range.to) + '. Try a longer horizon.'}
              </p>
              <div class="form-actions">
                {(query || laws.length || states.length || day) && (
                  <button class="btn" type="button" onClick={() => { setQuery(''); setLaws([]); setStates([]); setDay(null); }}>
                    <span class="btn-label">Clear filters</span>
                  </button>
                )}
                <button class="btn" type="button" onClick={() => setHorizon('1q')}><span class="btn-label">Show 1 quarter</span></button>
              </div>
            </div>
          ) : (
            <Table rows={rows} sort={sort} today={today} selected={selected} onSelect={setSelected} onFile={quickFile} onUnfile={unfile} />
          )}
        </section>

        <aside class="ov-aside" aria-label={selectedRow ? 'Obligation details' : 'At risk'}>
          {selectedRow && team ? (
            <div class="aside-detail">
              <Detail row={selectedRow} today={today} state={team} onSave={saveTeam} onClose={() => setSelected(null)} />
            </div>
          ) : (
            <>
              <AsideList title="Costliest if late" empty="No open items with a fixed penalty in this horizon.">
                {atRisk.filter((r) => r.exposure > 0).map((r) => (
                  <li>
                    <button type="button" class="aside-item" onClick={() => setSelected(r.occ.key)}>
                      <span class="aside-code fig">{r.rule.code}</span>
                      <span class="aside-meta num">{formatDate(r.occ.due, { year: false })} - {formatINRCompact(r.exposure)}</span>
                    </button>
                  </li>
                ))}
              </AsideList>
              <AsideList title="Extended or moved" empty="No notified extensions in this horizon.">
                {moved.map((r) => (
                  <li>
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
                {closedDays.map((r) => (
                  <li>
                    <button type="button" class="aside-item" onClick={() => setSelected(r.occ.key)}>
                      <span class="aside-code fig">{r.rule.code}</span>
                      <span class="aside-meta num">{formatDate(r.occ.due, { year: false })} - {r.closed?.join(', ')}</span>
                    </button>
                  </li>
                ))}
              </AsideList>
              <AsideList title="From the regulators" empty="The regulator feed has not been collected yet.">
                {updates.map((u) => (
                  <li>
                    <a class="aside-item" href={u.url} rel="noopener" target="_blank">
                      <span class="aside-title">{u.title}</span>
                      <span class="aside-meta label faint">{u.sourceName} - {formatDate(u.date, { weekday: false })}</span>
                    </a>
                  </li>
                ))}
              </AsideList>
            </>
          )}
        </aside>
      </div>

      <dialog class="sheet" ref={sheet} onClose={() => setSelected(null)} aria-label="Obligation details">
        {selectedRow && team && (
          <Detail row={selectedRow} today={today} state={team} onSave={saveTeam} onClose={() => sheet.current?.close()} />
        )}
      </dialog>
    </div>
  );
}

function AsideList({ title, empty, children }: { title: string; empty: string; children: ComponentChildren }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section class="aside-list">
      <h2 class="label faint">{title}</h2>
      {items.length ? <ul>{items}</ul> : <p class="faint aside-empty">{empty}</p>}
    </section>
  );
}

interface TableProps {
  rows: Row[];
  sort: SortKey;
  today: ISODate;
  selected: string | null;
  onSelect: (key: string) => void;
  onFile: (row: Row) => void;
  onUnfile: (row: Row) => void;
}

function Table({ rows, sort, today, selected, onSelect, onFile, onUnfile }: TableProps) {
  const groups: { date: ISODate | null; rows: Row[] }[] = [];
  if (sort === 'due') {
    for (const r of rows) {
      const last = groups[groups.length - 1];
      if (last && last.date === r.occ.due) last.rows.push(r);
      else groups.push({ date: r.occ.due, rows: [r] });
    }
  } else groups.push({ date: null, rows });

  return (
    <table class={`obl${sort === 'due' ? ' is-grouped' : ''}`}>
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
        <tbody>
          {g.date && (
            <tr class="obl-group">
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
                class={`obl-row state-${r.state}${selected === r.occ.key ? ' is-selected' : ''}`}
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
                  <span class="obl-period label faint">
                    {r.occ.periodLabel}
                    {r.occ.projected && ' - projected'}
                  </span>
                </td>
                <td class="col-auth muted" title={r.rule.authority}>{shortAuthority(r.rule.authority)}</td>
                <td class="col-exp num">
                  {r.exposure ? formatINRCompact(r.exposure) : <span class="faint">-</span>}
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
                    <Icon name="check" />
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
