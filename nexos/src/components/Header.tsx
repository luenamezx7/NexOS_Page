'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, X, ArrowUpRight } from 'lucide-react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { BrandMark } from './BrandMark';
import { ListViewIcon } from './ListViewIcon';
import { HeaderAccount } from './HeaderAccount';
import { LanguageSwitch } from './LanguageSwitch';
import { useLocale } from '@/lib/locale';
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
  { label: 'Como funciona', href: '#delivery-process' },
  { label: 'EasyChat', href: '#easychat' },
  { label: 'Planos', href: '#plans' },
  { label: 'Sobre', href: '#testimonials' },
];

export function Header() {
  const { t } = useLocale();
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
    const desktop = matchMedia('(min-width: 1200px)');
    const resize = () => { if (desktop.matches) closeMenu(); };
    desktop.addEventListener('change', resize);
    return () => desktop.removeEventListener('change', resize);
  }, [closeMenu]);

  return <>
    <header role="banner" className={styles.header} data-managed-section-links data-scrolled={scrolled} data-header-state="assembled">
      <div className={styles.bar}>
        <a href="#hero" aria-label={t('ezway, início')} className={styles.brand} onClick={event => { event.preventDefault(); navigate('#hero'); }}><BrandMark /></a>
        <nav className={styles.desktopNav} aria-label={t('Navegação principal')}>
          <DropdownMenu>
            <DropdownMenuTrigger className={styles.navLink}>{t('Soluções')} <ChevronDown size={13} aria-hidden="true" /></DropdownMenuTrigger>
            <DropdownMenuContent className={styles.popup} sideOffset={14}>
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/#services" />} className={styles.menuItem}>{t('Explorar soluções')} <ArrowUpRight size={15} aria-hidden="true" /></DropdownMenuItem>
                {SOLUTIONS.map(item => <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className={styles.menuItem}>{t(item.label)}</DropdownMenuItem>)}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {NAV_ITEMS.map(item => <a key={item.href} href={item.href} className={styles.navLink} onClick={event => { event.preventDefault(); navigate(item.href); }}>{t(item.label)}</a>)}
        </nav>
        <div className={styles.actions}>
          <HeaderAccount />
          <LanguageSwitch />
          <a className={styles.contactAction} href="#contact" onClick={event => { event.preventDefault(); navigate('#contact'); }}>{t('Agendar conversa')}</a>
           <button ref={triggerRef} type="button" className={styles.menuButton} aria-label={t('Abrir menu')} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(true)}><ListViewIcon isActive={mobileOpen} /></button>
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
        <div className={styles.mobileHeading}><span id="mobile-menu-title">{t('Explore a ezway')}</span><button type="button" className={styles.closeButton} aria-label={t('Fechar menu')} onClick={closeMenu}><X size={22} /></button></div>
         <nav aria-label={t('Navegação móvel')} className={styles.mobileNav}>
          <a href="#services" onClick={event => { event.preventDefault(); navigate('#services'); }}>{t('Soluções')} <ArrowUpRight size={19} aria-hidden="true" /></a>
          <div className={styles.mobileSolutions}>{SOLUTIONS.map(item => <Link key={item.href} href={item.href} onClick={closeMenu}>{t(item.label)}</Link>)}</div>
          {NAV_ITEMS.map(item => <a key={item.href} href={item.href} onClick={event => { event.preventDefault(); navigate(item.href); }}>{t(item.label)}<ArrowUpRight size={19} aria-hidden="true" /></a>)}
          <a className={styles.mobileContactAction} href="#contact" onClick={event => { event.preventDefault(); navigate('#contact'); }}>{t('Agendar conversa')} <ArrowUpRight size={19} aria-hidden="true" /></a>
        </nav>
        <HeaderAccount expanded onNavigate={closeMenu} />
        <p className={styles.mobileSignature}>{t('Sites e soluções digitais')}</p>
      </div>
    </dialog>
  </>;
}

export default Header;
