'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Footer.module.css';
import { config } from '@/config';
import Link from 'next/link';
import { GitBranch, Building2, MessageSquare, ArrowRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <footer
      ref={footerRef}
      className={styles.footer}
      role="contentinfo"
      style={{
        '--mouse-x': `${mousePosition.x}px`,
        '--mouse-y': `${mousePosition.y}px`,
      } as React.CSSProperties}
    >
      <div className={styles.backgroundLayer} aria-hidden="true">
        <div className={styles.glowOrb} />
        <div className={styles.glowOrb} />
        <div className={styles.glowOrb} />
        <div className={styles.pixelGrid} />
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label={`${config.brand.name} - Página inicial`}>
              <span className={styles.logoMark} aria-hidden="true">{config.brand.logo}</span>
              <span className={styles.logoText}>{config.brand.name}</span>
            </Link>
            <p className={styles.tagline}>{config.brand.tagline}</p>
            <p className={styles.description}>
              Construímos produtos digitais que escalam. Da ideia ao mercado com velocidade e qualidade.
            </p>
            <div className={styles.social} role="list" aria-label="Redes sociais">
              {config.footer.social.map((social) => {
                const iconMap = { GitBranch: GitBranch, Building2: Building2, MessageSquare: MessageSquare };
                const Icon = iconMap[social.icon as keyof typeof iconMap] || MessageSquare;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={social.label}
                  >
                    <Icon size={20} strokeWidth={2} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>

          <nav className={styles.navSection} aria-label="Serviços">
            <h3 className={styles.navTitle}>Serviços</h3>
            <ul className={styles.navList}>
              {config.footer.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.navLink}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.navSection} aria-label="Empresa">
            <h3 className={styles.navTitle}>Empresa</h3>
            <ul className={styles.navList}>
              <li><Link href="#contact" className={styles.navLink}>Contato</Link></li>
              <li><Link href="/sobre" className={styles.navLink}>Sobre nós</Link></li>
              <li><Link href="/blog" className={styles.navLink}>Blog</Link></li>
              <li><Link href="/carreiras" className={styles.navLink}>Carreiras</Link></li>
            </ul>
          </nav>

          <nav className={styles.navSection} aria-label="Legal">
            <h3 className={styles.navTitle}>Legal</h3>
            <ul className={styles.navList}>
              {config.footer.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.navLink}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} {config.brand.name}. Todos os direitos reservados.
          </p>
          <div className={styles.madeWith}>
            Feito com
            <span role="img" aria-label="amor" className={styles.heart}>♥</span>
            em São Paulo. Deploy no GitHub Pages.
            <ArrowRight size={16} strokeWidth={2} className={styles.arrow} aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
}