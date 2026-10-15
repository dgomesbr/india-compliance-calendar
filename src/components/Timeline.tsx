import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { addDays, diffDays, formatDate, iso, MONTHS_SHORT, parts, shiftMonth, type ISODate } from '../lib/dates.ts';
import { formatINR, formatINRCompact } from '../lib/exposure.ts';
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_SHORT, type Category } from '../lib/types.ts';
import { STATE_LABEL, type Row, type RowState } from '../lib/view.ts';

export interface DateRange {
  from: ISODate;
  to: ISODate;
}

interface Props {
  rows: Row[];
  today: ISODate;
  /** End of the selected horizon. Rows after it are context, drawn lighter. */
  to: ISODate;
  selected: DateRange | null;
  onPick: (range: DateRange | null) => void;
}

/** One mark: a due date in a lane, or a cluster of near dates merged so nothing hides. */
interface Mark {
  from: ISODate;
  to: ISODate;
  lane: number;
  category: Category;
  count: number;
  exposure: number;
  codes: string[];
  state: RowState;
  x: number;
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

function radius(exposure: number, count: number, narrow: boolean): number {
  const r = (narrow ? 3 : 4.5) + Math.min(narrow ? 3.5 : 7, 2.1 * Math.log10(1 + exposure / 1000));
  // Clusters are large enough to carry their count.
  return count > 1 ? Math.max(r, narrow ? 6.5 : 8.5) : r;
}

function rangeLabel(m: { from: ISODate; to: ISODate }): string {
  if (m.from === m.to) return formatDate(m.from);
  return `${formatDate(m.from, { weekday: false, year: false })} - ${formatDate(m.to, { weekday: false })}`;
}

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
  const laneH = narrow ? 30 : 31;
  const top = 34;
  const right = narrow ? 10 : 16;

  const model = useMemo(() => {
    // Domain: from the earliest overdue item (or today) to at least a month ahead.
    let start = today;
    for (const r of rows) if (r.state === 'overdue' && r.occ.due < start) start = r.occ.due;
    const minEnd = addDays(today, 30);
    const end = to > minEnd ? to : minEnd;
    const span = Math.max(7, diffDays(start, end));
    const x0 = labelW;
    const x1 = width - right;
    const xOf = (d: ISODate) => x0 + (diffDays(start, d) / span) * (x1 - x0);

    const present = CATEGORIES.filter((c) => rows.some((r) => r.rule.category === c && r.occ.due >= start && r.occ.due <= end));
    const laneOf = new Map(present.map((c, i) => [c, i]));

    // 1. One mark per lane and date.
    const byKey = new Map<string, Mark>();
    for (const r of rows) {
      if (r.occ.due < start || r.occ.due > end) continue;
      const lane = laneOf.get(r.rule.category);
      if (lane === undefined) continue;
      const key = `${lane}|${r.occ.due}`;
      let m = byKey.get(key);
      if (!m) {
        m = { from: r.occ.due, to: r.occ.due, lane, category: r.rule.category, count: 0, exposure: 0, codes: [], state: r.state, x: xOf(r.occ.due), r: 0, beyond: r.occ.due > to };
        byKey.set(key, m);
      }
      m.count++;
      m.exposure += r.exposure;
      if (!m.codes.includes(r.rule.code)) m.codes.push(r.rule.code);
      if (SEVERITY.indexOf(r.state) < SEVERITY.indexOf(m.state)) m.state = r.state;
    }

    // 2. Merge neighbours in a lane until no mark overlaps another.
    const marks: Mark[] = [];
    for (let lane = 0; lane < present.length; lane++) {
      let list = [...byKey.values()].filter((m) => m.lane === lane).sort((a, b) => a.x - b.x);
      for (const m of list) m.r = radius(m.exposure, m.count, narrow);
      let merged = true;
      while (merged) {
        merged = false;
        const next: Mark[] = [];
        for (const m of list) {
          const prev = next[next.length - 1];
          if (prev && m.x - prev.x < prev.r + m.r + 2) {
            const c: Mark = {
              ...prev,
              to: m.to > prev.to ? m.to : prev.to,
              count: prev.count + m.count,
              exposure: prev.exposure + m.exposure,
              codes: [...new Set([...prev.codes, ...m.codes])],
              state: SEVERITY.indexOf(m.state) < SEVERITY.indexOf(prev.state) ? m.state : prev.state,
              beyond: prev.beyond && m.beyond,
            };
            c.x = (xOf(c.from) + xOf(c.to)) / 2;
            c.r = radius(c.exposure, c.count, narrow);
            next[next.length - 1] = c;
            merged = true;
          } else next.push(m);
        }
        list = next;
      }
      marks.push(...list);
    }
    marks.sort((a, b) => (a.from === b.from ? a.lane - b.lane : a.from < b.from ? -1 : 1));

    // Axis: month starts, or week starts for short spans; Today keeps its label.
    const xToday = xOf(today);
    const ticks: { x: number; label: string; major: boolean }[] = [];
    if (span <= 50) {
      for (let d = start; d <= end; d = addDays(d, 1)) {
        if (new Date(`${d}T00:00:00Z`).getUTCDay() === 1) {
          ticks.push({ x: xOf(d), label: formatDate(d, { weekday: false, year: false }), major: parts(d).d <= 7 });
        }
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
    const heaviest = marks.filter((m) => !m.beyond && m.exposure > 0).reduce<Mark | null>((a, m) => (!a || m.exposure > a.exposure ? m : a), null);
    return { start, end, xOf, present, marks, ticks, x0, x1, xToday, heaviest };
  }, [rows, today, to, width, narrow, labelW]);

  const { present, marks, ticks, xOf, x0, x1, end, xToday, heaviest } = model;
  const height = top + Math.max(1, present.length) * laneH + 10;
  const active = hover >= 0 ? marks[hover] : cursor >= 0 ? marks[cursor] : null;
  const counts = new Map<Category, number>();
  for (const m of marks) if (!m.beyond) counts.set(m.category, (counts.get(m.category) ?? 0) + m.count);
  const isSelected = (m: Mark) => Boolean(selected && m.from === selected.from && m.to === selected.to);

  const onKey = (e: KeyboardEvent) => {
    if (!marks.length) return;
    const cur = cursor < 0 ? 0 : cursor;
    let next = cur;
    if (e.key === 'ArrowRight') next = Math.min(marks.length - 1, cursor < 0 ? 0 : cur + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const lane = marks[cur].lane + (e.key === 'ArrowDown' ? 1 : -1);
      const same = marks.filter((m) => m.lane === lane);
      if (same.length) next = marks.indexOf(same.reduce((a, b) => (Math.abs(a.x - marks[cur].x) <= Math.abs(b.x - marks[cur].x) ? a : b)));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (cursor >= 0) onPick(isSelected(marks[cursor]) ? null : { from: marks[cursor].from, to: marks[cursor].to });
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

  const xEnd = Math.min(x1, xOf(to));
  const keyR = [radius(0, 1, narrow), radius(10_000, 1, narrow), radius(100_000, 1, narrow)];

  return (
    <div class="tl" ref={wrap}>
      <div class="tl-key" aria-hidden="true">
        <span class="tl-key-item">
          <svg width={keyR[0] * 2 + 2} height={keyR[2] * 2 + 2}><circle cx={keyR[0] + 1} cy={keyR[2] + 1} r={keyR[0]} /></svg>
          Under Rs 1,000
        </span>
        <span class="tl-key-item">
          <svg width={keyR[1] * 2 + 2} height={keyR[2] * 2 + 2}><circle cx={keyR[1] + 1} cy={keyR[2] + 1} r={keyR[1]} /></svg>
          Rs 10,000
        </span>
        <span class="tl-key-item">
          <svg width={keyR[2] * 2 + 2} height={keyR[2] * 2 + 2}><circle cx={keyR[2] + 1} cy={keyR[2] + 1} r={keyR[2]} /></svg>
          Rs 1 lakh or more
        </span>
        <span class="tl-key-item faint">Numbers count due dates merged into one mark</span>
      </div>
      <svg
        class="tl-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="application"
        aria-roledescription="timeline"
        aria-label="Obligations by law over the horizon. Use arrow keys to move between due dates and Enter to filter the table to them."
        aria-describedby="tl-summary"
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setCursor(-1)}
      >
        {xEnd < x1 && <rect class="tl-beyond" x={xEnd} y={top - 6} width={x1 - xEnd + right} height={height - top + 6} />}

        {ticks.map((t) => (
          <g class={`tl-tick${t.major ? ' is-major' : ''}`}>
            <line x1={t.x} x2={t.x} y1={top - 6} y2={height - 6} />
            {Math.abs(t.x - xToday) > 52 && <text x={t.x + 4} y={top - 14}>{t.label}</text>}
          </g>
        ))}

        {present.map((c, i) => {
          const y = top + i * laneH + laneH / 2;
          return (
            <g class="tl-lane">
              <line x1={x0} x2={x1} y1={y} y2={y} />
              <text x={0} y={y + 4} class="tl-lane-label">{narrow ? NARROW_LABEL[c] : CATEGORY_LABEL[c]}</text>
              {!narrow && <text x={x0 - 12} y={y + 4} text-anchor="end" class="tl-lane-count">{counts.get(c) ?? 0}</text>}
            </g>
          );
        })}

        {selected && (
          <rect
            class="tl-selected"
            x={xOf(selected.from) - 8}
            y={top - 6}
            width={Math.max(16, xOf(selected.to) - xOf(selected.from) + 16)}
            height={height - top}
            rx={3}
          />
        )}

        <g class="tl-today">
          <line x1={xToday} x2={xToday} y1={top - 8} y2={height - 6} />
          <text x={xToday + 4} y={top - 14} class="tl-today-label">Today</text>
        </g>

        {marks.map((m, i) => {
          const y = top + m.lane * laneH + laneH / 2;
          const on = i === hover || i === cursor || isSelected(m);
          return (
            <g
              class={`tl-mark${m.beyond ? ' is-beyond' : ''}${on ? ' is-active' : ''}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onClick={() => onPick(isSelected(m) ? null : { from: m.from, to: m.to })}
            >
              <circle cx={m.x} cy={y} r={Math.max(m.r, 12)} class="tl-hit" />
              <circle cx={m.x} cy={y} r={m.r} fill={FILL[m.state]} class="tl-dot" />
              {m.count > 1 && <text x={m.x} y={y + 3.5} text-anchor="middle" class="tl-count">{m.count}</text>}
            </g>
          );
        })}

        {heaviest && !narrow && (() => {
          const y = top + heaviest.lane * laneH + laneH / 2;
          const leftSide = heaviest.x > x1 - 190;
          const label = `${heaviest.codes[0]}${heaviest.codes.length > 1 ? ` +${heaviest.codes.length - 1}` : ''} - ${formatINRCompact(heaviest.exposure)}`;
          return (
            <text
              class="tl-callout"
              x={leftSide ? heaviest.x - heaviest.r - 6 : heaviest.x + heaviest.r + 6}
              y={y + 4}
              text-anchor={leftSide ? 'end' : 'start'}
            >
              {label}
            </text>
          );
        })()}
      </svg>

      {active && (
        <div class={`tl-tip${active.x > width * 0.7 ? ' is-left' : ''}`} role="status" style={{ left: `${active.x}px`, top: `${top + active.lane * laneH + 30}px` }}>
          <p class="tl-tip-head">
            <span class="num">{rangeLabel(active)}</span>
            <span class="law">{CATEGORY_SHORT[active.category]}</span>
          </p>
          <p class="tl-tip-codes">
            {active.codes.slice(0, 6).join(', ')}
            {active.codes.length > 6 ? ` +${active.codes.length - 6}` : ''}
          </p>
          <p class="tl-tip-meta num">
            {active.count} {active.count === 1 ? 'obligation' : 'obligations'} - {STATE_LABEL[active.state].toLowerCase()}
            {active.exposure ? ` - ${formatINR(active.exposure)} if 30 days late` : ''}
          </p>
        </div>
      )}

      <p id="tl-summary" class="visually-hidden" aria-live="polite">
        {cursor >= 0 && marks[cursor]
          ? `${rangeLabel(marks[cursor])}, ${CATEGORY_LABEL[marks[cursor].category]}: ${marks[cursor].codes.join(', ')}.`
          : `${marks.filter((m) => !m.beyond).length} marks across ${present.length} laws until ${formatDate(end)}.` +
            (heaviest ? ` Costliest: ${rangeLabel(heaviest)}, ${heaviest.codes.join(', ')}, ${formatINR(heaviest.exposure)}.` : '')}
      </p>
    </div>
  );
}
