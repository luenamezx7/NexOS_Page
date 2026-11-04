'use client';

/**
 * Footer — glass-footer, Signature (Lastoria), links.
 * Redes sociais, links legais, copyright.
 */
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { ArrowUpRight, GitBranch, MessageSquare } from 'lucide-react';
import { config } from '@/config';
import type { FooterLink } from '@/types';
import { BrandMark } from './BrandMark';
import { cn } from '@/lib/utils';
import { openCookiePreferences } from './cookie-consent';
import styles from './MidPage.module.css';
import { ScrollReveal } from './ScrollReveal';
import { commercialHref } from '@/lib/commercial';
import { landingEvidence } from '@/config/landing-evidence';
import { useLocale } from '@/lib/locale';

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

const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  const { t } = useLocale();
  return (
    <ScrollReveal as="nav"
      aria-label={t(title)}
    >
      <h3 className={styles.colTitle}>{t(title)}</h3>
      <ul className={styles.colList}>
        {links.map((link: FooterLink) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className={styles.colLink}>
                <span>{t(link.label)}</span>
              <ArrowUpRight size={13} strokeWidth={2} className={styles.colLinkArrow} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </ScrollReveal>
  );
}

export function Footer({ onViewPresentation }: { onViewPresentation?: () => void } = {}) {
  const { t } = useLocale();
  const currentYear: number = new Date().getFullYear();
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);

  return (
    <footer role="contentinfo" className={cn(styles.footerSection, 'oceanic-surface')}>
      <div className={styles.footerInner}>
        <div
          className={styles.footerGrid}
        >
          <ScrollReveal
            className={styles.brandBlock}
          >
            <Link href="/" className={styles.brandLink} aria-label={`${config.brand.name} — ${t('Página inicial')}`}>
              <BrandMark />
            </Link>
            <p className={styles.brandTag}>{t(config.brand.tagline)}</p>
            <p className={styles.brandDesc}>
              {t('ezway desenvolve sites, landing pages, cardápios digitais e soluções NFC para empresas.')}
            </p>
            <p className={styles.brandAddress}>CNPJ 69.194.842/0001-28</p>
            <div className={styles.socials} role="list" aria-label={t('Redes sociais')}>
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
              <a href={commercialHref()} target="_blank" rel="noopener noreferrer" role="listitem" aria-label={t('WhatsApp da ezway')} className={styles.socialLink}><MessageSquare size={18} strokeWidth={1.75} aria-hidden="true" /></a>
              {landingEvidence.linkedInUrl && <a href={landingEvidence.linkedInUrl} target="_blank" rel="noopener noreferrer" role="listitem" aria-label="LinkedIn da ezway" className={styles.socialLink}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M7 10v7m0-10v.01M11 17v-7h3v1c.5-.8 1.3-1.2 2.4-1.2 2.1 0 2.6 1.5 2.6 3.1V17m-8-4v4" /></svg></a>}
            </div>
          </ScrollReveal>

          <FooterColumn title="Serviços" links={config.footer.links} />
          <FooterColumn
            title="Empresa"
            links={[
              { label: 'Contato', href: '/#contact' },
              { label: 'Sobre Nós', href: '/#testimonials' },
            ]}
          />
          <FooterColumn title="Legal" links={config.footer.legal} />
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
             © {currentYear} {config.brand.name}. {t('Todos os direitos reservados.')}
          </p>
          <div className={styles.footerMeta}>
             {onViewPresentation && <button type="button" disabled={!hydrated} aria-haspopup="dialog" onClick={onViewPresentation} className={`${styles.cookieBtn} presentation-replay`}>{t('Ver apresentação')}</button>}
            <button type="button" onClick={openCookiePreferences} className={styles.cookieBtn}>
              {t('Gerenciar cookies')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
