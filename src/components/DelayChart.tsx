import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useTeamState } from '../lib/client.ts';
import { delayGeometry, delaySeries, delaySummary } from '../lib/delay.ts';
import { delayCost } from '../lib/exposure.ts';
import { DEFAULT_CURRENCY, moneyFormat, type Fx } from '../lib/money.ts';
import type { Category, Exposure } from '../lib/types.ts';
import { MoneyContext, useMoneyFormat } from './Money.tsx';

interface Props {
  exposure: Exposure;
  category: Category;
  /** Days late to mark. Uncontrolled (starting at 30) when omitted. */
  days?: number;
  onDays?: (days: number) => void;
  maxDays?: number;
  /** Width used before the first measurement, and for the server render. */
  initialWidth?: number;
  /** Prefix for element ids, so two charts can share a page. */
  idp?: string;
  /** Rates for a chart outside an island that provides them (the entry pages). */
  fx?: Fx;
}

/** Fixed cost against days late: a slider, the figure, and the curve with a hover readout. */
export default function DelayChart({ exposure, category, days: daysProp, onDays, maxDays = 365, initialWidth = 360, idp = 'dc', fx }: Props) {
  const inherited = useMoneyFormat();
  const [team] = useTeamState();
  const money = useMemo(() => (fx ? moneyFormat(fx, team?.prefs.currency ?? DEFAULT_CURRENCY) : inherited), [fx, team?.prefs.currency, inherited]);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initialWidth);
  const [own, setOwn] = useState(30);
  const [hover, setHover] = useState<number | null>(null);
  const days = daysProp ?? own;
  const setDays = (d: number) => (onDays ? onDays(d) : setOwn(d));

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = width < 420 ? 156 : 196;
  const points = useMemo(() => delaySeries(exposure, maxDays), [exposure, maxDays]);
  const g = useMemo(() => delayGeometry(points, width, height, maxDays, (v) => money.ref(v, true) ?? money.inr(v, true)), [points, width, height, maxDays, money]);
  const cost = delayCost(exposure, days) ?? 0;
  const shown = hover ?? days;
  const shownCost = delayCost(exposure, shown) ?? 0;

  const dayAt = (e: PointerEvent) => {
    const svg = e.currentTarget as SVGElement;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * width;
    return Math.round(Math.min(maxDays, Math.max(1, ((px - g.left) / (g.right - g.left)) * maxDays)));
  };

  return (
    <MoneyContext.Provider value={money}>
    <div class="dchart" data-law={category} ref={wrap}>
      <div class="delay">
        <label class="label" for={`${idp}-days`}>Days late</label>
        <input id={`${idp}-days`} type="range" min={1} max={maxDays} value={days} onInput={(e) => setDays(Number((e.target as HTMLInputElement).value))} />
        <output for={`${idp}-days`} class="num">{days}</output>
      </div>
      <p class="fig delay-cost num">{money.ref(cost) ?? money.inr(cost)}{money.ref(cost) && <span class="money-inr"> ({money.inr(cost)})</span>}</p>
      <div class="dchart-plot">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Fixed cost of filing late: ${delaySummary(exposure, undefined, (v) => money.both(v, true))}.`}
          onPointerMove={(e) => {
            const d = dayAt(e);
            setHover(d);
            if (e.buttons === 1) setDays(d);
          }}
          onPointerDown={(e) => setDays(dayAt(e))}
          onPointerLeave={() => setHover(null)}
        >
          {g.yTicks.map((t) => (
            <g class="dchart-ytick">
              <line x1={g.left} x2={g.right} y1={t.y} y2={t.y} />
              <text x={g.left - 8} y={t.y + 4} text-anchor="end">{t.label}</text>
            </g>
          ))}
          {g.xTicks.map((t, i) => (
            <text class="dchart-xtick" x={t.x} y={height - 6} text-anchor={i === 0 ? 'start' : i === g.xTicks.length - 1 ? 'end' : 'middle'}>
              {t.label}
            </text>
          ))}
          <path class="dchart-area" d={g.area} />
          <path class="dchart-line" d={g.line} pathLength={1} />
          <g class="dchart-mark" style={{ transform: `translate(${g.x(days)}px, 0)` }}>
            <line x1={0} x2={0} y1={g.y(cost)} y2={g.bottom} />
            <circle cx={0} cy={g.y(cost)} r={5} />
          </g>
          {hover !== null && (
            <g class="dchart-hover">
              <line x1={g.x(hover)} x2={g.x(hover)} y1={g.top} y2={g.bottom} />
              <circle cx={g.x(hover)} cy={g.y(shownCost)} r={4} />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            class={`dchart-tip${g.x(hover) > width * 0.6 ? ' is-left' : ''}`}
            style={{ left: `${(g.x(hover) / width) * 100}%`, top: `${(g.y(shownCost) / height) * 100}%` }}
          >
            <span class="num">{shown} {shown === 1 ? 'day' : 'days'} late</span>
            <strong class="num">{money.ref(shownCost) ?? money.inr(shownCost)}</strong>
            {money.ref(shownCost) && <span class="num">{money.inr(shownCost)}</span>}
          </div>
        )}
      </div>
    </div>
    </MoneyContext.Provider>
  );
}
