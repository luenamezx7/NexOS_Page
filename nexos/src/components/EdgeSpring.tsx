'use client';

import { useEffect, useRef } from 'react';
import { createEdgeSpring } from '@/lib/edge-spring';
import { useScrollContext } from './SmoothScrollProvider';

/** Reveal real scroll space beyond an edge, then scroll it closed with a spring. */
export function EdgeSpring() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const { lenis } = useScrollContext();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.landing-page');
    const spacer = spacerRef.current;
    if (!root || !spacer) return;
    const html = document.documentElement;
    const previousOverscroll = html.style.overscrollBehaviorY;
    const previousAnchoring = html.style.overflowAnchor;
    html.style.overscrollBehaviorY = 'none';
    html.style.overflowAnchor = 'none';
    root.dataset.edgeSpring = 'ready';
    type Edge = 'top' | 'bottom';
    const states = {
      top: { position: 0, velocity: 0, time: 0 },
      bottom: { position: 0, velocity: 0, time: 0 },
    };
    let active: Edge | null = null;
    let reserve = 0;
    let normalEnd = 0;
    let raf = 0;
    let inputFrame = 0;
    let displayedOffset = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let touch: { x: number; y: number } | null = null;
    let closing: HTMLElement | null = null;
    let surface: HTMLElement | null = null;
    let closingHeight = '';
    let surfaceHeight = '';

    const scroll = (y: number) => window.scrollTo({ top: y, behavior: 'instant' });
    const finish = () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(inputFrame);
      inputFrame = 0;
      if (!active) return;
      const edge = active;
      active = null;
      spacer.style.height = '0px';
      if (closing && surface) {
        closing.style.height = closingHeight;
        surface.style.height = surfaceHeight;
      }
      closing = surface = null;
      states[edge].position = states[edge].velocity = 0;
      root.style.setProperty(`--edge-${edge}`, '0px');
      scroll(edge === 'top' ? 0 : normalEnd);
      lenis?.resize();
      root.dataset.edgeSpring = 'ready';
    };
    const blocked = () => document.hidden || lenis?.isStopped || Boolean(document.querySelector('dialog[open]')) || document.body.style.overflow === 'hidden';
    const begin = (edge: Edge) => {
      normalEnd = Math.max(0, html.scrollHeight - innerHeight);
      displayedOffset = 0;
      reserve = innerHeight / 2;
      if (edge === 'bottom') {
        closing = document.getElementById('brand-closing');
        surface = closing?.querySelector<HTMLElement>('[data-edge-surface]') ?? null;
        if (!closing || !surface) return false;
        closingHeight = closing.style.height;
        surfaceHeight = surface.style.height;
        const height = closing.getBoundingClientRect().height;
        surface.style.height = `${height}px`;
        closing.style.height = `${height + reserve}px`;
      } else {
        spacer.style.height = `${reserve}px`;
      }
      active = edge;
      root.dataset.edgeSpring = edge;
      return true;
    };
    const paint = (edge: Edge, position: number, firstPull = false) => {
      const value = Math.max(0, Math.min(reserve, position));
      states[edge].position = value;
      const offset = Math.min(reserve, Math.round(value));
      if (!firstPull && offset === displayedOffset) return;
      displayedOffset = offset;
      // Diagnostics only. Motion uses the native scroll offset.
      root.style.setProperty(`--edge-${edge}`, `${offset}px`);
      const target = edge === 'top' ? reserve - offset : normalEnd + offset;
      if (firstPull && lenis) {
        lenis.resize();
        lenis.scrollTo(target, { immediate: true, force: true });
      } else scroll(target);
    };
    const release = () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      if (!active) return;
      const edge = active;
      const state = states[edge];
      if (!state.position || blocked()) { finish(); return; }
      const velocity = performance.now() - state.time < 100 ? state.velocity : 0;
      const solver = createEdgeSpring(state.position, 0, velocity);
      const start = performance.now();
      const frame = (now: number) => {
        if (blocked()) { finish(); return; }
        const sample = solver.next(now - start);
        if (sample.done || sample.value < .5) { finish(); return; }
        paint(edge, sample.value);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    const ownsGesture = (target: EventTarget | null) => {
      if (!(target instanceof Element) || !root.contains(target)) return false;
      if (target.closest('header, dialog, input, textarea, select, [contenteditable="true"], [data-lenis-prevent], [role="slider"]')) return false;
      for (let node = target; node !== root && node.parentElement; node = node.parentElement) {
        const css = getComputedStyle(node);
        if (/(auto|scroll)/.test(css.overflowY) && node.scrollHeight > node.clientHeight + 1) return false;
        if (/(auto|scroll)/.test(css.overflowX) && node.scrollWidth > node.clientWidth + 1) return false;
      }
      return true;
    };
    const pull = (delta: number, target: EventTarget | null) => {
      if (!delta) return false;
      const edge = active ?? (delta < 0
        ? (scrollY <= 1 ? 'top' : null)
        : (scrollY >= html.scrollHeight - innerHeight - 1 ? 'bottom' : null));
      if (!edge || blocked() || !ownsGesture(target)) return false;
      const firstPull = active === null;
      if (firstPull && !begin(edge)) return false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      const state = states[edge];
      const now = performance.now();
      // Rubber-band resistance, independent of wheel/touch packet sizes.
      const distance = state.position * reserve / (.55 * Math.max(1, reserve - state.position));
      const drag = Math.max(0, distance + (edge === 'top' ? -delta : delta));
      const next = .55 * drag * reserve / (reserve + .55 * drag);
      const velocity = Math.max(-650, Math.min(650, (next - state.position) / Math.max(16, now - state.time) * 1000));
      state.velocity = state.velocity * .65 + velocity * .35;
      state.time = now;
      state.position = next;
      if (!next) finish();
      else if (firstPull) paint(edge, next, true);
      else if (!inputFrame) inputFrame = requestAnimationFrame(() => {
        inputFrame = 0;
        if (active === edge) paint(edge, state.position);
      });
      return true;
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (!event.cancelable || !pull(delta, event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      timer = setTimeout(release, 90);
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) { touch = null; release(); return; }
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };
    const touchMove = (event: TouchEvent) => {
      if (!touch || event.touches.length !== 1) return;
      const point = event.touches[0];
      const dy = touch.y - point.clientY;
      const dx = touch.x - point.clientX;
      touch = { x: point.clientX, y: point.clientY };
      if (Math.abs(dx) >= Math.abs(dy) || !event.cancelable || !pull(dy, event.target)) return;
      event.preventDefault();
    };
    const touchEnd = () => { touch = null; release(); };
    window.addEventListener('wheel', wheel, { passive: false, capture: true });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', touchEnd);
    window.addEventListener('touchcancel', touchEnd);
    window.addEventListener('blur', finish);
    window.addEventListener('resize', finish);
    window.addEventListener('keydown', finish, true);
    document.addEventListener('click', finish, true);
    document.addEventListener('visibilitychange', finish);
    document.addEventListener('nexos-entry-change', finish);
    return () => {
      finish();
      html.style.overscrollBehaviorY = previousOverscroll;
      html.style.overflowAnchor = previousAnchoring;
      delete root.dataset.edgeSpring;
      root.style.removeProperty('--edge-top');
      root.style.removeProperty('--edge-bottom');
      window.removeEventListener('wheel', wheel, true);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', touchEnd);
      window.removeEventListener('touchcancel', touchEnd);
      window.removeEventListener('blur', finish);
      window.removeEventListener('resize', finish);
      window.removeEventListener('keydown', finish, true);
      document.removeEventListener('click', finish, true);
      document.removeEventListener('visibilitychange', finish);
      document.removeEventListener('nexos-entry-change', finish);
    };
  }, [lenis]);

  return <div ref={spacerRef} aria-hidden="true" data-edge-reserve="top" style={{ height: 0, overflowAnchor: 'none' }} />;
}
