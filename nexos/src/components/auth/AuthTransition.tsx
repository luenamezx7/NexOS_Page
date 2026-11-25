'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, animate as animateValue, motion, useAnimate, useReducedMotion } from 'motion/react';
import styles from './AuthTransition.module.css';

export type AuthPhase = 'idle' | 'loading' | 'success' | 'error';
const ease = [.16, 1, .3, 1] as const;

/** One fixed centre, one real outcome; this component never decides authentication. */
function Confirmation({ phase, onComplete }: { phase: 'loading' | 'success'; onComplete: () => void }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useReducedMotion();
  const completion = useRef(onComplete);
  useEffect(() => { completion.current = onComplete; }, [onComplete]);
  const rotation = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (reduced) return;
    const spin = animate('[data-auth-rotor]', { rotate: [0, 360] }, { duration: 1.05, ease: 'linear', repeat: Infinity });
    rotation.current = spin;
    return () => { spin.stop(); rotation.current = null; };
  }, [animate, reduced]);

  useEffect(() => {
    if (phase !== 'success') return;
    let cancelled = false;
    const slowdown = rotation.current && !reduced
      ? animateValue(1, .12, { duration: .22, ease: 'easeOut', onUpdate: value => { if (rotation.current) rotation.current.speed = value; } })
      : null;
    const sequence = reduced ? animate([
      ['[data-auth-spinner]', { opacity: 0 }, { duration: .12, at: 0 }],
      ['[data-auth-check]', { opacity: 1 }, { duration: .16, at: .06 }],
      ['[data-auth-check-path]', { strokeDashoffset: 0 }, { duration: .16, at: .08 }],
      [scope.current, { opacity: 0 }, { duration: .12, at: .94 }],
    ]) : animate([
      ['[data-auth-spinner]', { opacity: 0, filter: 'blur(7px)', scale: .94 }, { duration: .22, ease: 'easeInOut', at: 0 }],
      ['[data-auth-check]', { opacity: 1, filter: 'blur(0px)', scale: [.88, 1.012, 1] }, { duration: .42, ease, at: .12 }],
      ['[data-auth-check-path]', { strokeDashoffset: 0 }, { duration: .4, ease, at: .2 }],
      // The final stroke is complete at .6s; hold it for .7s before fading.
      [scope.current, { opacity: 0 }, { duration: .18, ease: 'easeInOut', at: 1.3 }],
    ]);
    void sequence.then(() => { if (!cancelled) completion.current(); });
    return () => { cancelled = true; slowdown?.stop(); sequence.stop(); };
  }, [phase, animate, reduced, scope]);

  return <motion.div className={styles.overlay} data-auth-confirmation={phase} aria-hidden="true"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .12, delay: 0 } }}
    transition={{ duration: reduced ? .1 : .16, delay: phase === 'loading' ? .1 : 0 }}>
    <div ref={scope} className={styles.symbol}>
      <div className={styles.spinner} data-auth-spinner>
        <div data-auth-rotor className={styles.rotor}>
          <svg viewBox="0 0 64 64" className={styles.svg} fill="none">
            <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.7" opacity=".14" />
            <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="46 139" transform="rotate(-90 32 32)" />
          </svg>
        </div>
      </div>
      <div className={styles.check} data-auth-check style={{ opacity: 0, transform: reduced ? 'none' : 'scale(.88)', filter: reduced ? 'none' : 'blur(4px)' }}>
        <svg viewBox="0 0 64 64" className={styles.svg} fill="none">
          <circle cx="32" cy="32" r="27" className={styles.disc} />
          <path data-auth-check-path d="M20 32.5 28.5 40.5 44 24.5" pathLength="1" stroke="white" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" strokeDashoffset="1" />
        </svg>
      </div>
    </div>
  </motion.div>;
}

export function AuthTransition({ phase = 'idle', onComplete, children, pendingLabel = 'Autenticando. Aguarde.', successLabel = 'Autenticação concluída.' }: {
  phase?: AuthPhase; onComplete?: () => void; children: ReactNode; pendingLabel?: string; successLabel?: string;
}) {
  const reduced = useReducedMotion();
  const active = phase === 'loading' || phase === 'success';
  const content = useRef<HTMLDivElement>(null);
  const previous = useRef(false);
  const restoreFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (active && !previous.current) {
      restoreFocus.current = document.activeElement instanceof HTMLElement && content.current?.contains(document.activeElement) ? document.activeElement : null;
      content.current?.closest<HTMLElement>('[data-auth-card]')?.focus({ preventScroll: true });
    } else if (!active && previous.current) {
      const invalid = content.current?.querySelector<HTMLElement>('input[name="password"][aria-invalid="true"]') ?? content.current?.querySelector<HTMLElement>('input[aria-invalid="true"]');
      const target = invalid ?? (restoreFocus.current?.isConnected ? restoreFocus.current : content.current?.querySelector<HTMLElement>('input:not([disabled])'));
      target?.focus({ preventScroll: true });
    }
    previous.current = active;
  }, [active]);
  return <>
    <motion.div ref={content} className={styles.content} data-auth-content data-auth-phase={phase}
      inert={active} aria-hidden={active || undefined} initial={false}
      animate={{ opacity: active ? 0 : 1, filter: active && !reduced ? 'blur(4px)' : 'blur(0px)' }}
      transition={{ duration: reduced ? .12 : .18, ease }}>
      {children}
    </motion.div>
    <AnimatePresence initial={false}>
      {active && <Confirmation phase={phase} onComplete={() => onComplete?.()} />}
    </AnimatePresence>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-auth-announcement>{phase === 'loading' ? pendingLabel : phase === 'success' ? successLabel : ''}</span>
  </>;
}
