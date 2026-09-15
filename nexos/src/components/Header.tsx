'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';
import { config } from '@/config';
import { Button } from './ui/Button';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = config.navigation;

  return (
    <header
      ref={headerRef}
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
      role="banner"
    >
      <div className={styles.container}>
      <a
        href="#hero"
        className={styles.logo}
        aria-label={`${config.brand.name} - Início`}
        onClick={(e) => {
          e.preventDefault();
          const hero = document.getElementById('hero');
          if (hero) {
            hero.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
  <Image
    src="/logo_nexOS.png"
    alt="NexOS Logo"
    width={120}
    height={120}
    className="w-32 h-32 object-contain"
  />
</a>

        <nav className={`${styles.nav} ${mobileOpen ? styles.navOpen : ''}`} role="navigation" aria-label="Navegação principal">
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navLink}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.navCta}>
            <Button variant="ghost" size="sm">
              <a href="#contact">Entrar em contato</a>
            </Button>
            <Button variant="primary" size="sm">
              <a href="#services">Iniciar projeto</a>
            </Button>
          </div>
        </nav>

        <div className={styles.mobileActions}>
          <Button
            variant="ghost"
            size="sm"
            className={styles.ctaMobile}
          >
            <a href="#contact">Contato</a>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className={styles.ctaMobile}
          >
            <a href="#services">Iniciar</a>
          </Button>
          <button
            className={styles.menuButton}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="main-navigation"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      <div className={`${styles.borderGlow} ${scrolled ? styles.borderGlowVisible : ''}`} aria-hidden="true" />
    </header>
  );
}