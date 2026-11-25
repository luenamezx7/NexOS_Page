'use client';

import { useEffect, useRef } from 'react';
import { createSilkBackground } from './silk-background-engine';
import { getPresentationRuntime } from '../ui/presentation-runtime';
import styles from './ClientPortalSurface.module.css';

export function SilkBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dialog = canvas.closest<HTMLDialogElement>('[data-presentation]');
    if (dialog && getPresentationRuntime(dialog)) return;
    return createSilkBackground(canvas).dispose;
  }, []);
  return <canvas ref={ref} suppressHydrationWarning className={styles.canvas} aria-hidden="true" data-silk-background data-silk-state="idle" />;
}
