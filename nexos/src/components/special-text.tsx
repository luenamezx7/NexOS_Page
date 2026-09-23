"use client";

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

interface SpecialTextProps {
  children: string;
  speed?: number;
  delay?: number;
  className?: string;
  inView?: boolean;
  once?: boolean;
}
const CHARS = '_!X$0-+*#';

export function SpecialText({ children, speed = 20, delay = 0, className = '', inView = false, once = true }: SpecialTextProps) {
  const container = useRef<HTMLSpanElement>(null);
  const visible = useInView(container, { once, margin: '-100px' });
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState<{ source: string; text: string } | null>(null);
  const active = !inView || visible;
  useEffect(() => {
    if (!active || reduce) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    let step = 0;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        step += 1;
        const revealed = Math.max(0, Math.floor((step - children.length) / 2));
        const text = children.split('').map((char, index) => char === ' ' || index < revealed ? char : CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
        setFrame({ source: children, text });
        if (revealed >= children.length) clearInterval(interval);
      }, Math.max(16, speed));
    }, Math.max(0, delay * 1000));
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [active, reduce, children, speed, delay]);
  return <span ref={container} className={`h-4.5 leading-5 inline-flex font-mono font-medium ${className}`} aria-label={children}><span aria-hidden="true">{reduce || frame?.source !== children ? children : frame.text}</span></span>;
}
