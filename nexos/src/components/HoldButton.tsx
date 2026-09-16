'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';
import { SpecialText } from './special-text';

const HOLD_MS = 1500;
const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface HoldButtonProps {
  label: string;
  ariaLabel: string;
  hintId: string;
  onConfirm: () => void;
  className?: string;
  featured?: boolean;
}

export function HoldButton({ label, ariaLabel, hintId, onConfirm, className = '', featured = false }: HoldButtonProps) {
  const [scrambleKey, setScrambleKey] = useState<number>(0);
  const progress = useMotionValue(0);
  const holdingRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const confirmRef = useRef(onConfirm);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    confirmRef.current = onConfirm;
  }, [onConfirm]);

  const cancelHold = useCallback(() => {
    holdingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    progress.set(0);
  }, [progress]);

  const finishHold = useCallback(() => {
    holdingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    progress.set(0);
    confirmRef.current();
  }, [progress]);

  const startHold = useCallback(() => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    startRef.current = performance.now();
    const tick = (now: number): void => {
      if (!holdingRef.current) return;
      const p: number = Math.min((now - startRef.current) / HOLD_MS, 1);
      progress.set(p);
      if (p >= 1) {
        finishHold();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [finishHold, progress]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      aria-describedby={hintId}
      onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        startHold();
      }}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onLostPointerCapture={cancelHold}
      onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') cancelHold();
      }}
      onHoverStart={() => setScrambleKey((k: number) => k + 1)}
      onContextMenu={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.3, ease: FLUID_EASE }}
      className={`btn-primary-nex touch-none select-none ${featured ? 'btn-primary-nex--featured' : ''} ${className}`}
    >
      <SpecialText key={scrambleKey} speed={30} className="relative z-10">
        {label}
      </SpecialText>
      <span className="shimmer-sweep" aria-hidden="true" />
      <motion.span
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="hold-bar absolute bottom-0 left-0 z-10 h-[3px] w-full origin-left bg-white will-change-transform"
      />
    </motion.button>
  );
}

export default HoldButton;
