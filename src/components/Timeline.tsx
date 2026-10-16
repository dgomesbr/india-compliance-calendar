import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { addDays, diffDays, formatDate, iso, MONTHS_SHORT, parts, shiftMonth, type ISODate } from '../lib/dates.ts';
import { useMoneyFormat } from './Money.tsx';
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_SHORT, type Category } from '../lib/types.ts';
import { STATE_LABEL, type Row, type RowState } from '../lib/view.ts';

export interface DateRange {
  from: ISODate;
  to: ISODate;
}

interface Props {
  rows: Row[];
  today: ISODate;
  /** Start of the selected range when it reaches back before today. */
  from?: ISODate;
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

/** Every mark, single or merged, is sized by its fixed cost of a 30-day delay. */
function radius(exposure: number, narrow: boolean): number {
  return (narrow ? 3 : 4.5) + Math.min(narrow ? 3.5 : 7, 2.1 * Math.log10(1 + exposure / 1000));
}

/** A merged mark carries its count inside when the disc is large enough, beside it otherwise. */
function countInside(m: Pick<Mark, 'count' | 'r'>): boolean {
  return m.r >= (m.count > 9 ? 9 : 7);
}

/** How far a mark reaches to the right, including a count set beside it. */
function reach(m: Pick<Mark, 'count' | 'r'>): number {
  return m.count > 1 && !countInside(m) ? m.r + 3 + String(m.count).length * 6.5 : m.r;
}

const markKey = (m: Mark) => `${m.category}|${m.from}`;

function rangeLabel(m: { from: ISODate; to: ISODate }): string {
  if (m.from === m.to) return formatDate(m.from);
  return `${formatDate(m.from, { weekday: false, year: false })} - ${formatDate(m.to, { weekday: false })}`;
}

export default function Timeline({ rows, today, from, to, selected, onPick }: Props) {
  const money = useMoneyFormat();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [hover, setHover] = useState<number>(-1);
  const [cursor, setCursor] = useState<number>(-1);
  const [ready, setReady] = useState(false);
  // How each mark entered: the first marks assemble outward from Today, later ones pop in.
  const entry = useRef(new Map<string, 'assemble' | 'pop'>());
  const seenMarks = useRef(false);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setWidth(Math.max(300, Math.round(el.clientWidth)));
    // Marks glide to new positions on later changes, never from the first measurement.
    const t = setTimeout(() => setReady(true), 120);
    if (typeof ResizeObserver === 'undefined') return () => clearTimeout(t);
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  const narrow = width < 640;
  const labelW = narrow ? 70 : 150;
  const laneH = narrow ? 30 : 31;
  const top = 34;
  const right = narrow ? 10 : 16;

  const model = useMemo(() => {
    // Domain: from the range start, the earliest overdue item or today, to at least a month ahead.
    let start = from && from < today ? from : today;
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
      for (const m of list) m.r = radius(m.exposure, narrow);
      let merged = true;
      while (merged) {
        merged = false;
        const next: Mark[] = [];
        for (const m of list) {
          const prev = next[next.length - 1];
          if (prev && m.x - prev.x < reach(prev) + m.r + 2) {
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
            c.r = radius(c.exposure, narrow);
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
    const ticks: { key: ISODate; x: number; label: string; major: boolean; lx?: number; show?: boolean }[] = [];
    if (span <= 50) {
      for (let d = start; d <= end; d = addDays(d, 1)) {
        if (new Date(`${d}T00:00:00Z`).getUTCDay() === 1) {
          ticks.push({ key: d, x: xOf(d), label: formatDate(d, { weekday: false, year: false }), major: parts(d).d <= 7 });
        }
      }
    } else {
      const s = parts(start);
      let m = shiftMonth(s.y, s.m, 1);
      const step = span > 400 ? (narrow ? 6 : 3) : span > 200 ? (narrow ? 3 : 1) : 1;
      let i = 0;
      let lastYear = -1;
      while (iso(m.y, m.m, 1) <= end) {
        if (i % step === 0) {
          const year = narrow ? String(m.y).slice(2) : String(m.y);
          // The year shows on the first tick and wherever it changes, so quarterly ticks still carry it.
          const withYear = m.m === 1 || i === 0 || m.y !== lastYear;
          const label = withYear ? `${MONTHS_SHORT[m.m - 1]} ${year}` : MONTHS_SHORT[m.m - 1];
          ticks.push({ key: iso(m.y, m.m, 1), x: xOf(iso(m.y, m.m, 1)), label, major: m.m === 1 });
          lastYear = m.y;
        }
        m = shiftMonth(m.y, m.m, 1);
        i++;
      }
    }
    // Place tick labels left to right: shift one just past Today, hide any that would collide
    // with Today's label or the label before it (a range reaching back has labels on both sides).
    const charW = 6.5;
    let lastEnd = -Infinity;
    for (const t of [...ticks].sort((a, b) => a.x - b.x)) {
      const w = t.label.length * charW;
      t.lx = t.x - xToday > -4 && t.x - xToday < 46 ? xToday + 46 : t.x + 4;
      const intoToday = t.lx < xToday + 40 && t.lx + w > xToday - 4;
      t.show = !intoToday && t.lx >= lastEnd + 6;
      if (t.show) lastEnd = t.lx + w;
    }
    const heaviest = marks.filter((m) => !m.beyond && m.exposure > 0).reduce<Mark | null>((a, m) => (!a || m.exposure > a.exposure ? m : a), null);
    return { start, end, xOf, present, marks, ticks, x0, x1, xToday, heaviest };
  }, [rows, today, from, to, width, narrow, labelW]);

  const { present, marks, ticks, xOf, x0, x1, end, xToday, heaviest } = model;
  // Marks first painted assemble; the re-render that measures the real width still counts as first.
  useEffect(() => {
    if (marks.length) seenMarks.current = true;
  });
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
  // On narrow screens the size key gives the reference amount alone, so it stays on one line.
  const keyAmount = (inr: number) => (narrow ? money.ref(inr, true) ?? money.inr(inr, true) : money.both(inr, true));
  const keyR = [radius(0, narrow), radius(10_000, narrow), radius(100_000, narrow)];
  const nextEntry = new Map<string, 'assemble' | 'pop'>();
  for (const m of marks) nextEntry.set(markKey(m), entry.current.get(markKey(m)) ?? (seenMarks.current ? 'pop' : 'assemble'));
  entry.current = nextEntry;
  const span = Math.max(1, x1 - x0);
  const hotLane = active ? active.lane : -1;

  return (
    <div class="tl" ref={wrap}>
      <div class="tl-key" aria-hidden="true">
        <span class="tl-key-item">
          <svg width={keyR[0] * 2 + 2} height={keyR[2] * 2 + 2}><circle cx={keyR[0] + 1} cy={keyR[2] + 1} r={keyR[0]} /></svg>
          Under {keyAmount(1000)}
        </span>
        <span class="tl-key-item">
          <svg width={keyR[1] * 2 + 2} height={keyR[2] * 2 + 2}><circle cx={keyR[1] + 1} cy={keyR[2] + 1} r={keyR[1]} /></svg>
          {keyAmount(10_000)}
        </span>
        <span class="tl-key-item">
          <svg width={keyR[2] * 2 + 2} height={keyR[2] * 2 + 2}><circle cx={keyR[2] + 1} cy={keyR[2] + 1} r={keyR[2]} /></svg>
          {keyAmount(100_000)} or more
        </span>
        <span class="tl-key-item faint">Numbers count due dates merged into one mark</span>
      </div>
      <svg
        class={`tl-svg${ready ? ' is-ready' : ''}`}
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
          <g class={`tl-tick${t.major ? ' is-major' : ''}`} key={t.key} style={{ transform: `translateX(${t.x}px)` }}>
            <line x1={0} x2={0} y1={top - 6} y2={height - 6} />
            {t.show && (
              <text x={(t.lx ?? t.x) - t.x} y={top - 14}>
                {t.label}
              </text>
            )}
          </g>
        ))}

        {present.map((c, i) => {
          const y = top + i * laneH + laneH / 2;
          return (
            <g class={`tl-lane${i === hotLane ? ' is-hot' : ''}`} key={c} data-law={c} style={{ transform: `translateY(${y}px)` }}>
              <rect class="tl-lane-band" x={x0 - 8} y={-laneH / 2 + 1} width={x1 - x0 + 16} height={laneH - 2} rx={4} />
              <line x1={x0} x2={x1} y1={0} y2={0} />
              <rect class="tl-lane-swatch" x={0} y={-4.5} width={9} height={9} rx={2} />
              <text x={15} y={4} class="tl-lane-label">{narrow ? NARROW_LABEL[c] : CATEGORY_LABEL[c]}</text>
              {!narrow && <text x={x0 - 12} y={4} text-anchor="end" class="tl-lane-count">{counts.get(c) ?? 0}</text>}
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

        <g class="tl-today" style={{ transform: `translateX(${xToday}px)` }}>
          <path d={`M0 ${top - 8}V${height - 6}`} pathLength={1} />
          <text x={4} y={top - 14} class="tl-today-label">Today</text>
        </g>

        {marks.map((m, i) => {
          const key = markKey(m);
          const y = top + m.lane * laneH + laneH / 2;
          const on = i === hover || i === cursor || isSelected(m);
          const dist = m.x - xToday;
          const assemble = entry.current.get(key) === 'assemble';
          // Assembling marks start a short way toward Today and arrive in a wave by distance from it.
          const enter = assemble
            ? { '--dx': `${-Math.sign(dist) * Math.min(Math.abs(dist), 96)}px`, '--d': `${Math.round(Math.min(1, Math.abs(dist) / span) * 260)}ms` }
            : {};
          return (
            <g
              key={key}
              class={`tl-mark${m.beyond ? ' is-beyond' : ''}${on ? ' is-active' : ''}`}
              style={{ transform: `translate(${m.x}px, ${y}px)` }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onClick={() => onPick(isSelected(m) ? null : { from: m.from, to: m.to })}
            >
              <g class="tl-body" data-enter={assemble ? 'assemble' : 'pop'} style={enter}>
                <circle cx={0} cy={0} r={Math.max(m.r, 12)} class="tl-hit" />
                <circle cx={0} cy={0} r={m.r} fill={FILL[m.state]} class="tl-dot" />
                {m.count > 1 &&
                  (countInside(m) ? (
                    <text x={0} y={3.5} text-anchor="middle" class={`tl-count${m.count > 9 ? ' is-wide' : ''}${m.state === 'soon' ? ' on-amber' : ''}`}>
                      {m.count}
                    </text>
                  ) : (
                    <text x={m.r + 3} y={4} class="tl-count is-out">
                      {m.count}
                    </text>
                  ))}
              </g>
            </g>
          );
        })}

        {heaviest && !narrow && (() => {
          const label = `${heaviest.codes[0]}${heaviest.codes.length > 1 ? ` +${heaviest.codes.length - 1}` : ''} - ${money.ref(heaviest.exposure, true) ?? money.inr(heaviest.exposure, true)}`;
          const w = label.length * 7;
          const y = top + heaviest.lane * laneH + laneH / 2;
          // A span [a, b] on a lane is free when no other mark's circle reaches into it.
          const free = (lane: number, a: number, b: number) =>
            a >= x0 &&
            b <= x1 + right &&
            !marks.some((m) => m !== heaviest && m.lane === lane && m.x + reach(m) + 2 > a && m.x - m.r - 2 < b);
          const rightX = heaviest.x + reach(heaviest) + 6;
          const leftX = heaviest.x - heaviest.r - 6;
          let place: { x: number; y: number; anchor: 'start' | 'end' } | null = null;
          if (free(heaviest.lane, rightX, rightX + w)) place = { x: rightX, y: y + 4, anchor: 'start' };
          else if (free(heaviest.lane, leftX - w, leftX)) place = { x: leftX, y: y + 4, anchor: 'end' };
          else if (heaviest.lane > 0 && free(heaviest.lane - 1, heaviest.x - 4, heaviest.x + w)) {
            place = { x: heaviest.x - 4, y: y - laneH / 2 + 2, anchor: 'start' };
          }
          return place ? (
            <text class="tl-callout" key={markKey(heaviest)} x={place.x} y={place.y} text-anchor={place.anchor}>
              {label}
            </text>
          ) : null;
        })()}
      </svg>

      {active && (
        <div class={`tl-tip${active.x > width * 0.7 ? ' is-left' : ''}`} role="status" style={{ left: `${active.x}px`, top: `${top + active.lane * laneH + 30}px` }}>
          <p class="tl-tip-head">
            <span class="num">{rangeLabel(active)}</span>
            <span class="law" data-law={active.category}>{CATEGORY_SHORT[active.category]}</span>
          </p>
          <p class="tl-tip-codes">
            {active.codes.slice(0, 6).join(', ')}
            {active.codes.length > 6 ? ` +${active.codes.length - 6}` : ''}
          </p>
          <p class="tl-tip-meta num">
            {active.count} {active.count === 1 ? 'obligation' : 'obligations'} - {STATE_LABEL[active.state].toLowerCase()}
            {active.exposure ? ` - ${money.both(active.exposure)} if 30 days late` : ''}
          </p>
        </div>
      )}

      <p id="tl-summary" class="visually-hidden" aria-live="polite">
        {cursor >= 0 && marks[cursor]
          ? `${rangeLabel(marks[cursor])}, ${CATEGORY_LABEL[marks[cursor].category]}: ${marks[cursor].codes.join(', ')}.`
          : `${marks.filter((m) => !m.beyond).length} marks across ${present.length} laws until ${formatDate(end)}.` +
            (heaviest ? ` Costliest: ${rangeLabel(heaviest)}, ${heaviest.codes.join(', ')}, ${money.both(heaviest.exposure)}.` : '')}
      </p>
    </div>
  );
}
