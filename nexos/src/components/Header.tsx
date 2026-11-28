'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { NavigationGlass } from './NavigationGlass';
import { Button } from './ui/cnippet-button';
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

const subscribeScrolled = (notify: () => void) => {
  window.addEventListener('scroll', notify, { passive: true });
  return () => window.removeEventListener('scroll', notify);
};
// Small hysteresis: float as soon as the visitor starts down, settle back only
// at the very top, so the bar never flickers between states near 0.
let floating = false;
const getScrolled = () => (floating = floating ? window.scrollY > 2 : window.scrollY > 8);
const getServerScrolled = () => false;

export function Header() {
  const { t } = useLocale();
  const headerRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useSyncExternalStore(subscribeScrolled, getScrolled, getServerScrolled);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingMenu = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const destination = useRef<string | null>(null);
  const scrollToSection = useSectionScroll();
  const sectionScrollRef = useRef(scrollToSection);
  useEffect(() => { sectionScrollRef.current = scrollToSection; }, [scrollToSection]);
  const [dropdown, setDropdown] = useState<'language' | 'account' | null>(null);
  useScrollLock(mobileOpen);

  // Current-section indicator. An IntersectionObserver replaces a per-frame
  // elementFromPoint hit test (≈6 s of main-thread time per full scroll on a
  // throttled phone).
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const links = [...header.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]')];
    const targets = links.map(link => document.getElementById(link.hash.slice(1))).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) visible.add(entry.target.id); else visible.delete(entry.target.id); });
      // The first target in document order that crosses the band under the header.
      const current = targets.find(target => visible.has(target.id))?.id;
      links.forEach(link => {
        if (current && link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-96px 0px -55% 0px' });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, []);

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
      if (panelRef.current) panelRef.current.inert = false;
      dialog.showModal();
      if (panelRef.current) {
        openDialogSurface(panelRef.current);
        // Native dialogs can remember the last focused item between openings.
        panelRef.current.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
      }
    }
    else {
      dialog.close();
      if (destination.current) {
        const hash = destination.current;
        destination.current = null;
        // Wait until the scroll lock and native modal have both been released.
        const frame = requestAnimationFrame(() => sectionScrollRef.current(hash));
        return () => cancelAnimationFrame(frame);
      }
    }
  }, [mobileOpen]);

  useEffect(() => {
    const desktop = matchMedia('(min-width: 1280px)');
    const resize = () => { if (desktop.matches) closeMenu(); };
    desktop.addEventListener('change', resize);
    return () => desktop.removeEventListener('change', resize);
  }, [closeMenu]);

  return <>
    <header ref={headerRef} role="banner" className={styles.header} data-managed-section-links data-scrolled={scrolled} data-header-state="assembled" data-nav-surface="dark">
      <div className={styles.surface} aria-hidden="true" /><div className={styles.ring} aria-hidden="true" />
      <div className={styles.bar}>
        <a href="#hero" aria-label={t('ezway, início')} className={styles.brand} onClick={event => { event.preventDefault(); navigate('#hero'); }}><BrandMark registered /></a>
        <nav className={styles.desktopNav} aria-label={t('Navegação principal')}>
          {NAV_ITEMS.map(item => <a key={item.href} href={item.href} className={styles.navLink} onClick={event => { event.preventDefault(); navigate(item.href); }}>{t(item.label)}</a>)}
        </nav>
        <div className={styles.actions}>
          <HeaderAccount open={dropdown === 'account'} onOpenChange={open => setDropdown(open ? 'account' : null)} />
          <LanguageSwitch open={dropdown === 'language'} onOpenChange={open => setDropdown(open ? 'language' : null)} />
           <Button className={styles.contactAction} data-navigation-glass="control" render={<a href={commercialHref(t('Olá! Quero conversar sobre as soluções da ezway.'))} target="_blank" rel="noopener noreferrer" />}><NavigationGlass />{t('Conversar no WhatsApp')}</Button>
           <button ref={triggerRef} type="button" className={styles.menuButton} data-navigation-glass="control" aria-label={t('Abrir menu')} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => { setDropdown(null); setMobileOpen(true); }}><span className={styles.menuGlyph} aria-hidden="true"><span /><span /></span></button>
        </div>
      </div>
    </header>
    <dialog ref={dialogRef} id="mobile-navigation" className={styles.mobileDialog} data-floating={scrolled} aria-labelledby="mobile-menu-title" data-lenis-prevent onCancel={event => { event.preventDefault(); closeMenu(); }} onClose={() => { closeMenu(); if (!destination.current) triggerRef.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} onKeyDown={event => {
       if (event.key !== 'Tab') return;
       const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),summary,[tabindex="0"]')].filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div ref={panelRef} className={styles.mobilePanel} data-navigation-glass="panel">
         <NavigationGlass variant="panel" />
         <div className={styles.mobileHeading}><span id="mobile-menu-title">{t('Explore a ezway')}</span><button type="button" className={styles.closeButton} data-navigation-glass="control" aria-label={t('Fechar menu')} onClick={closeMenu}><NavigationGlass /><X size={22} /></button></div>
         <div className={styles.mobileContent} data-mobile-menu-scroll>
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
