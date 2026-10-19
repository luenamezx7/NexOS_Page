'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import './GradualBlur.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const CURVES = {
  linear: (t: number) => t,
  bezier: (t: number) => t * t * (3 - 2 * t),
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - (1 - t) * (1 - t),
  'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

const DIRECTIONS = { top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' };

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const toLength = (value: string | number) =>
  typeof value === 'number' ? `${value}px` : value;

const toTime = (value: string | number) =>
  typeof value === 'number' ? `${value}s` : value;

const findScroller = (
  container: string | HTMLElement | { current: HTMLElement | null } | undefined,
  root: HTMLElement | null,
  target: string,
  vertical: boolean
): HTMLElement | Window | null => {
  if (container) {
    if (typeof container === 'string') return document.querySelector(container) as HTMLElement | null;
    return 'current' in container ? container.current : container;
  }
  if (target === 'page') return window;
  const parent = root?.parentElement;
  if (!parent) return null;
  if (!parent) return null;
  const scrolls = (node: Element) => {
    const style = getComputedStyle(node);
    return /(auto|scroll|overlay)/.test(vertical ? style.overflowY : style.overflowX);
  };
  const sibling = Array.from(parent.children).find((child) => child !== root && scrolls(child));
  return (sibling ?? (scrolls(parent) ? parent : null)) as HTMLElement | Window | null;
};

interface GradualBlurProps {
  position?: keyof typeof DIRECTIONS;
  target?: 'parent' | 'page';
  height?: string | number;
  width?: string | number;
  strength?: number;
  layers?: number;
  curve?: keyof typeof CURVES;
  exponential?: boolean;
  opacity?: number;
  saturation?: number;
  tint?: string;
  autoHide?: boolean;
  container?: string | HTMLElement | { current: HTMLElement | null };
  hoverIntensity?: number;
  duration?: number | string;
  easing?: string;
  zIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  hideAtSelector?: string;
}

export default function GradualBlur({
  position = 'bottom',
  target = 'parent',
  height = '6rem',
  width,
  strength = 2,
  layers = 8,
  curve = 'linear',
  exponential = true,
  opacity = 1,
  saturation = 1,
  tint = 'transparent',
  autoHide = false,
  container,
  hoverIntensity = 1,
  duration = 0.3,
  easing = 'ease-out',
  zIndex = 1000,
  className = '',
  style,
  hideAtSelector,
}: GradualBlurProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const edge = DIRECTIONS[position] ? position : 'bottom';
  const vertical = edge === 'top' || edge === 'bottom';

  const stack = useMemo(() => {
    const count = Math.min(Math.max(Math.round(layers) || 1, 1), 16);
    const shape = CURVES[curve] || CURVES.linear;
    const maxBlur = Math.max(strength, 0) * 12;
    const level = (u: number) => {
      const t = shape(clamp01(u));
      return maxBlur * (exponential ? (Math.pow(2, 4 * t) - 1) / 15 : t);
    };
    const boost = Math.pow(Math.max(saturation, 0), 1 / count);
    const fade = `${toTime(duration)} ${easing}`;
    const direction = DIRECTIONS[edge];
    const steps: React.CSSProperties[] = [];
    for (let i = 0; i < count; i++) {
      const from = level(i / count);
      const to = level((i + 1) / count);
      const radius = Math.sqrt(Math.max(to * to - from * from, 0));
      const filter = [
        `blur(calc(${radius.toFixed(3)}px * var(--gradual-blur-reveal, 1) * var(--gradual-blur-hover, 1)))`,
        boost !== 1 ? `saturate(calc(1 + ${(boost - 1).toFixed(4)} * var(--gradual-blur-reveal, 1)))` : '',
      ]
        .filter(Boolean)
        .join(' ');
      const mask = `linear-gradient(${direction}, transparent ${((i / count) * 100).toFixed(2)}%, #000 ${(((i + 1) / count) * 100).toFixed(2)}%)`;
      steps.push({
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
        maskImage: mask,
        WebkitMaskImage: mask,
        opacity,
        transition: `backdrop-filter ${fade}, -webkit-backdrop-filter ${fade}`,
      });
    }
    const stops = Array.from({ length: 9 }, (_, k) => {
      const u = k / 8;
      const t = shape(u);
      const alpha = t * t * t * (t * (t * 6 - 15) + 10);
      return `rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(u * 100).toFixed(1)}%`;
    }).join(', ');
    const tintMask = `linear-gradient(${direction}, ${stops})`;
    const wash =
      tint && tint !== 'transparent'
        ? ({
            position: 'absolute' as React.CSSProperties['position'],
            inset: 0,
            borderRadius: 'inherit',
            background: tint,
            maskImage: tintMask,
            WebkitMaskImage: tintMask,
            opacity: 'calc(var(--gradual-blur-reveal, 1) * min(var(--gradual-blur-hover, 1), 1))',
            transition: `opacity ${fade}`,
          } as React.CSSProperties)
        : null;
    return { steps, wash };
  }, [
    layers,
    curve,
    strength,
    exponential,
    saturation,
    duration,
    easing,
    edge,
    opacity,
    tint,
  ]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const rootEl = root as HTMLElement;

    if (!autoHide) {
      rootEl.style.removeProperty('--gradual-blur-reveal');
      return undefined;
    }
    const scroller = findScroller(container, rootEl, target, vertical);
    if (!scroller) return undefined;
    const element = scroller instanceof Element ? scroller : null;
    if (!element && scroller !== window) return undefined;
    const start = edge === 'top' || edge === 'left';

    const update = () => {
      const page = document.documentElement;
      const offset = element
        ? vertical
          ? element.scrollTop
          : element.scrollLeft
        : vertical
          ? window.scrollY
          : window.scrollX;
      const limit = element
        ? vertical
          ? element.scrollHeight - element.clientHeight
          : element.scrollWidth - element.clientWidth
        : vertical
          ? page.scrollHeight - window.innerHeight
          : page.scrollWidth - window.innerWidth;
      const box = rootEl.getBoundingClientRect();
      const reach = Math.max(vertical ? box.height : box.width, 1);
      const room = start ? offset : limit - offset;
      rootEl.style.setProperty('--gradual-blur-reveal', clamp01(room / reach).toFixed(3));
    };

    update();
    const source = element ?? window;
    source.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = element && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (observer && element) {
      observer.observe(element);
      if (element.firstElementChild) observer.observe(element.firstElementChild);
    }
    return () => {
      source.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [autoHide, container, target, edge, vertical]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || hoverIntensity === 1) return undefined;
    let frame = 0;
    let inside = false;
    let point: { x: number; y: number } | null = null;

    const check = () => {
      frame = 0;
      if (!point) return;
      const box = root.getBoundingClientRect();
      const now =
        point.x >= box.left &&
        point.x <= box.right &&
        point.y >= box.top &&
        point.y <= box.bottom;
      if (now === inside) return;
      inside = now;
      root.style.setProperty('--gradual-blur-hover', inside ? String(Math.max(hoverIntensity, 0)) : '1');
    };

    const onMove = (event: PointerEvent) => {
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(check);
    };

    const onLeave = () => {
      point = null;
      inside = false;
      root.style.setProperty('--gradual-blur-hover', '1');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      root.style.removeProperty('--gradual-blur-hover');
    };
  }, [hoverIntensity]);

  useEffect(() => {
    const root = rootRef.current;
    const selector = hideAtSelector;
    if (!root || !selector) return;
    const target = document.querySelector(selector);
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        root.dataset.hidden = String(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hideAtSelector]);

  const depth = toLength(vertical ? height : width ?? height);
  const span = vertical && width != null ? toLength(width) : null;

  const rounded = target !== 'page' && !span;
  const corner = (a: string, b: string) =>
    rounded && (edge === a || edge === b) ? 'inherit' : undefined;

  const rootStyle: React.CSSProperties = {
    position: target === 'page' ? 'fixed' : 'absolute',
    zIndex,
    borderTopLeftRadius: corner('top', 'left'),
    borderTopRightRadius: corner('top', 'right'),
    borderBottomLeftRadius: corner('bottom', 'left'),
    borderBottomRightRadius: corner('bottom', 'right'),
    top: edge === 'bottom' ? undefined : 0,
    bottom: edge === 'top' ? undefined : 0,
    left: edge === 'right' ? undefined : 0,
    right: edge === 'left' ? undefined : 0,
    height: vertical ? depth : undefined,
    width: vertical ? (span ?? undefined) : depth,
    marginInline: span ? 'auto' : undefined,
    ...style,
  };

  return (
    <div
      ref={rootRef}
      className={`gradual-blur ${className}`.trim()}
      style={rootStyle}
      aria-hidden="true"
    >
      {stack.steps.map((layer, index) => (
        <div key={index} style={layer} />
      ))}
      {stack.wash && <div style={stack.wash} />}
    </div>
  );
}
