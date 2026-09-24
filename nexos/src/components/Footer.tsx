'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowUpRight, GitBranch, MessageSquare } from 'lucide-react';
import { config } from '@/config';
import type { FooterLink } from '@/types';
import { Signature } from './signature';
import { useTheme } from './ThemeProvider';
import { openCookiePreferences } from './cookie-consent';
import styles from './MidPage.module.css';

const FLUID_EASE = [0.16, 1, 0.3, 1] as const;

const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const RELIEF_CHILD: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: FLUID_EASE },
  },
};

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
  reduceMotion: boolean;
}

function FooterColumn({ title, links, reduceMotion }: FooterColumnProps) {
  return (
    <motion.nav
      variants={reduceMotion ? undefined : RELIEF_CHILD}
      initial={reduceMotion ? { opacity: 0 } : undefined}
      whileInView={reduceMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, amount: 0.4 }}
      transition={reduceMotion ? { duration: 0.4 } : undefined}
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
    </motion.nav>
  );
}

export function Footer() {
  const reduce = useReducedMotion() ?? false;
  const { theme } = useTheme();
  const currentYear: number = new Date().getFullYear();

  return (
    <footer role="contentinfo" className={styles.footerSection}>
      <div className={styles.footerInner}>
        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.2 }}
          className={styles.footerGrid}
        >
          <motion.div
            variants={reduce ? undefined : RELIEF_CHILD}
            initial={reduce ? { opacity: 0 } : undefined}
            whileInView={reduce ? { opacity: 1 } : undefined}
            viewport={{ once: true, amount: 0.4 }}
            transition={reduce ? { duration: 0.4 } : undefined}
            className={styles.brandBlock}
          >
            <Link href="/" className={styles.brandLink} aria-label={`${config.brand.name} — Página inicial`}>
              <span className={styles.brandMark} aria-hidden="true">{config.brand.logo}</span>
              <span aria-hidden="true" className="inline-flex items-center overflow-visible shrink-0">
                <Signature
                  text={config.brand.name}
                  fontSize={36}
                  duration={1.2}
                  inView={true}
                  color={theme === 'dark' ? '#FFFFFF' : '#131316'}
                  className="h-9 w-auto overflow-visible shrink-0"
                />
              </span>
            </Link>
            <p className={styles.brandTag}>{config.brand.tagline}</p>
            <p className={styles.brandDesc}>
              Construímos soluções digitais para seu negócio. Da ideia ao mercado com velocidade e qualidade.
            </p>
            <address className={styles.brandAddress}>
              CNPJ 69.194.842/0001-28 · Rua Joaquim Anicacio Pinto, 0 — Residencial Prefeito Ely Rocha · Piracanjuba/GO · CEP 75643-242
            </address>
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
          </motion.div>

          <FooterColumn title="Serviços" links={config.footer.links} reduceMotion={reduce} />
          <FooterColumn
            title="Empresa"
            reduceMotion={reduce}
            links={[
              { label: 'Contato', href: '#contact' },
              { label: 'Cases', href: '#testimonials' },
              { label: 'Serviços', href: '#services' },
            ]}
          />
          <FooterColumn title="Legal" links={config.footer.legal} reduceMotion={reduce} />
        </motion.div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {currentYear} {config.brand.name}. Todos os direitos reservados.
          </p>
          <div className={styles.footerMeta}>
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
