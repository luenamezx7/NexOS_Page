'use client';

import { useEffect, useId, useState, type RefObject } from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '@/lib/utils';
import { useDocumentVisible } from '@/lib/use-document-visible';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './animated-beam.module.css';

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  repeat?: number;
  repeatDelay?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

/** Magic UI beam; gradients follow the node vector, including vertical connections. */
export function AnimatedBeam({ className, containerRef, fromRef, toRef, curvature = 0, reverse = false, pathColor = 'var(--primary)', pathWidth = 1.5, pathOpacity = .2, gradientStartColor = 'var(--visor-violet)', gradientStopColor = 'var(--detail-accent)', delay = 0, duration = 5, repeat = Infinity, repeatDelay = 1, startXOffset = 0, startYOffset = 0, endXOffset = 0, endYOffset = 0 }: AnimatedBeamProps) {
  const id = useId();
  const visible = useInView(containerRef, { amount: .05 });
  const documentVisible = useDocumentVisible();
  const reduce = usePrefersReducedMotion();
  const active = visible && documentVisible && !reduce;
  const [geometry, setGeometry] = useState({ width: 0, height: 0, startX: 0, startY: 0, endX: 0, endY: 0, d: '' });

  useEffect(() => {
    const container = containerRef.current, from = fromRef.current, to = toRef.current;
    if (!container || !from || !to) return;
    let frame = 0, disposed = false;
    const update = () => {
      if (disposed) return;
      const bounds = container.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height || !bounds.width || !bounds.height) return;
      const scaleX = bounds.width / width, scaleY = bounds.height / height;
      const round = (value: number) => Math.round(value * 100) / 100;
      const startX = round((a.left - bounds.left + a.width / 2) / scaleX + startXOffset);
      const startY = round((a.top - bounds.top + a.height / 2) / scaleY + startYOffset);
      const endX = round((b.left - bounds.left + b.width / 2) / scaleX + endXOffset);
      const endY = round((b.top - bounds.top + b.height / 2) / scaleY + endYOffset);
      const d = `M ${startX},${startY} Q ${(startX + endX) / 2},${(startY + endY) / 2 - curvature} ${endX},${endY}`;
      setGeometry(previous => previous.d === d && previous.width === width && previous.height === height ? previous : { width, height, startX, startY, endX, endY, d });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    [container, from, to].forEach(element => observer.observe(element));
    window.addEventListener('resize', schedule);
    void document.fonts.ready.then(() => { if (!disposed) schedule(); });
    schedule();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', schedule); };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  if (!geometry.width || !geometry.height) return null;
  const { width, height, d } = geometry;
  const startX = reverse ? geometry.endX : geometry.startX, startY = reverse ? geometry.endY : geometry.startY;
  const endX = reverse ? geometry.startX : geometry.endX, endY = reverse ? geometry.startY : geometry.endY;
  const dx = (endX - startX) * .3, dy = (endY - startY) * .3;

  return <svg className={cn(styles.beam, className)} width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true" data-animated-beam data-motion={active ? 'animated' : 'static'}>
    <path d={d} stroke={pathColor} strokeWidth={pathWidth} strokeOpacity={pathOpacity} strokeLinecap="round" />
    {active && <>
      <path d={d} stroke={`url(#${id})`} strokeWidth={pathWidth} strokeLinecap="round" />
      <defs><motion.linearGradient key={`${d}-${reverse}`} id={id} gradientUnits="userSpaceOnUse"
        initial={{ x1: startX - dx, y1: startY - dy, x2: startX, y2: startY }}
        animate={{ x1: [startX - dx, endX], y1: [startY - dy, endY], x2: [startX, endX + dx], y2: [startY, endY + dy] }}
        transition={{ delay, duration, repeat, repeatDelay, ease: [.16, 1, .3, 1] }}>
        <stop stopColor={gradientStartColor} stopOpacity="0" /><stop offset="20%" stopColor={gradientStartColor} /><stop offset="55%" stopColor={gradientStopColor} /><stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
      </motion.linearGradient></defs>
    </>}
  </svg>;
}
