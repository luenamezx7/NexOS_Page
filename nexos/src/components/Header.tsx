'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion, useScroll, useMotionValueEvent } from 'motion/react';
import { ArrowUpRight, Menu, UserRound, X } from 'lucide-react';
import { config } from '@/config';
import { RobotCycler } from './RobotCycler';
import { ThemeToggle } from './ThemeToggle';
import styles from './Header.module.css';

const NAV_ITEMS = [{ label: 'Placa NFC', href: '#showcase' }, ...config.navigation];
const EASE = [0.16, 1, 0.3, 1] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', latest => setScrolled(latest > 10));

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const response = await fetch('/api/auth/session?requireMfa=false', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        const data = await response.json();
        if (active && data?.ok === true) setAuthenticated(true);
      } catch { /* ignore */ }
    };
    void check();
    return () => { active = false; };
  }, []);

  const handleNav = useCallback((hash: string) => {
    setMobileOpen(false);
    requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' }));
  }, [reduce]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); menuRef.current?.focus(); }
    };
    const desktop = matchMedia('(min-width: 1200px)');
    const onResize = () => { if (desktop.matches) setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => { window.removeEventListener('keydown', onKey); desktop.removeEventListener('change', onResize); };
  }, [mobileOpen]);

  return (
    <motion.header
      role="banner"
      initial={reduce ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
    >
      <div className={styles.bar}>
        <a href="#hero" aria-label="NexOS, início" onClick={event => { event.preventDefault(); handleNav('#hero'); }} className={styles.brand}>
          <Image src="/nexos-branca-transparente.svg" alt="NexOS" width={112} height={28} className="logo-invert h-auto w-full" />
          <RobotCycler className={`logo-invert ${styles.robot}`} intervalMs={2200} fadeMs={650} />
        </a>
        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <ul role="list" className="flex gap-6">
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <a href={item.href} onClick={event => { event.preventDefault(); handleNav(item.href); }} className={styles.navLink}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.actions}>
          <Link href="/portal/acesso" className={styles.account}>
            <UserRound size={16} strokeWidth={1.75} aria-hidden="true" />{authenticated ? null : <span>Minha conta</span>}
          </Link>
          <ThemeToggle />
          <button type="button" className={styles.start} onClick={() => handleNav('#services')}>Ver soluções <ArrowUpRight size={16} aria-hidden="true" /></button>
          <button ref={menuRef} type="button" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(value => !value)} className={styles.menuButton}>
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav id="mobile-navigation" aria-label="Navegação móvel" initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={{ duration: 0.2 }} className={styles.mobileNav}>
            <ul role="list" className="flex flex-col gap-4">
              {NAV_ITEMS.map(item => (
                <li key={item.href}>
                  <a href={item.href} onClick={event => { event.preventDefault(); handleNav(item.href); }}>{item.label}<ArrowUpRight size={16} aria-hidden="true" /></a>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.mobileStart} onClick={() => handleNav('#services')}>Ver soluções <ArrowUpRight size={16} aria-hidden="true" /></button>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Header;
