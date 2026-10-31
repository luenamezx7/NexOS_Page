'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';
import { HeaderAccount } from './HeaderAccount';
import { useSectionScroll } from './SmoothScrollProvider';
import { useScrollLock } from './useScrollLock';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import styles from './Header.module.css';

const SOLUTIONS = [
  { label: 'Sites e Portfólios', href: '/criacao-de-sites' },
  { label: 'Landing Pages', href: '/landing-pages' },
  { label: 'Cardápios Digitais', href: '/cardapio-digital' },
  { label: 'Placa NFC', href: '/placa-nfc' },
];
const NAV_ITEMS = [
  { label: 'EasyWay', href: '#easyway' },
  { label: 'Sobre Nós', href: '#testimonials' },
  { label: 'Contato', href: '#cta-final' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const destination = useRef<string | null>(null);
  const scrollToSection = useSectionScroll();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', y => setScrolled(previous => previous === (y > 24) ? previous : y > 24));
  useScrollLock(mobileOpen);

  const closeMenu = useCallback(() => setMobileOpen(false), []);
  const navigate = (hash: string) => {
    if (mobileOpen) { destination.current = hash; closeMenu(); }
    else scrollToSection(hash);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen) dialog.showModal();
    else {
      dialog.close();
      if (destination.current) {
        const hash = destination.current;
        destination.current = null;
        // Wait until the scroll lock and native modal have both been released.
        const frame = requestAnimationFrame(() => scrollToSection(hash));
        return () => cancelAnimationFrame(frame);
      }
    }
  }, [mobileOpen, scrollToSection]);

  useEffect(() => {
    const desktop = matchMedia('(min-width: 1024px)');
    const resize = () => { if (desktop.matches) closeMenu(); };
    desktop.addEventListener('change', resize);
    return () => desktop.removeEventListener('change', resize);
  }, [closeMenu]);

  return <>
    <header role="banner" className={styles.header} data-managed-section-links data-scrolled={scrolled} data-header-state="assembled">
      <div className={styles.bar}>
        <a href="#hero" aria-label="NexOS, início" className={styles.brand} onClick={event => { event.preventDefault(); navigate('#hero'); }}><BrandMark /></a>
        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <DropdownMenu>
            <DropdownMenuTrigger className={styles.navLink}>Soluções <ChevronDown size={13} aria-hidden="true" /></DropdownMenuTrigger>
            <DropdownMenuContent className={styles.popup} sideOffset={14}>
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/#services" />} className={styles.menuItem}>Explorar soluções <ArrowUpRight size={15} aria-hidden="true" /></DropdownMenuItem>
                {SOLUTIONS.map(item => <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className={styles.menuItem}>{item.label}</DropdownMenuItem>)}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {NAV_ITEMS.map(item => <a key={item.href} href={item.href} className={styles.navLink} onClick={event => { event.preventDefault(); navigate(item.href); }}>{item.label}</a>)}
        </nav>
        <div className={styles.actions}>
          <HeaderAccount />
          <ThemeToggle className={styles.themeToggle} />
          <button ref={triggerRef} type="button" className={styles.menuButton} aria-label="Abrir menu" aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(true)}><Menu size={21} aria-hidden="true" /></button>
        </div>
      </div>
    </header>
    <dialog ref={dialogRef} id="mobile-navigation" className={styles.mobileDialog} aria-labelledby="mobile-menu-title" data-lenis-prevent onCancel={closeMenu} onClose={() => { closeMenu(); if (!destination.current) triggerRef.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]')].filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className={styles.mobilePanel}>
        <div className={styles.mobileHeading}><span id="mobile-menu-title">Explore a NexOS</span><button type="button" className={styles.closeButton} aria-label="Fechar menu" onClick={closeMenu}><X size={22} /></button></div>
        <nav aria-label="Navegação móvel" className={styles.mobileNav}>
          <a href="#services" onClick={event => { event.preventDefault(); navigate('#services'); }}>Soluções <ArrowUpRight size={19} aria-hidden="true" /></a>
          <div className={styles.mobileSolutions}>{SOLUTIONS.map(item => <Link key={item.href} href={item.href} onClick={closeMenu}>{item.label}</Link>)}</div>
          {NAV_ITEMS.map(item => <a key={item.href} href={item.href} onClick={event => { event.preventDefault(); navigate(item.href); }}>{item.label}<ArrowUpRight size={19} aria-hidden="true" /></a>)}
        </nav>
        <HeaderAccount expanded onNavigate={closeMenu} />
        <p className={styles.mobileSignature}>Sites e soluções digitais</p>
      </div>
    </dialog>
  </>;
}

export default Header;
