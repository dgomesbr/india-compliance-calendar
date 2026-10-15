// Motion helpers for the islands. Every effect checks prefers-reduced-motion and
// leaves content visible if it never runs.

import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Tween a number toward its new value (figures, counts). Instant under reduced motion. */
export function useCountUp(value: number, duration = 520): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);
  useEffect(() => {
    if (reducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(2, -10 * k);
      const v = k >= 1 ? value : a + (value - a) * eased;
      setShown(v);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else from.current = value;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf.current);
      from.current = value;
    };
  }, [value]);
  return shown;
}

/**
 * FLIP for keyed children ([data-flip] elements inside the container): rows that
 * move glide from their old position, new rows rise in with a short stagger.
 */
export function useFlip(container: { current: HTMLElement | null }, deps: unknown[], { max = 120 } = {}): void {
  const prev = useRef(new Map<string, number>());
  const first = useRef(true);
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-flip]')).slice(0, max);
    const next = new Map<string, number>();
    const top0 = root.getBoundingClientRect().top;
    for (const el of els) next.set(el.dataset.flip!, el.getBoundingClientRect().top - top0);
    if (!reducedMotion() && !first.current && typeof Element !== 'undefined' && 'animate' in Element.prototype) {
      let fresh = 0;
      for (const el of els) {
        const key = el.dataset.flip!;
        const was = prev.current.get(key);
        const now = next.get(key)!;
        if (was === undefined) {
          el.animate(
            [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 320, delay: Math.min(fresh++ * 18, 260), easing: EASE_OUT, fill: 'backwards' },
          );
        } else if (Math.abs(was - now) > 1) {
          el.animate([{ transform: `translateY(${was - now}px)` }, { transform: 'none' }], { duration: 380, easing: EASE_OUT });
        }
      }
    }
    first.current = false;
    prev.current = next;
  }, deps);
}

/** Whether an element is on screen, for loops that should stop when it is not. */
export function useInView(ref: { current: Element | null }): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return seen;
}

/** Measure the selected child of a segmented control so a thumb can slide to it. */
export function useThumb(group: { current: HTMLElement | null }, selector: string, deps: unknown[]) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const g = group.current;
      const el = g?.querySelector<HTMLElement>(selector);
      if (!g || !el) return setBox(null);
      setBox({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' && group.current ? new ResizeObserver(measure) : null;
    if (ro && group.current) ro.observe(group.current);
    return () => ro?.disconnect();
  }, deps);
  return box;
}
