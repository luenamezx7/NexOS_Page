'use client';

/**
 * Footer — glass-footer, Signature (Lastoria), links.
 * Redes sociais, links legais, copyright.
 */
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, GitBranch, MessageSquare } from 'lucide-react';
import { config } from '@/config';
import type { FooterLink } from '@/types';
import { Signature } from './signature';
import albinoTiger from '../../design-/img-ref/tigre_albino_capuz_fino.svg';
import { BrandVeil } from './ui/brand-veil';
import { cn } from '@/lib/utils';
import { openCookiePreferences } from './cookie-consent';
import styles from './MidPage.module.css';

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  GitBranch,
  Instagram: InstagramIcon,
  MessageSquare,
} as const;

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <nav
      aria-label={title}
    >
      <h3 className={styles.colTitle}>{title}</h3>
      <ul className={styles.colList}>
        {links.map((link: FooterLink) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className={styles.colLink}>
              <span>{link.label}</span>
              <ArrowUpRight size={13} strokeWidth={2} className={styles.colLinkArrow} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer({ onViewPresentation }: { onViewPresentation?: () => void } = {}) {
  const currentYear: number = new Date().getFullYear();

  return (
    <footer role="contentinfo" className={cn(styles.footerSection, 'oceanic-surface')}>
      <BrandVeil />
      <div className={styles.footerInner}>
        <div
          className={styles.footerGrid}
        >
          <div
            className={styles.brandBlock}
          >
            <Link href="/" className={styles.brandLink} aria-label={`${config.brand.name} — Página inicial`}>
              <span aria-hidden="true">
                <Signature text={config.brand.name} fontSize={72} duration={1.2} inView color="currentColor" className={styles.brandSignature} />
              </span>
              <Image src={albinoTiger} alt="Mascote tigre albino da NexOS com viseira roxa" width={48} height={48} className={styles.brandMascot} />
            </Link>
            <p className={styles.brandTag}>{config.brand.tagline}</p>
            <p className={styles.brandDesc}>
              {config.brand.fullName}, também conhecida como {config.brand.alternateNames.join(' e ')}, desenvolve sites, landing pages, cardápios digitais e soluções NFC para empresas.
            </p>
            <p className={styles.brandAddress}>CNPJ 69.194.842/0001-28</p>
            <div className={styles.socials} role="list" aria-label="Redes sociais">
              {config.footer.social.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon as keyof typeof SOCIAL_ICONS] ?? MessageSquare;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="listitem"
                    aria-label={social.label}
                    className={styles.socialLink}
                  >
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Serviços" links={config.footer.links} />
          <FooterColumn
            title="Empresa"
            links={[
              { label: 'Contato', href: '/#cta-final' },
              { label: 'Sobre Nós', href: '/#testimonials' },
              { label: 'Serviços', href: '/#services' },
            ]}
          />
          <FooterColumn title="Legal" links={config.footer.legal} />
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {currentYear} {config.brand.name}. Todos os direitos reservados.
          </p>
          <div className={styles.footerMeta}>
            {onViewPresentation && <button type="button" onClick={onViewPresentation} className={`${styles.cookieBtn} presentation-replay`}>Ver apresentação</button>}
            <button type="button" onClick={openCookiePreferences} className={styles.cookieBtn}>
              Gerenciar cookies
            </button>
            <p className={styles.statusLine}>
              <span className={styles.statusDot} aria-hidden="true" />
              Em desenvolvimento · Global
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
