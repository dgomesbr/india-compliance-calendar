import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { addDays, diffDays, formatDate, iso, MONTHS_SHORT, parts, shiftMonth, type ISODate } from '../lib/dates.ts';
import { formatINR } from '../lib/exposure.ts';
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_SHORT, type Category } from '../lib/types.ts';
import { STATE_LABEL, type Row, type RowState } from '../lib/view.ts';

interface Props {
  rows: Row[];
  today: ISODate;
  /** End of the selected horizon. Rows after it are context, drawn lighter. */
  to: ISODate;
  selected: ISODate | null;
  onPick: (date: ISODate | null) => void;
}

interface Mark {
  key: string;
  date: ISODate;
  lane: number;
  category: Category;
  count: number;
  exposure: number;
  codes: string[];
  state: RowState;
  r: number;
  beyond: boolean;
}

const SEVERITY: RowState[] = ['overdue', 'soon', 'extended', 'upcoming', 'past', 'filed'];
const NARROW_LABEL: Record<Category, string> = { ...CATEGORY_SHORT, 'income-tax': 'Inc tax' };
const FILL: Record<RowState, string> = {
  overdue: 'var(--overdue)',
  soon: 'var(--soon)',
  extended: 'var(--extended)',
  upcoming: 'var(--upcoming)',
  past: 'var(--past)',
  filed: 'var(--filed)',
};

export default function Timeline({ rows, today, to, selected, onPick }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [hover, setHover] = useState<number>(-1);
  const [cursor, setCursor] = useState<number>(-1);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 640;
  const labelW = narrow ? 70 : 150;
  const laneH = narrow ? 30 : 34;
  const top = 34;
  const right = narrow ? 10 : 16;

  const model = useMemo(() => {
    // Domain: from the earliest overdue item (or today) to at least a month ahead.
    let start = today;
    for (const r of rows) if (r.state === 'overdue' && r.occ.due < start) start = r.occ.due;
    const minEnd = addDays(today, 30);
    let end = to > minEnd ? to : minEnd;
    for (const r of rows) if (r.occ.due > end && r.occ.due <= to) end = r.occ.due;
    const span = Math.max(7, diffDays(start, end));
    const x0 = labelW;
    const x1 = width - right;
    const xOf = (d: ISODate) => x0 + (diffDays(start, d) / span) * (x1 - x0);

    const present = CATEGORIES.filter((c) => rows.some((r) => r.rule.category === c && r.occ.due >= start && r.occ.due <= end));
    const laneOf = new Map(present.map((c, i) => [c, i]));

    const groups = new Map<string, Mark>();
    for (const r of rows) {
      if (r.occ.due < start || r.occ.due > end) continue;
      const lane = laneOf.get(r.rule.category);
      if (lane === undefined) continue;
      const key = `${r.rule.category}|${r.occ.due}`;
      let m = groups.get(key);
      if (!m) {
        m = { key, date: r.occ.due, lane, category: r.rule.category, count: 0, exposure: 0, codes: [], state: r.state, r: 0, beyond: r.occ.due > to };
        groups.set(key, m);
      }
      m.count++;
      m.exposure += r.exposure;
      if (m.codes.length < 6) m.codes.push(r.rule.code);
      if (SEVERITY.indexOf(r.state) < SEVERITY.indexOf(m.state)) m.state = r.state;
    }
    const marks = [...groups.values()].sort((a, b) => (a.date === b.date ? a.lane - b.lane : a.date < b.date ? -1 : 1));
    for (const m of marks) {
      m.r = (narrow ? 3.5 : 4.5) + Math.min(narrow ? 5 : 7, 2.1 * Math.log10(1 + m.exposure / 1000)) + (m.count > 1 ? 1.5 : 0);
    }

    // Axis: month starts, or week starts for short spans.
    const ticks: { x: number; label: string; major: boolean }[] = [];
    if (span <= 50) {
      for (let d = start; d <= end; d = addDays(d, 1)) {
        const w = new Date(`${d}T00:00:00Z`).getUTCDay();
        if (w === 1) ticks.push({ x: xOf(d), label: formatDate(d, { weekday: false, year: false }), major: parts(d).d <= 7 });
      }
    } else {
      const s = parts(start);
      let m = shiftMonth(s.y, s.m, 1);
      const step = span > 400 ? (narrow ? 6 : 3) : span > 200 ? (narrow ? 3 : 1) : narrow ? 2 : 1;
      let i = 0;
      while (iso(m.y, m.m, 1) <= end) {
        if (i % step === 0) {
          const label = m.m === 1 || i === 0 ? `${MONTHS_SHORT[m.m - 1]} ${m.y}` : MONTHS_SHORT[m.m - 1];
          ticks.push({ x: xOf(iso(m.y, m.m, 1)), label, major: m.m === 1 });
        }
        m = shiftMonth(m.y, m.m, 1);
        i++;
      }
    }
    return { start, end, xOf, present, marks, ticks, x0, x1 };
  }, [rows, today, to, width, narrow, labelW]);

  const { present, marks, ticks, xOf, x0, x1, end } = model;
  const height = top + Math.max(1, present.length) * laneH + 10;
  const active = hover >= 0 ? marks[hover] : cursor >= 0 ? marks[cursor] : null;
  const counts = new Map<Category, number>();
  for (const m of marks) if (!m.beyond) counts.set(m.category, (counts.get(m.category) ?? 0) + m.count);

  const onKey = (e: KeyboardEvent) => {
    if (!marks.length) return;
    const cur = cursor < 0 ? 0 : cursor;
    let next = cur;
    if (e.key === 'ArrowRight') next = Math.min(marks.length - 1, cursor < 0 ? 0 : cur + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const lane = marks[cur].lane + (e.key === 'ArrowDown' ? 1 : -1);
      const same = marks.filter((m) => m.lane === lane);
      if (same.length) {
        const best = same.reduce((a, b) => (Math.abs(diffDays(a.date, marks[cur].date)) <= Math.abs(diffDays(b.date, marks[cur].date)) ? a : b));
        next = marks.indexOf(best);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (cursor >= 0) onPick(marks[cursor].date === selected ? null : marks[cursor].date);
      return;
    } else if (e.key === 'Escape') {
      setCursor(-1);
      onPick(null);
      return;
    } else return;
    e.preventDefault();
    setCursor(next);
  };

  if (!present.length) {
    return (
      <div class="tl tl-empty" ref={wrap}>
        <p class="muted">No obligations fall due in this horizon for the current profile and filters.</p>
      </div>
    );
  }

  const xToday = xOf(today);
  const xEnd = Math.min(x1, xOf(to));
  const heaviest = marks.filter((m) => !m.beyond).reduce<Mark | null>((a, m) => (!a || m.exposure > a.exposure ? m : a), null);

  return (
    <div class="tl" ref={wrap}>
      <svg
        class="tl-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="application"
        aria-roledescription="timeline"
        aria-label="Obligations by law over the horizon. Use arrow keys to move between due dates and Enter to filter the table to one date."
        aria-describedby="tl-summary"
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setCursor(-1)}
      >
        {xEnd < x1 && <rect class="tl-beyond" x={xEnd} y={top - 6} width={x1 - xEnd + right} height={height - top + 6} />}

        {ticks.map((t) => (
          <g class={`tl-tick${t.major ? ' is-major' : ''}`}>
            <line x1={t.x} x2={t.x} y1={top - 6} y2={height - 6} />
            <text x={t.x + 4} y={top - 14}>{t.label}</text>
          </g>
        ))}

        {present.map((c, i) => {
          const y = top + i * laneH + laneH / 2;
          return (
            <g class="tl-lane">
              <line x1={x0} x2={x1} y1={y} y2={y} />
              <text x={0} y={y + 4} class="tl-lane-label">{narrow ? NARROW_LABEL[c] : CATEGORY_LABEL[c]}</text>
              {!narrow && (
                <text x={x0 - 12} y={y + 4} text-anchor="end" class="tl-lane-count">{counts.get(c) ?? 0}</text>
              )}
            </g>
          );
        })}

        {selected && xOf(selected) >= x0 && (
          <rect class="tl-selected" x={xOf(selected) - 7} y={top - 6} width={14} height={height - top} rx={3} />
        )}

        <g class="tl-today">
          <line x1={xToday} x2={xToday} y1={top - 8} y2={height - 6} />
          <text x={xToday + 4} y={top - 14 + (ticks.some((t) => Math.abs(t.x - xToday) < 60) ? -0 : 0)} class="tl-today-label">
            {ticks.some((t) => Math.abs(t.x + 4 - xToday) < 56) ? '' : 'Today'}
          </text>
        </g>

        {marks.map((m, i) => {
          const y = top + m.lane * laneH + laneH / 2;
          const isActive = i === hover || i === cursor || m.date === selected;
          return (
            <g
              class={`tl-mark${m.beyond ? ' is-beyond' : ''}${isActive ? ' is-active' : ''}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onClick={() => onPick(m.date === selected ? null : m.date)}
            >
              <circle cx={xOf(m.date)} cy={y} r={Math.max(m.r, 12)} class="tl-hit" />
              <circle cx={xOf(m.date)} cy={y} r={m.r} fill={FILL[m.state]} class="tl-dot" />
              {m.count > 1 && m.r >= 8 && (
                <text x={xOf(m.date)} y={y + 3.5} text-anchor="middle" class="tl-count">{m.count}</text>
              )}
            </g>
          );
        })}
      </svg>

      {active && (
        <div
          class={`tl-tip${xOf(active.date) > width * 0.7 ? ' is-left' : ''}`}
          role="status"
          style={{ left: `${xOf(active.date)}px`, top: `${top + active.lane * laneH}px` }}
        >
          <p class="tl-tip-head">
            <span class="num">{formatDate(active.date)}</span>
            <span class="law">{CATEGORY_SHORT[active.category]}</span>
          </p>
          <p class="tl-tip-codes">{active.codes.join(', ')}{active.count > active.codes.length ? ` +${active.count - active.codes.length}` : ''}</p>
          <p class="tl-tip-meta num">
            {active.count} {active.count === 1 ? 'obligation' : 'obligations'} - {STATE_LABEL[active.state].toLowerCase()}
            {active.exposure ? ` - ${formatINR(active.exposure)} if 30 days late` : ''}
          </p>
        </div>
      )}

      <p id="tl-summary" class="visually-hidden" aria-live="polite">
        {cursor >= 0 && marks[cursor]
          ? `${formatDate(marks[cursor].date)}, ${CATEGORY_LABEL[marks[cursor].category]}: ${marks[cursor].codes.join(', ')}.`
          : `${marks.filter((m) => !m.beyond).length} due dates across ${present.length} laws until ${formatDate(end)}.` +
            (heaviest ? ` Costliest: ${formatDate(heaviest.date)}, ${heaviest.codes.join(', ')}.` : '')}
      </p>
    </div>
  );
}
