'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { ArrowRight } from 'lucide-react';

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
  /** Progresso externo (0→1): permite animar elementos fora do botão junto ao hold. */
  progress?: MotionValue<number>;
  /** Camada de fundo (ex.: gradiente) — recortada no botão via overflow hidden. */
  background?: ReactNode;
  /** Brilho verde controlado pelo hold (exibido só dentro/fora do botão conforme wrapper). */
  affirm?: boolean;
}

export function HoldButton({ label, ariaLabel, hintId, onConfirm, className = '', featured = false, progress: progressProp, background, affirm = false }: HoldButtonProps) {
  const internalProgress = useMotionValue(0);
  const progress = progressProp ?? internalProgress;
  const boxShadow = useTransform(
    progress,
    [0, 1],
    [
      'inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 1px rgba(255, 92, 138,0.28), 0 10px 28px -10px rgba(255, 92, 138,0.55), 0 0 20px rgba(255, 92, 138,0.28)',
      'inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(16,185,129,0.55), 0 10px 28px -10px rgba(16,185,129,0.55), 0 0 22px rgba(16,185,129,0.45)',
    ],
  );
  const ringStyle = affirm ? ({ boxShadow } as const) : undefined;
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
      onFocus={triggerScramble}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: FLUID_EASE }}
      style={ringStyle}
      className={`btn-primary-nex group touch-pan-y select-none rounded-full !py-2 !pl-6 !pr-2 active:scale-[0.98] ${featured ? 'btn-primary-nex--featured' : ''} ${className}`}
    >
      {background && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          {background}
        </span>
      )}
      <span className={`relative z-10 inline-flex min-h-[1.25em] min-w-0 items-center gap-2 break-words text-center font-medium ${background ? '[text-shadow:0_1px_10px_rgba(0,0,0,0.45)]' : ''}`}>
        <span>{display}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105" aria-hidden="true">
          <ArrowRight size={14} strokeWidth={2} />
        </span>
      </span>
      <motion.span
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="hold-bar absolute bottom-0 left-0 z-10 h-[3px] w-full origin-left bg-white will-change-transform"
      />
    </motion.button>
  );
}

export default HoldButton;
