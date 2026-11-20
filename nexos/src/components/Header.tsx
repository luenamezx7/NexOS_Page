'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { BrandMark } from './BrandMark';
import { NavigationGlass } from './NavigationGlass';
import { Button } from './ui/cnippet-button';
import { ListViewIcon } from './ListViewIcon';
import { HeaderAccount } from './HeaderAccount';
import { LanguageSwitch } from './LanguageSwitch';
import { useLocale } from '@/lib/locale';
import { useSectionScroll } from './SmoothScrollProvider';
import { useScrollLock } from './useScrollLock';
import { openDialogSurface, closeDialogSurface } from '@/lib/dialog-transition';
import { commercialHref } from '@/lib/commercial';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { label: 'Gestão', href: '#gestao' },
  { label: 'Ecossistema', href: '#ecossistema' },
  { label: 'Placas', href: '#showcase' },
  { label: 'EasyChat', href: '#easychat' },
];

export function Header() {
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingMenu = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const destination = useRef<string | null>(null);
  const scrollToSection = useSectionScroll();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', y => setScrolled(previous => previous === (y > 24) ? previous : y > 24));
  useScrollLock(mobileOpen);

  const closeMenu = useCallback(() => {
    if (closingMenu.current) return;
    const panel = panelRef.current;
    if (!panel || !dialogRef.current?.open) { setMobileOpen(false); return; }
    closingMenu.current = true;
    void closeDialogSurface(panel).then(() => {
      closingMenu.current = false;
      setMobileOpen(false);
    });
  }, []);
  const navigate = (hash: string) => {
    if (mobileOpen) { destination.current = hash; closeMenu(); }
    else scrollToSection(hash);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen) {
      dialog.showModal();
      if (panelRef.current) openDialogSurface(panelRef.current);
    }
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
      <NavigationGlass />
      <div className={styles.bar}>
        <a href="#hero" aria-label={t('ezway, início')} className={styles.brand} onClick={event => { event.preventDefault(); navigate('#hero'); }}><BrandMark registered /></a>
        <nav className={styles.desktopNav} aria-label={t('Navegação principal')}>
          {NAV_ITEMS.map(item => <a key={item.href} href={item.href} className={styles.navLink} onClick={event => { event.preventDefault(); navigate(item.href); }}>{t(item.label)}</a>)}
        </nav>
        <div className={styles.actions}>
          <HeaderAccount />
          <LanguageSwitch />
           <Button className={styles.contactAction} data-navigation-glass="control" render={<a href={commercialHref(t('Olá! Quero conversar sobre as soluções da ezway.'))} target="_blank" rel="noopener noreferrer" />}><NavigationGlass />{t('Conversar no WhatsApp')}</Button>
           <button ref={triggerRef} type="button" className={styles.menuButton} data-navigation-glass="control" aria-label={t('Abrir menu')} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(true)}><NavigationGlass /><ListViewIcon isActive={mobileOpen} /></button>
        </div>
      </div>
    </header>
    <dialog ref={dialogRef} id="mobile-navigation" className={styles.mobileDialog} aria-labelledby="mobile-menu-title" data-lenis-prevent onCancel={event => { event.preventDefault(); closeMenu(); }} onClose={() => { closeMenu(); if (!destination.current) triggerRef.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} onKeyDown={event => {
       if (event.key !== 'Tab') return;
       const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),summary,[tabindex="0"]')].filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div ref={panelRef} className={`${styles.mobilePanel} t-panel-slide`} data-navigation-glass="panel">
         <NavigationGlass variant="panel" />
         <div className={styles.mobileContent} data-mobile-menu-scroll>
         <div className={styles.mobileHeading}><span id="mobile-menu-title">{t('Explore a ezway')}</span><button type="button" className={styles.closeButton} data-navigation-glass="control" aria-label={t('Fechar menu')} onClick={closeMenu}><NavigationGlass /><X size={22} /></button></div>
          <nav aria-label={t('Navegação móvel')} className={styles.mobileNav}>
            {NAV_ITEMS.map(item => <a key={item.href} href={item.href} onClick={event => { event.preventDefault(); navigate(item.href); }}>{t(item.label)}</a>)}
            <Button className={styles.mobileContactAction} data-navigation-glass="control" render={<a href={commercialHref(t('Olá! Quero conversar sobre as soluções da ezway.'))} target="_blank" rel="noopener noreferrer" />} onClick={closeMenu}><NavigationGlass />{t('Conversar no WhatsApp')} <ArrowUpRight size={18} aria-hidden="true" /></Button>
         </nav>
         <HeaderAccount expanded onNavigate={closeMenu} />
         </div>
      </div>
    </dialog>
  </>;
}

export default Header;
