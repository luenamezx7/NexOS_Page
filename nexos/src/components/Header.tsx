'use client';

import { useCallback, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion, useScroll, useMotionValueEvent } from 'motion/react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { config } from '@/config';
import { useTheme } from './ThemeProvider';
import { RobotCycler } from './RobotCycler';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = config.navigation.map((item) => ({
  label: item.label,
  href: item.href,
}));

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function scrollToHash(hash: string): void {
  const id: string = hash.replace('#', '');
  const el: HTMLElement | null = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.hash = hash;
  }
}

interface PrimaryCtaProps {
  label: string;
  onClick: () => void;
  className?: string;
  ariaLabel: string;
}

function PrimaryCta({ label, onClick, className = '', ariaLabel }: PrimaryCtaProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.3, ease: FLUID_EASE }}
      className={`btn-primary-nex will-change-transform touch-target ${className}`}
    >
      <span className="relative z-10">{label}</span>
      <span className="shimmer-sweep" aria-hidden="true" />
    </motion.button>
  );
}

interface SecondaryCtaProps {
  label: string;
  onClick: () => void;
  className?: string;
  ariaLabel: string;
}

function SecondaryCta({ label, onClick, className = '', ariaLabel }: SecondaryCtaProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.3, ease: FLUID_EASE }}
      className={`btn-secondary-nex will-change-transform touch-target ${className}`}
    >
      {label}
    </motion.button>
  );
}

function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: FLUID_EASE }}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/15 bg-ink/[0.05] text-ink/80 transition-colors duration-300 hover:bg-ink/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink touch-target ${className}`}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: FLUID_EASE }}
        className="grid place-items-center will-change-transform"
      >
        {theme === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
      </motion.span>
    </motion.button>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // cycler usa /nexosrobot-1/2/3.svg

  useMotionValueEvent(scrollY, 'change', (latest: number) => {
    setScrolled(latest > 10);
  });

  const handleNav = useCallback((hash: string) => {
    setMobileOpen(false);
    requestAnimationFrame(() => scrollToHash(hash));
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((v: boolean) => !v);
  }, []);

  return (
    <>
      <motion.header
        role="banner"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: FLUID_EASE }}
        className={`glass-header will-change-transform fixed top-4 left-1/2 z-50 flex w-[92%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full px-4 py-2 md:top-6 md:w-[85%] md:px-6 md:py-2.5 ${scrolled ? 'glass-header--scrolled' : ''}`}
      >
        <div className="glass-header-reflex" aria-hidden="true" />

        <a
          href="#hero"
          aria-label={`${config.brand.name} — Início`}
          onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleNav('#hero');
          }}
          className="relative z-10 flex items-center gap-2 rounded-full transition-opacity duration-300 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#ff5c8a]/18 via-[#83358F]/12 to-[#ff5c8a]/18 blur-[10px]" />
          <Image
            src="/nexos-branca-transparente.svg"
            alt="NexOS"
            width={112}
            height={28}
            className="logo-invert h-6 w-auto object-contain md:h-7"
            priority
          />
          <RobotCycler
            className="logo-invert h-6 shrink-0 opacity-90 drop-shadow-[0_0_8px_rgba(255,92,138,0.35)] md:h-7"
            intervalMs={1600}
            fadeMs={650}
          />
        </a>

        <nav className="relative z-10 hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          <Link href="/portal/acesso" className="rounded-lg px-3 py-2 text-sm font-medium text-ink/75 hover:text-ink">Minha conta</Link>
          {NAV_ITEMS.map((item: NavItem) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                handleNav(item.href);
              }}
              className="group relative rounded-lg px-4 py-2 text-sm font-medium tracking-[-0.01em] text-ink/70 transition-colors duration-300 hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink touch-target"
            >
              {item.label}
              <span className="pointer-events-none absolute inset-x-3 bottom-1 z-20 h-px w-0 bg-gradient-to-r from-[#ff5c8a] via-[#83358F] to-[#ff5c8a] opacity-0 shadow-[0_0_8px_#ff5c8a,0_0_16px_rgba(255,92,138,0.4)] transition-all duration-300 group-hover:w-[calc(100%-1.5rem)] group-hover:opacity-100" aria-hidden="true" />
            </a>
          ))}
        </nav>

        <div className="relative z-10 hidden flex-row items-center gap-3 md:flex">
          <ThemeToggle />
          <SecondaryCta
            label="Entrar em contato"
            ariaLabel="Entrar em contato"
            onClick={() => handleNav('#contact')}
          />
          <SecondaryCta
            label="Começar Agora"
            ariaLabel="Começar agora"
            onClick={() => handleNav('#services')}
          />
        </div>

        <div className="relative z-10 flex flex-row items-center gap-2 md:hidden">
          <SecondaryCta
            label="Começar"
            ariaLabel="Começar agora"
            onClick={() => handleNav('#services')}
            className="!px-4 !py-2 text-sm"
          />
          <ThemeToggle />
          <motion.button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            onClick={toggleMobile}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: FLUID_EASE }}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-ink/[0.05] text-ink backdrop-blur-md transition-colors duration-300 hover:bg-ink/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink touch-target"
          >
            <motion.span
              initial={false}
              animate={{ rotate: mobileOpen ? 90 : 0, opacity: 1 }}
              transition={{ duration: 0.25, ease: FLUID_EASE }}
              className="grid place-items-center will-change-transform"
            >
              {mobileOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
            </motion.span>
          </motion.button>
        </div>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-ink/25 to-transparent md:inset-x-8"
          style={{ opacity: scrolled ? 1 : 0.4 }}
        />
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: FLUID_EASE }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md md:hidden safe-top"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: FLUID_EASE }}
            className="fixed left-1/2 top-[calc(4rem+env(safe-area-inset-top)+1rem)] z-50 max-h-[calc(100dvh-6rem)] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 overflow-y-auto rounded-3xl border border-ink/10 bg-glass-strong p-5 shadow-[0_32px_96px_rgba(0,0,0,0.35)] backdrop-blur-2xl will-change-transform dark:border-white/10 dark:bg-black/80 md:hidden"
          >
            <div className="grid gap-1">
              <Link href="/portal/acesso" onClick={() => setMobileOpen(false)} className="rounded-xl px-5 py-4 text-base font-medium text-ink/85">Minha conta</Link>
              {NAV_ITEMS.map((item: NavItem, i: number) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: FLUID_EASE }}
                  onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    handleNav(item.href);
                  }}
                  className="rounded-xl px-5 py-4 text-base font-medium text-ink/85 transition-colors duration-300 hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink touch-target"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-ink/10 pt-4">
              <SecondaryCta
                label="Contato"
                ariaLabel="Entrar em contato"
                onClick={() => handleNav('#contact')}
                className="w-full py-3"
              />
              <SecondaryCta
                label="Começar"
                ariaLabel="Começar agora"
                onClick={() => handleNav('#services')}
                className="w-full py-3"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Header;
