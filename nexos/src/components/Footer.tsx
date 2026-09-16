'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { GitBranch, Building2, MessageSquare, ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import type { FooterLink } from '@/types';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const RELIEF_CHILD: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: FLUID_EASE },
  },
};

const SOCIAL_ICONS = {
  GitBranch,
  Building2,
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
      <h3 className="mb-5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link: FooterLink) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="group inline-flex flex-row items-center gap-1.5 text-sm text-white/65 transition-colors duration-300 hover:text-white"
            >
              <span>{link.label}</span>
              <ArrowUpRight
                size={13}
                strokeWidth={2}
                className="text-[#ff2e6a] opacity-0 transition-all duration-300 group-hover:translate-x-px group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}

export function Footer() {
  const reduce = useReducedMotion() ?? false;
  const currentYear: number = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="glass-footer relative bg-[#050505]">
      <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-16 md:px-8 md:pt-20">
        <motion.div
          variants={reduce ? undefined : STAGGER_PARENT}
          initial={reduce ? { opacity: 0 } : 'hidden'}
          whileInView={reduce ? { opacity: 1 } : 'show'}
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8"
        >
          <motion.div
            variants={reduce ? undefined : RELIEF_CHILD}
            initial={reduce ? { opacity: 0 } : undefined}
            whileInView={reduce ? { opacity: 1 } : undefined}
            viewport={{ once: true, amount: 0.4 }}
            transition={reduce ? { duration: 0.4 } : undefined}
            className="lg:col-span-2"
          >
            <Link href="/" className="inline-flex flex-row items-center gap-2.5" aria-label={`${config.brand.name} — Página inicial`}>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white font-display text-sm font-bold tracking-tight text-black" aria-hidden="true">
                {config.brand.logo}
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">{config.brand.name}</span>
            </Link>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              {config.brand.tagline}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              Construímos produtos digitais que escalam. Da ideia ao mercado com velocidade e qualidade.
            </p>
            <div className="mt-6 flex flex-row items-center gap-2.5" role="list" aria-label="Redes sociais">
              {config.footer.social.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon as keyof typeof SOCIAL_ICONS] ?? MessageSquare;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="listitem"
                    aria-label={social.label}
                    whileHover={reduce ? undefined : { y: -3 }}
                    transition={{ duration: 0.3, ease: FLUID_EASE }}
                    className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/65 transition-colors duration-300 hover:border-pink-500/40 hover:text-white will-change-transform"
                  >
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </motion.a>
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

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
          <p className="text-xs text-white/40">
            © {currentYear} {config.brand.name}. Todos os direitos reservados.
          </p>
          <p className="flex flex-row items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/35">
            <span className="pink-marker" aria-hidden="true" />
            São Paulo · Remoto global
          </p>
        </div>
      </div>
    </footer>
  );
}
