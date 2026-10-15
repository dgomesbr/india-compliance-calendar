import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useBundle, useTeamState, useToday } from '../lib/client.ts';
import {
  daysInMonth,
  formatDate,
  formatLong,
  iso,
  MONTHS_LONG,
  parts,
  shiftMonth,
  weekday,
  type ISODate,
} from '../lib/dates.ts';
import { formatINRCompact } from '../lib/exposure.ts';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '../lib/types.ts';
import { buildRows, closedDays, STATE_LABEL, sortRows, type Row } from '../lib/view.ts';
import Detail, { Strip } from './Detail.tsx';
import { Icon } from './Icon.tsx';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthCalendar() {
  const data = useBundle();
  const [team, saveTeam] = useTeamState();
  const today = useToday();
  const [cursor, setCursor] = useState(() => {
    const p = parts(today);
    return { y: p.y, m: p.m };
  });
  const [day, setDay] = useState<ISODate>(today);
  const [laws, setLaws] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);

  const monthStart = iso(cursor.y, cursor.m, 1);
  const monthEnd = iso(cursor.y, cursor.m, daysInMonth(cursor.y, cursor.m));

  const rows = useMemo(() => {
    if (data.status !== 'ready' || !team) return [] as Row[];
    return buildRows({
      bundle: data.data,
      profile: { ...team.profile, categories: laws.length ? laws : team.profile.categories },
      today,
      from: monthStart,
      to: monthEnd,
      filed: team.filed,
      planned: team.planned,
      trackingSince: team.trackingSince,
      includeOverdue: true,
    }).filter((r) => r.occ.due >= monthStart && r.occ.due <= monthEnd);
  }, [data, team, today, monthStart, monthEnd, laws]);

  const holidays = useMemo(
    () => (data.status === 'ready' ? closedDays(data.data, team?.profile.states ?? []) : new Map<string, string>()),
    [data, team],
  );
  const byDay = useMemo(() => {
    const m = new Map<ISODate, Row[]>();
    for (const r of sortRows(rows, 'exposure')) {
      const list = m.get(r.occ.due) ?? [];
      list.push(r);
      m.set(r.occ.due, list);
    }
    return m;
  }, [rows]);

  const selectedRow = selected ? rows.find((r) => r.occ.key === selected) ?? null : null;
  useEffect(() => {
    const d = sheet.current;
    if (!d) return;
    if (selectedRow && !d.open) d.showModal();
    if (!selectedRow && d.open) d.close();
  }, [selectedRow]);

  const move = (n: number) => {
    const t = shiftMonth(cursor.y, cursor.m, n);
    setCursor(t);
    setDay(iso(t.y, t.m, 1));
  };
  const goToday = () => {
    const p = parts(today);
    setCursor({ y: p.y, m: p.m });
    setDay(today);
  };

  // Monday-first grid with leading and trailing blanks.
  const lead = (weekday(monthStart) + 6) % 7;
  const cells: (ISODate | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth(cursor.y, cursor.m) }, (_, i) => iso(cursor.y, cursor.m, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const onGridKey = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in step)) return;
    e.preventDefault();
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + step[e.key]);
    const next = d.toISOString().slice(0, 10);
    const p = parts(next);
    if (p.y !== cursor.y || p.m !== cursor.m) setCursor({ y: p.y, m: p.m });
    setDay(next);
    requestAnimationFrame(() => (document.querySelector(`[data-day="${next}"]`) as HTMLElement | null)?.focus());
  };

  const dayRows = byDay.get(day) ?? [];
  const loading = data.status === 'loading' || !team;

  return (
    <div class="page cal">
      <header class="cal-head">
        <h1 class="cat cal-title">
          {MONTHS_LONG[cursor.m - 1]} <span class="num">{cursor.y}</span>
        </h1>
        <div class="cal-nav">
          <button type="button" class="btn" onClick={() => move(-1)} aria-label="Previous month">
            <span class="btn-label"><Icon name="chevron-left" /></span>
          </button>
          <button type="button" class="btn" onClick={goToday}><span class="btn-label">Today</span></button>
          <button type="button" class="btn" onClick={() => move(1)} aria-label="Next month">
            <span class="btn-label"><Icon name="chevron-right" /></span>
          </button>
        </div>
        <p class="muted cal-count num">
          {loading ? 'Loading' : `${rows.length} ${rows.length === 1 ? 'obligation' : 'obligations'} this month`}
        </p>
      </header>

      <div class="laws cal-laws" role="group" aria-label="Laws">
        {CATEGORIES.map((c, i) => (
          <button type="button" class={`law-btn${laws.includes(c) ? ' is-on' : ''}`} aria-pressed={laws.includes(c)}
            onClick={() => setLaws(laws.includes(c) ? laws.filter((x) => x !== c) : [...laws, c])}>
            <span class="strip" aria-hidden="true">{Array.from({ length: 9 }, (_, j) => <span class={j === i ? 'lit' : ''} />)}</span>
            <span class="caps">{CATEGORY_LABEL[c]}</span>
          </button>
        ))}
      </div>

      <div class="cal-body">
        <div class="cal-grid" role="grid" aria-label={`${MONTHS_LONG[cursor.m - 1]} ${cursor.y}`} onKeyDown={onGridKey}>
          <div class="cal-row cal-dow" role="row">
            {DOW.map((d, i) => <div role="columnheader" class={`caps faint${i > 4 ? ' is-weekend' : ''}`}>{d}</div>)}
          </div>
          {Array.from({ length: cells.length / 7 }, (_, w) => (
            <div class="cal-row" role="row">
              {cells.slice(w * 7, w * 7 + 7).map((date, i) => {
                if (!date) return <div class="cal-cell is-blank" role="gridcell" aria-hidden="true" />;
                const list = byDay.get(date) ?? [];
                const holiday = holidays.get(date);
                const cls = [
                  'cal-cell',
                  date === today ? 'is-today' : '',
                  date === day ? 'is-selected' : '',
                  i > 4 ? 'is-weekend' : '',
                  holiday ? 'is-holiday' : '',
                ].join(' ');
                return (
                  <div class={cls} role="gridcell" aria-selected={date === day}>
                    <button
                      type="button"
                      class="cal-day"
                      data-day={date}
                      tabIndex={date === day ? 0 : -1}
                      onClick={() => setDay(date)}
                      aria-label={`${formatLong(date)}${holiday ? `, ${holiday}` : ''}: ${list.length} ${list.length === 1 ? 'obligation' : 'obligations'}`}
                    >
                      <span class="cal-num cat num">{parts(date).d}</span>
                      {holiday && <span class="cal-holiday">{holiday}</span>}
                      <span class="cal-codes">
                        {list.slice(0, 4).map((r) => (
                          <span class="cal-code" data-state={r.state}>{r.rule.code}</span>
                        ))}
                        {list.length > 4 && <span class="cal-more faint">+{list.length - 4} more</span>}
                      </span>
                      {list.length > 0 && <span class="cal-dots" aria-hidden="true">{list.slice(0, 6).map((r) => <span data-state={r.state} />)}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <section class="cal-day-list" aria-labelledby="cal-day-title">
          <h2 id="cal-day-title" class="caps">
            {formatDate(day)}
            {holidays.get(day) && <span class="faint"> - {holidays.get(day)}</span>}
          </h2>
          {dayRows.length === 0 ? (
            <p class="faint cal-empty">Nothing due on this day.</p>
          ) : (
            <ul>
              {dayRows.map((r) => (
                <li>
                  <button type="button" class="aside-item cal-item" onClick={() => setSelected(r.occ.key)}>
                    <span class="cal-item-top">
                      <Strip row={r} />
                      <span class="aside-code cat">{r.rule.code}</span>
                      {r.state !== 'upcoming' && <span class="tag" data-state={r.state}>{STATE_LABEL[r.state]}</span>}
                    </span>
                    <span class="aside-title">{r.rule.title}</span>
                    <span class="aside-meta num">
                      {r.occ.periodLabel}
                      {r.exposure ? ` - ${formatINRCompact(r.exposure)} at 30 days` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <dialog class="sheet" ref={sheet} onClose={() => setSelected(null)} aria-label="Obligation details">
        {selectedRow && team && (
          <Detail row={selectedRow} today={today} state={team} onSave={saveTeam} onClose={() => sheet.current?.close()} />
        )}
      </dialog>
    </div>
  );
}
