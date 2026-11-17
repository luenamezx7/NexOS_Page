// Built using Hyperiux Vault: https://vault.hyperiux.com
'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type PointerEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './arrow-fill-button.module.css';

const ANIMATION_DURATION_MS = 450;
export interface ArrowFillButtonOwnProps {
  btnText?: string;
  href?: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
  fillBgColor?: string;
  fillTextColor?: string;
  hoverFillBgColor?: string;
  hoverFillTextColor?: string;
  arrowColor?: string;
  hoverArrowColor?: string;
  animationDuration?: number;
  fillOnHover?: boolean;
}
export type ArrowFillButtonProps = ArrowFillButtonOwnProps & Omit<ComponentPropsWithoutRef<'a'>, keyof ArrowFillButtonOwnProps>;

export default function ArrowFillButton({
  btnText = 'Hover Me', href = '#', className = '', bgColor = '#ff5f00', textColor = '#ffffff',
  fillBgColor = '#ffffff', fillTextColor = '#ff5f00', hoverFillBgColor = '#ffffff', hoverFillTextColor = '#ff5f00',
  arrowColor, hoverArrowColor, animationDuration = ANIMATION_DURATION_MS, fillOnHover = true, style, ...props
}: ArrowFillButtonProps) {
  const [isReady, setIsReady] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const releaseTimeoutRef = useRef<number | null>(null);
  const duration = Number.isFinite(animationDuration) ? Math.max(0, animationDuration) : ANIMATION_DURATION_MS;
  const usesUtilityBackground = /(?:^|[\s:])(?:bg-|from-|via-|to-)/u.test(className);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => { cancelAnimationFrame(frame); if (releaseTimeoutRef.current !== null) clearTimeout(releaseTimeoutRef.current); };
  }, []);

  const release = () => {
    if (releaseTimeoutRef.current !== null) clearTimeout(releaseTimeoutRef.current);
    releaseTimeoutRef.current = window.setTimeout(() => { setIsPressed(false); releaseTimeoutRef.current = null; }, duration);
  };
  const press = (event: PointerEvent<HTMLAnchorElement>) => {
    props.onPointerDown?.(event);
    if (event.defaultPrevented || event.pointerType === 'mouse') return;
    if (releaseTimeoutRef.current !== null) clearTimeout(releaseTimeoutRef.current);
    setIsPressed(true);
  };

  return <a {...props} href={href} className={cn(styles.button, usesUtilityBackground && styles.utilityBackground, className)}
    data-arrow-fill-button data-ready={isReady} data-fill-on-hover={fillOnHover} data-pressed={isPressed}
    onPointerDown={press}
    onPointerUp={event => { props.onPointerUp?.(event); if (event.pointerType !== 'mouse') release(); }}
    onPointerCancel={event => { props.onPointerCancel?.(event); if (event.pointerType !== 'mouse') release(); }}
    onPointerLeave={event => { props.onPointerLeave?.(event); if (event.pointerType !== 'mouse') release(); }}
    style={{
      '--btn-bg': bgColor, '--btn-text': textColor, '--btn-fill-bg': fillBgColor, '--btn-fill-text': fillTextColor,
      '--btn-fill-bg-hover': hoverFillBgColor, '--btn-fill-text-hover': hoverFillTextColor,
      '--btn-arrow': arrowColor || fillTextColor, '--btn-arrow-hover': hoverArrowColor || hoverFillTextColor,
      '--btn-duration': `${duration}ms`, ...style,
    } as CSSProperties}>
    <span className={styles.label}>{btnText}</span>
    <span aria-hidden="true" className={styles.fill} />
    <span aria-hidden="true" className={styles.fillLabel}>{btnText}</span>
    <span aria-hidden="true" className={styles.circle}>
      <ArrowRight className={styles.enteringArrow} strokeWidth={1.8} />
      <ArrowRight className={styles.leavingArrow} strokeWidth={1.8} />
    </span>
  </a>;
}
