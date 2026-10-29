'use client';

/**
 * Header fixo com glassmorphism.
 * - Nav desktop + drawer mobile
 * - Link "Minha conta" → /portal/acesso
 * - ThemeToggle
 * - Superfície de vidro sempre visível, desde o carregamento.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { config } from '@/config';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';
import styles from './Header.module.css';
import { useSectionScroll } from './SmoothScrollProvider';
import { cn } from '@/lib/utils';
import { ProfileOrb } from './ProfileOrb';

const NAV_ITEMS = [{ label: 'Placa NFC', href: '#showcase' }, ...config.navigation];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const scrollToSection = useSectionScroll();

  const closeMenu = useCallback(() => {
    if (!mobileOpen) return;
    setMobileOpen(false);
  }, [mobileOpen]);

  const handleNav = useCallback((hash: string) => {
    closeMenu();
    requestAnimationFrame(() => scrollToSection(hash));
  }, [closeMenu, scrollToSection]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeMenu(); menuRef.current?.focus(); }
    };
    const desktop = matchMedia('(min-width: 1200px)');
    const onResize = () => { if (desktop.matches) closeMenu(); };
    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => { window.removeEventListener('keydown', onKey); desktop.removeEventListener('change', onResize); };
  }, [closeMenu, mobileOpen]);

  return (
    <header
      role="banner"
      data-managed-section-links
      className={styles.header}
      data-header-state="assembled"
    >
      <div className={styles.bar}>
        <a href="#hero" aria-label="NexOS, início" onClick={event => { event.preventDefault(); handleNav('#hero'); }} className={styles.brand}>
          <BrandMark />
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
          <Link href="/portal/acesso" prefetch={false} className={styles.account}>
            <ProfileOrb /><span className={styles.accountLabel}>Minha conta</span>
          </Link>
          <ThemeToggle className={styles.themeToggle} />
          <button type="button" className={cn('primary-action', styles.start)} onClick={() => handleNav('#services')}><span className="inline-flex items-center gap-2">Ver soluções <ArrowUpRight size={16} aria-hidden="true" /></span></button>
          <button ref={menuRef} type="button" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => {
            if (mobileOpen) closeMenu();
            else setMobileOpen(true);
          }} className={styles.menuButton}>
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav id="mobile-navigation" aria-label="Navegação móvel" initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={{ duration: reduce ? 0 : 0.2 }} className={styles.mobileNav}>
            <ul role="list" className="flex flex-col gap-4">
              {NAV_ITEMS.map(item => (
                <li key={item.href}>
                  <a href={item.href} onClick={event => { event.preventDefault(); handleNav(item.href); }}>{item.label}<ArrowUpRight size={16} aria-hidden="true" /></a>
                </li>
              ))}
            </ul>
            <button type="button" className={cn('primary-action', styles.mobileStart)} onClick={() => handleNav('#services')}><span className="inline-flex w-full items-center justify-between gap-2">Ver soluções <ArrowUpRight size={16} aria-hidden="true" /></span></button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
