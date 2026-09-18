'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';

const HOLD_MS = 1500;
const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const SCRAMBLE_CHARS = '_!X$0-+*#';

interface HoldButtonProps {
  label: string;
  ariaLabel: string;
  hintId: string;
  onConfirm: () => void;
  className?: string;
  featured?: boolean;
}

export function HoldButton({ label, ariaLabel, hintId, onConfirm, className = '', featured = false }: HoldButtonProps) {
  const progress = useMotionValue(0);
  const holdingRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const confirmRef = useRef(onConfirm);
  const reduce = useReducedMotion() ?? false;

  // --- hover scramble (fixed, sem bugar) ---
  const [display, setDisplay] = useState<string>(label);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScramblingRef = useRef<boolean>(false);

  useEffect(() => {
    setDisplay(label);
  }, [label]);

  useEffect(() => {
    return () => {
      if (scrambleRef.current) clearInterval(scrambleRef.current);
    };
  }, []);

  const triggerScramble = useCallback(() => {
    if (reduce || isScramblingRef.current) return;
    isScramblingRef.current = true;
    if (scrambleRef.current) clearInterval(scrambleRef.current);

    let frame = 0;
    const totalFrames = 14;
    const baseLabel = label;

    scrambleRef.current = setInterval(() => {
      frame += 1;
      const progressRatio = frame / totalFrames;
      // revela gradualmente do início ao fim, sem blank inicial
      const revealed = Math.floor(progressRatio * baseLabel.length);

      const next = baseLabel
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < revealed) return baseLabel[i];
          // 70% chance de mostrar char aleatório, 30% mantém original para não piscar demais
          return Math.random() > 0.3
            ? SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
            : baseLabel[i];
        })
        .join('');

      setDisplay(next);

      if (frame >= totalFrames) {
        if (scrambleRef.current) clearInterval(scrambleRef.current);
        scrambleRef.current = null;
        setDisplay(baseLabel);
        // debounce: libera após 350ms para não retriggerar se mouse tremer dentro do botão
        setTimeout(() => {
          isScramblingRef.current = false;
        }, 350);
      }
    }, 28);
  }, [label, reduce]);

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
      onContextMenu={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
      onHoverStart={triggerScramble}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.3, ease: FLUID_EASE }}
      className={`btn-primary-nex touch-pan-y select-none ${featured ? 'btn-primary-nex--featured' : ''} ${className}`}
    >
      <span className="relative z-10 inline-flex min-h-[1.25em] min-w-0 items-center break-words text-center font-medium">
        {display}
      </span>
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
