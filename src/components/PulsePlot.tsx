import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { daysInMonth, formatDate, iso, MONTHS_SHORT, parts, shiftMonth, type ISODate } from '../lib/dates.ts';
import { formatINR } from '../lib/exposure.ts';
import type { Row } from '../lib/view.ts';

interface Props {
  rows: Row[];
  today: ISODate;
  to: ISODate;
  selected: ISODate | null;
  onPick: (date: ISODate | null) => void;
}

interface Peak {
  date: ISODate;
  row: number;
  day: number;
  count: number;
  exposure: number;
  codes: string[];
  overdue: boolean;
  soon: boolean;
  extended: boolean;
  amp: number;
}

// Drawing space: a narrower one on phones keeps labels legible when scaled down.
const WIDE = { W: 1000, X0: 70, X1: 988 };
const NARROW = { W: 430, X0: 50, X1: 418 };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export default function PulsePlot({ rows, today, to, selected, onPick }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [cursor, setCursor] = useState<number>(-1);
  const [hover, setHover] = useState<number>(-1);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { W, X0, X1 } = narrow ? NARROW : WIDE;
  const xOf = (day: number) => X0 + ((day - 1) / 30) * (X1 - X0);

  const model = useMemo(() => {
    const t = parts(today);
    const end = parts(to);
    let first = { y: t.y, m: t.m };
    // Overdue items earlier than this month pull the plot back to show them.
    for (const r of rows) {
      if (r.state !== 'overdue') continue;
      const p = parts(r.occ.due);
      if (p.y * 12 + p.m < first.y * 12 + first.m) first = { y: p.y, m: p.m };
    }
    // Rows cover the horizon and any context rows passed in beyond it.
    let last = end;
    for (const r of rows) {
      const p = parts(r.occ.due);
      if (p.y * 12 + p.m > last.y * 12 + last.m) last = { y: p.y, m: p.m, d: p.d };
    }
    const horizonSpan = (end.y * 12 + end.m) - (first.y * 12 + first.m) + 1;
    const span = Math.max(horizonSpan, Math.min((last.y * 12 + last.m) - (first.y * 12 + first.m) + 1, 5));
    const minRows = narrow ? 3 : 5;
    const maxRows = narrow ? 8 : 25;
    const count = Math.min(maxRows, Math.max(minRows, span));
    const months = Array.from({ length: count }, (_, i) => shiftMonth(first.y, first.m, i));
    const index = new Map(months.map((m, i) => [`${m.y}-${m.m}`, i]));
    const gap = count <= 6 ? 30 : count <= 12 ? 22 : 15;
    const top = Math.round(gap * 3.1) + 18;
    const height = top + count * gap + 14;

    const byDate = new Map<ISODate, Peak>();
    for (const r of rows) {
      const p = parts(r.occ.due);
      const row = index.get(`${p.y}-${p.m}`);
      if (row === undefined) continue;
      let peak = byDate.get(r.occ.due);
      if (!peak) {
        peak = { date: r.occ.due, row, day: p.d, count: 0, exposure: 0, codes: [], overdue: false, soon: false, extended: false, amp: 0 };
        byDate.set(r.occ.due, peak);
      }
      peak.count++;
      peak.exposure += r.exposure;
      if (peak.codes.length < 8) peak.codes.push(r.rule.code);
      if (r.state === 'overdue') peak.overdue = true;
      if (r.state === 'soon') peak.soon = true;
      if (r.occ.extended) peak.extended = true;
    }
    const peaks = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const pk of peaks) {
      pk.amp = gap * Math.min(3.1, 0.8 + 0.45 * Math.log10(1 + pk.exposure / 1000) + 0.35 * Math.log2(pk.count));
    }

    const paths = months.map((mo, i) => {
      const base = top + i * gap + gap;
      const last = daysInMonth(mo.y, mo.m);
      const mine = peaks.filter((pk) => pk.row === i);
      const bumps: { c: number; a: number; s: number }[] = [];
      for (const pk of mine) {
        const seed = hash(pk.date + pk.codes.join());
        bumps.push({ c: pk.day, a: pk.amp, s: 0.26 });
        if (pk.count >= 2) bumps.push({ c: pk.day - 0.2 - seed * 0.08, a: pk.amp * 0.46, s: 0.12 });
        if (pk.count >= 3) bumps.push({ c: pk.day + 0.22 + seed * 0.1, a: pk.amp * 0.38, s: 0.1 });
        if (pk.count >= 5) bumps.push({ c: pk.day + 0.45, a: pk.amp * 0.22, s: 0.08 });
      }
      const pts: string[] = [];
      for (let d = 1; d <= last + 0.0001; d += 0.1) {
        let y = base;
        for (const b of bumps) {
          const k = (d - b.c) / b.s;
          if (k > -6 && k < 6) y -= b.a * Math.exp(-0.5 * k * k);
        }
        pts.push(`${xOf(d).toFixed(1)},${y.toFixed(1)}`);
      }
      const line = `M${pts.join('L')}`;
      const fill = `${line}L${xOf(last).toFixed(1)},${base + gap}L${X0},${base + gap}Z`;

      // Lit span: the part of this month inside [today, to].
      const mStart = iso(mo.y, mo.m, 1);
      const mEnd = iso(mo.y, mo.m, last);
      let lit: [number, number] | null = null;
      if (mEnd >= today && mStart <= to) {
        const a = mStart < today ? parts(today).d : 1;
        const b = mEnd > to ? parts(to).d : last;
        lit = [xOf(a) - 4, xOf(b) + 4];
      }
      return { mo, base, line, fill, lit, last };
    });

    const dayCounts = new Map<number, number>();
    for (const pk of peaks) dayCounts.set(pk.day, (dayCounts.get(pk.day) ?? 0) + pk.count);
    const ticks = [...dayCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, narrow ? 4 : 7)
      .map(([d]) => d)
      .sort((a, b) => a - b);

    return { months, peaks, paths, gap, top, height, ticks, index };
  }, [rows, today, to, narrow]);

  const { peaks, paths, gap, top, height, ticks } = model;
  const todayRow = model.index.get(`${parts(today).y}-${parts(today).m}`);
  const active = hover >= 0 ? peaks[hover] : cursor >= 0 ? peaks[cursor] : null;
  const activeRow = active ? active.row : selected ? peaks.find((p) => p.date === selected)?.row ?? -1 : -1;

  const heaviest = peaks.reduce<Peak | null>((m, p) => (!m || p.exposure > m.exposure ? p : m), null);
  const summary = peaks.length
    ? `${peaks.length} due dates between ${formatDate(paths[0] ? iso(paths[0].mo.y, paths[0].mo.m, 1) : today)} and ${formatDate(to)}.` +
      (heaviest ? ` Heaviest: ${formatDate(heaviest.date)}, ${heaviest.count} obligations, ${formatINR(heaviest.exposure)} at 30 days.` : '')
    : 'No obligations fall due in this horizon.';

  const onKey = (e: KeyboardEvent) => {
    if (!peaks.length) return;
    const cur = cursor < 0 ? 0 : cursor;
    let next = cur;
    if (e.key === 'ArrowRight') next = Math.min(peaks.length - 1, cur + (cursor < 0 ? 0 : 1));
    else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      const p = peaks[cur];
      const candidates = peaks.filter((q) => q.row === p.row + dir);
      if (candidates.length) {
        const best = candidates.reduce((m, q) => (Math.abs(q.day - p.day) < Math.abs(m.day - p.day) ? q : m));
        next = peaks.indexOf(best);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (cursor >= 0) onPick(peaks[cursor].date === selected ? null : peaks[cursor].date);
      return;
    } else if (e.key === 'Escape') {
      setCursor(-1);
      onPick(null);
      return;
    } else return;
    e.preventDefault();
    setCursor(next);
  };

  return (
    <div class="pulse" ref={wrap}>
      <svg
        class="pulse-svg"
        viewBox={`0 0 ${W} ${height}`}
        role="application"
        aria-roledescription="pulse plot"
        aria-label="Obligations by day. Use arrow keys to move between due dates, Enter to filter the list to one date."
        aria-describedby="pulse-summary"
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setCursor(-1)}
      >
        <defs>
          {paths.map((p, i) =>
            p.lit ? (
              <clipPath id={`lit-${i}`}>
                <rect x={p.lit[0]} y={0} width={Math.max(0, p.lit[1] - p.lit[0])} height={height} />
              </clipPath>
            ) : null,
          )}
          <clipPath id="plot-area">
            <rect x={X0} y={0} width={X1 - X0} height={height} />
          </clipPath>
          <linearGradient id="traverse" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="#f2f2f0" stop-opacity="0" />
            <stop offset="0.5" stop-color="#f2f2f0" stop-opacity="0.16" />
            <stop offset="1" stop-color="#f2f2f0" stop-opacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((d) => (
          <g class="pulse-tick">
            <line x1={xOf(d)} x2={xOf(d)} y1={14} y2={20} />
            <text x={xOf(d)} y={10} text-anchor="middle">{d}</text>
          </g>
        ))}

        {paths.map((p, i) => (
          <g class={`pulse-row${i === activeRow ? ' is-active' : ''}${p.lit ? ' has-lit' : ''}`}>
            <path d={p.fill} class="pulse-fill" />
            <path d={p.line} class="pulse-line dim" />
            {p.lit && <path d={p.line} class="pulse-line lit" clip-path={`url(#lit-${i})`} />}
            <text x={X0 - 14} y={p.base + 3} text-anchor="end" class="pulse-month">
              {`${MONTHS_SHORT[p.mo.m - 1].toUpperCase()} ${String(p.mo.y).slice(2)}`}
            </text>
          </g>
        ))}

        {peaks.map((pk) => {
          const base = top + pk.row * gap + gap;
          const cls = pk.overdue ? 'overdue' : pk.soon ? 'soon' : pk.extended ? 'extended' : '';
          return cls ? <rect class={`pulse-mark ${cls}`} x={xOf(pk.day) - 2.5} y={base + 3} width={5} height={5} /> : null;
        })}

        {todayRow !== undefined && (
          <g class="pulse-today">
            <line
              x1={xOf(parts(today).d)}
              x2={xOf(parts(today).d)}
              y1={top + todayRow * gap + gap - gap * 2.4}
              y2={top + todayRow * gap + gap + 10}
            />
            <text x={xOf(parts(today).d) + 6} y={top + todayRow * gap + gap - gap * 2.4 + 8}>TODAY</text>
          </g>
        )}

        {peaks.map((pk, i) => {
          const base = top + pk.row * gap + gap;
          const isSel = pk.date === selected;
          const isCur = i === cursor;
          return (
            <g
              class={`pulse-hit${isSel ? ' is-selected' : ''}${isCur ? ' is-cursor' : ''}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onClick={() => onPick(isSel ? null : pk.date)}
            >
              <rect x={xOf(pk.day) - 9} y={base - pk.amp - 6} width={18} height={pk.amp + 14} />
              {(isSel || isCur) && <rect class="pulse-ring" x={xOf(pk.day) - 7} y={base - pk.amp - 4} width={14} height={pk.amp + 10} />}
            </g>
          );
        })}

        <g clip-path="url(#plot-area)">
          <rect class="pulse-traverse" style={{ '--sweep': `${X1 - X0 + 160}px` }} x={X0 - 160} y={0} width={160} height={height} fill="url(#traverse)" />
        </g>
      </svg>

      {active && (
        <div
          class="pulse-tip"
          role="status"
          style={{
            left: `${(xOf(active.day) / W) * 100}%`,
            top: `${((top + active.row * gap + gap - active.amp) / height) * 100}%`,
          }}
        >
          <p class="caps">{formatDate(active.date)}</p>
          <p class="pulse-tip-codes">{active.codes.join('  ')}{active.count > active.codes.length ? `  +${active.count - active.codes.length}` : ''}</p>
          <p class="pulse-tip-meta num">
            {active.count} {active.count === 1 ? 'obligation' : 'obligations'}
            {active.exposure ? `, ${formatINR(active.exposure)} at 30 days` : ''}
          </p>
        </div>
      )}
      <p id="pulse-summary" class="visually-hidden" aria-live="polite">
        {cursor >= 0 && peaks[cursor]
          ? `${formatDate(peaks[cursor].date)}: ${peaks[cursor].count} obligations, ${peaks[cursor].codes.join(', ')}.`
          : summary}
      </p>
    </div>
  );
}
