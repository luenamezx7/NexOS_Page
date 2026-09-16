'use client';

import { useCallback, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion, useScroll, useMotionValueEvent } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { config } from '@/config';

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
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: FLUID_EASE }}
      className={`btn-primary-nex will-change-transform ${className}`}
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
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: FLUID_EASE }}
      className={`btn-secondary-nex will-change-transform ${className}`}
    >
      {label}
    </motion.button>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

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
        className="glass-header will-change-transform fixed top-6 left-1/2 z-50 flex w-[85%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full px-6 py-2.5"
      >
        <div className="glass-header-reflex" aria-hidden="true" />

        <a
          href="#hero"
          aria-label={`${config.brand.name} — Início`}
          onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleNav('#hero');
          }}
          className="relative z-10 flex items-center rounded-full transition-opacity duration-300 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Image
            src="/logo_nexOS.png"
            alt="NexOS"
            width={112}
            height={28}
            className="h-7 w-auto object-contain"
            priority
          />
        </a>

        <nav className="relative z-10 hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {NAV_ITEMS.map((item: NavItem) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                handleNav(item.href);
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium tracking-[-0.01em] text-white/70 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="relative z-10 hidden flex-row items-center gap-3 md:flex">
          <SecondaryCta
            label="Entrar em contato"
            ariaLabel="Entrar em contato"
            onClick={() => handleNav('#contact')}
          />
          <PrimaryCta
            label="Começar Agora"
            ariaLabel="Começar agora"
            onClick={() => handleNav('#services')}
          />
        </div>

        <div className="relative z-10 flex flex-row items-center gap-3 md:hidden">
          <PrimaryCta
            label="Começar"
            ariaLabel="Começar agora"
            onClick={() => handleNav('#services')}
            className="!px-5 !py-2.5"
          />
          <motion.button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            onClick={toggleMobile}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: FLUID_EASE }}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
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
            className="fixed left-1/2 top-24 z-50 w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 rounded-3xl border border-white/10 bg-black/80 p-5 shadow-[0_32px_96px_rgba(0,0,0,0.65)] backdrop-blur-xl will-change-transform md:hidden"
          >
            <div className="grid gap-1">
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
                  className="rounded-xl px-5 py-3.5 text-[15px] font-medium text-white/85 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <SecondaryCta
                label="Contato"
                ariaLabel="Entrar em contato"
                onClick={() => handleNav('#contact')}
                className="w-full"
              />
              <PrimaryCta
                label="Começar"
                ariaLabel="Começar agora"
                onClick={() => handleNav('#services')}
                className="w-full !px-5"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Header;
