"use client";

import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type FocusEvent, type KeyboardEvent, type Ref } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import styles from './otp-input.module.css';

const CROSSFADE = { type: 'spring', stiffness: 260, damping: 34, mass: .8 } as const;
const EASE = [.23, 1, .32, 1] as const;
export type OtpMode = 'numeric' | 'alphanumeric';
const ALLOW: Record<OtpMode, RegExp> = { numeric: /^[0-9]$/, alphanumeric: /^[0-9a-zA-Z]$/ };
export type UseOtpInputOptions = { length?: number; mode?: OtpMode; defaultValue?: string; disabled?: boolean; onChange?: (value: string) => void; onComplete?: (value: string) => void };
export type OtpCellProps = {
  ref: (el: HTMLInputElement | null) => void; value: string; disabled: boolean; type: 'text'; inputMode: 'numeric' | 'text'; autoComplete: string; autoCorrect: 'off'; autoCapitalize: 'off'; spellCheck: false;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void; onPaste: (e: ClipboardEvent<HTMLInputElement>) => void; onFocus: (e: FocusEvent<HTMLInputElement>) => void; onBlur: (e: FocusEvent<HTMLInputElement>) => void;
};
export type UseOtpInputReturn = { chars: string[]; value: string; length: number; complete: boolean; focusedIndex: number; getCellProps: (index: number) => OtpCellProps; focusAt: (index: number) => void; clear: () => void };

export function useOtpInput({ length = 6, mode = 'numeric', defaultValue = '', disabled = false, onChange, onComplete }: UseOtpInputOptions = {}): UseOtpInputReturn {
  const allow = ALLOW[mode];
  const keep = useCallback((text: string) => text.split('').filter(c => allow.test(c)).join(''), [allow]);
  const [stored, setChars] = useState(() => ({ length, chars: Array.from({ length }, (_, i) => defaultValue.split('').filter(c => ALLOW[mode].test(c))[i] ?? '') }));
  // Normalize during render rather than scheduling an extra render in an effect.
  const chars = stored.length === length ? stored.chars : Array.from({ length }, (_, i) => stored.chars[i] ?? '');
  if (stored.length !== length) setChars({ length, chars });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const charsRef = useRef(chars);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const changed = useRef(onChange);
  const completed = useRef(onComplete);
  useLayoutEffect(() => { charsRef.current = chars; changed.current = onChange; completed.current = onComplete; }, [chars, onChange, onComplete]);
  useEffect(() => { refs.current.length = length; }, [length]);
  const commit = useCallback((next: string[]) => {
    charsRef.current = next; setChars({ length: next.length, chars: next });
    const value = next.join(''); changed.current?.(value);
    if (next.length > 0 && next.every(c => c !== '')) completed.current?.(value);
  }, []);
  const focusAt = useCallback((index: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    if (!el) return; el.focus({ preventScroll: true }); el.select();
  }, [length]);
  const fillFrom = useCallback((index: number, text: string) => {
    if (disabled) return;
    const incoming = keep(text); if (!incoming.length) return;
    const next = [...charsRef.current]; let cursor = index;
    for (const c of incoming) { if (cursor >= length) break; next[cursor++] = c; }
    commit(next); focusAt(cursor);
  }, [commit, disabled, focusAt, keep, length]);
  const clear = useCallback(() => { commit(Array.from({ length }, () => '')); focusAt(0); }, [commit, focusAt, length]);
  const getCellProps = useCallback((index: number): OtpCellProps => ({
    ref: el => { refs.current[index] = el; }, value: chars[index] ?? '', disabled, type: 'text', inputMode: mode === 'numeric' ? 'numeric' : 'text',
    autoComplete: index === 0 ? 'one-time-code' : 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false,
    onChange: e => {
      if (disabled) return;
      const previous = charsRef.current[index] ?? '', raw = e.currentTarget.value;
      const trimmed = raw.length > 1 && previous && raw.startsWith(previous) ? raw.slice(previous.length) : raw;
      const incoming = keep(trimmed);
      if (!incoming.length) {
        if (!raw.length && previous) { const next = [...charsRef.current]; next[index] = ''; commit(next); }
        e.currentTarget.value = charsRef.current[index] ?? ''; return;
      }
      if (incoming.length === 1) { const next = [...charsRef.current]; next[index] = incoming; e.currentTarget.value = incoming; commit(next); if (index < length - 1) focusAt(index + 1); return; }
      fillFrom(index, incoming);
    },
    onKeyDown: e => {
      if (disabled) return;
      if (e.key === 'Backspace') {
        e.preventDefault(); const current = charsRef.current, next = [...current];
        if (current[index]) { next[index] = ''; commit(next); return; }
        if (index > 0) { next[index - 1] = ''; commit(next); focusAt(index - 1); } return;
      }
      if (e.key === 'Delete') { e.preventDefault(); const next = [...charsRef.current]; next[index] = ''; commit(next); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); focusAt(index - 1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); focusAt(index + 1); return; }
      if (e.key === 'Home') { e.preventDefault(); focusAt(0); return; }
      if (e.key === 'End') { e.preventDefault(); focusAt(length - 1); }
    },
    onPaste: e => { e.preventDefault(); const text = keep(e.clipboardData.getData('text')); fillFrom(text.length >= length ? 0 : index, text); },
    onFocus: e => { e.currentTarget.select(); const firstEmpty = charsRef.current.findIndex(c => c === ''); if (firstEmpty !== -1 && firstEmpty < index) { focusAt(firstEmpty); return; } setFocusedIndex(index); },
    onBlur: e => { const to = e.relatedTarget as HTMLInputElement | null; if (to && refs.current.includes(to)) return; setFocusedIndex(-1); },
  }), [chars, commit, disabled, fillFrom, focusAt, keep, length, mode]);
  return { chars, value: chars.join(''), length, complete: chars.length > 0 && chars.every(c => c !== ''), focusedIndex, getCellProps, focusAt, clear };
}

export type OtpStatus = 'idle' | 'error' | 'success';
export type OtpInputHandle = { clear: () => void; focus: () => void };
export type OtpInputProps = UseOtpInputOptions & { status?: OtpStatus; errorMessage?: string; successMessage?: string; hint?: string; label?: string; groupEvery?: number; autoFocus?: boolean; focusOnError?: boolean; className?: string; ref?: Ref<OtpInputHandle> };

export function OtpInput({ length = 6, mode = 'numeric', defaultValue = '', onChange, onComplete, status = 'idle', errorMessage = '', successMessage = '', hint = '', label = 'Código de verificação', groupEvery = 3, disabled = false, autoFocus = false, focusOnError = true, className = '', ref }: OtpInputProps) {
  const reduced = useReducedMotion(); const statusId = useId();
  const { chars, focusedIndex, getCellProps, focusAt, clear } = useOtpInput({ length, mode, defaultValue, disabled, onChange, onComplete });
  const wasError = useRef(false); const error = status === 'error', success = status === 'success';
  useImperativeHandle(ref, () => ({ clear: () => { clear(); focusAt(0); }, focus: () => focusAt(0) }), [clear, focusAt]);
  useEffect(() => { if (error && !wasError.current && focusOnError && !disabled) focusAt(0); wasError.current = error; }, [error, focusOnError, disabled, focusAt]);
  const didAutoFocus = useRef(false);
  useEffect(() => { if (autoFocus && !disabled && !didAutoFocus.current) { didAutoFocus.current = true; focusAt(0); } }, [autoFocus, disabled, focusAt]);
  const enter = reduced ? { duration: 0 } : { duration: .22, ease: EASE };
  const swap = reduced ? { duration: 0 } : CROSSFADE;
  const hasStatus = hint.length > 0 || errorMessage.length > 0 || successMessage.length > 0;
  const message = error ? errorMessage : success ? successMessage : hint;
  return <div className={`${styles.root} ${className}`} data-otp-input data-otp-status={status}>
    <motion.div role="group" aria-label={label} className={styles.cells} initial={false} variants={{ idle: { x: 0 }, wrong: { x: [0, -5, 4, -3, 0] } }} animate={error && !reduced ? 'wrong' : 'idle'} transition={{ duration: .32, ease: EASE }}>
      {Array.from({ length }, (_, i) => {
        const char = chars[i] ?? '', active = focusedIndex === i, gap = groupEvery > 0 && i > 0 && i % groupEvery === 0;
        return <div key={i} className={styles.cell} data-gap={gap || undefined} data-active={active || undefined} data-filled={!!char || undefined}>
          <input {...getCellProps(i)} aria-label={`${label}, dígito ${i + 1} de ${length}`} aria-invalid={error || undefined} aria-describedby={hasStatus ? statusId : undefined} className={styles.input} />
          <span aria-hidden="true" className={styles.overlay}>
            <AnimatePresence initial={false} mode="popLayout">{char ? <motion.span key={char} initial={reduced ? false : { opacity: 0, scale: .97, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} exit={reduced ? { opacity: 0 } : { opacity: 0, scale: .98, y: -6, filter: 'blur(3px)' }} transition={enter} className={styles.character}>{char}</motion.span> : null}</AnimatePresence>
            {active && !char && !disabled ? <motion.span className={styles.caret} initial={{ opacity: 1 }} animate={reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }} transition={reduced ? { duration: 0 } : { duration: 1.06, times: [0, .5, .5, 1], repeat: Infinity, ease: 'linear' }} /> : null}
          </span>
        </div>;
      })}
    </motion.div>
    {hasStatus && <><div aria-hidden="true" className={styles.message}><AnimatePresence initial={false} mode="wait"><motion.span key={`${status}-${message}`} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: -3 }} transition={swap}>{message}</motion.span></AnimatePresence></div><span id={statusId} role="status" className="sr-only">{message}</span></>}
  </div>;
}
export default OtpInput;
