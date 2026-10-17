'use client';

// React Bits / Ansh Dhanani. Typed adaptation of the layered edge-blur API.
import { useEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react';
import './GradualBlur.css';

const CURVES = {
  linear: (t: number) => t,
  bezier: (t: number) => t * t * (3 - 2 * t),
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - (1 - t) ** 2,
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
};
const DIRECTIONS = { top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' };
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const length = (n: string | number) => typeof n === 'number' ? `${n}px` : n;

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
  container?: string | HTMLElement | RefObject<HTMLElement | null>;
  hoverIntensity?: number;
  duration?: number | string;
  easing?: string;
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
  hideAtSelector?: string;
}

export default function GradualBlur({
  position = 'bottom', target = 'parent', height = '6rem', width,
  strength = 2, layers = 8, curve = 'linear', exponential = true,
  opacity = 1, saturation = 1, tint = 'transparent', autoHide = false,
  container, hoverIntensity = 1, duration = 0.3, easing = 'ease-out',
  zIndex = 1, className = '', style, hideAtSelector,
}: GradualBlurProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const vertical = position === 'top' || position === 'bottom';
  const fade = `${typeof duration === 'number' ? `${duration}s` : duration} ${easing}`;
  const stack = useMemo(() => {
    const count = Math.min(16, Math.max(1, Math.round(layers)));
    const level = (u: number) => {
      const t = CURVES[curve](clamp(u));
      return Math.max(strength, 0) * 12 * (exponential ? (2 ** (4 * t) - 1) / 15 : t);
    };
    return Array.from({ length: count }, (_, i): CSSProperties => {
      const radius = Math.sqrt(Math.max(0, level((i + 1) / count) ** 2 - level(i / count) ** 2));
      const filter = `blur(calc(${radius.toFixed(3)}px * var(--gradual-blur-reveal, 1) * var(--gradual-blur-hover, 1))) saturate(${Math.max(0, saturation) ** (1 / count)})`;
      const mask = `linear-gradient(${DIRECTIONS[position]}, transparent ${i / count * 100}%, #000 ${(i + 1) / count * 100}%)`;
      return { position: 'absolute', inset: 0, backdropFilter: filter, WebkitBackdropFilter: filter,
        maskImage: mask, WebkitMaskImage: mask, opacity, transition: `backdrop-filter ${fade}` };
    });
  }, [layers, curve, strength, exponential, saturation, position, opacity, fade]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let source: Element | Window = window;
    if (container) {
      const resolved = typeof container === 'string' ? document.querySelector(container) : 'current' in container ? container.current : container;
      if (resolved) source = resolved;
    } else if (target === 'parent' && root.parentElement) {
      const parent = root.parentElement;
      source = [...parent.children].find(child => child !== root && /(auto|scroll)/.test(vertical ? getComputedStyle(child).overflowY : getComputedStyle(child).overflowX)) ?? parent;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = source instanceof Element ? source : null;
      const offset = element ? vertical ? element.scrollTop : element.scrollLeft : vertical ? window.scrollY : window.scrollX;
      const limit = element ? vertical ? element.scrollHeight - element.clientHeight : element.scrollWidth - element.clientWidth : vertical ? document.documentElement.scrollHeight - innerHeight : document.documentElement.scrollWidth - innerWidth;
      const box = root.getBoundingClientRect();
      const room = position === 'top' || position === 'left' ? offset : limit - offset;
      const reveal = autoHide ? clamp(room / Math.max(1, vertical ? box.height : box.width)) : 1;
      root.style.setProperty('--gradual-blur-reveal', reveal.toFixed(3));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    source.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(source instanceof Element ? source : document.body);
    const hideTarget = hideAtSelector ? document.querySelector(hideAtSelector) : null;
    const observer = hideTarget ? new IntersectionObserver(([entry]) => {
      root.dataset.hidden = String(entry.isIntersecting);
    }) : null;
    if (hideTarget) observer?.observe(hideTarget);
    return () => {
      cancelAnimationFrame(frame);
      source.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resize.disconnect(); observer?.disconnect();
    };
  }, [autoHide, container, target, position, vertical, hideAtSelector]);

  useEffect(() => {
    if (hoverIntensity === 1) return;
    const root = rootRef.current;
    if (!root) return;
    const move = (event: PointerEvent) => {
      const box = root.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      root.style.setProperty('--gradual-blur-hover', inside ? String(Math.max(0, hoverIntensity)) : '1');
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [hoverIntensity]);

  return <div ref={rootRef} aria-hidden="true" data-position={position} className={`gradual-blur ${className}`} style={{
    position: target === 'page' ? 'fixed' : 'absolute', zIndex,
    top: position === 'bottom' ? undefined : 0, bottom: position === 'top' ? undefined : 0,
    left: position === 'right' ? undefined : 0, right: position === 'left' ? undefined : 0,
    height: vertical ? length(height) : undefined, width: vertical ? width == null ? undefined : length(width) : length(width ?? height),
    marginInline: vertical && width != null ? 'auto' : undefined, transition: `opacity ${fade}`, ...style,
  }}>
    {stack.map((layer, i) => <div key={i} style={layer} />)}
    {tint !== 'transparent' && <div className="gradual-blur-tint" style={{ background: tint, maskImage: `linear-gradient(${DIRECTIONS[position]}, transparent, #000)`, opacity: 'var(--gradual-blur-reveal, 1)' }} />}
  </div>;
}
