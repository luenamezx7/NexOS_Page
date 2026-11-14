'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';
import { ProfileOrb } from './ProfileOrb';
import { LanguageSwitch } from './LanguageSwitch';
import { publicTranslationPaths, useLocale } from '@/lib/locale';

const PAGE_LINKS = [
  { href: '/placa-nfc', label: 'Placa NFC' },
  { href: '/criacao-de-sites', label: 'Serviços' },
  { href: '/portal/acesso', label: 'Minha conta' },
];

/** Shared navigation for reading, service and account pages. */
export function PageHeader({ children, accountOnly = false }: { children?: ReactNode; accountOnly?: boolean }) {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <header className="page-header" role="banner" data-page-header>
      <a href="#main-content" className="page-skip-link">{t('Pular para o conteúdo')}</a>
       <Link href="/" className="page-header-brand" aria-label={`ezway — ${t('página inicial')}`}><BrandMark registered /></Link>
       {!accountOnly && <nav className="page-header-nav" aria-label={t('Navegação de páginas')}>
         {PAGE_LINKS.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{href === '/portal/acesso' && <ProfileOrb />}{t(label)}</Link>)}
       </nav>}
      <div className="page-header-actions">
        {children}
        {publicTranslationPaths.has(pathname) && <LanguageSwitch />}
        <Link href="/" className="page-back-link"><ArrowLeft size={16} aria-hidden="true" /><span>{t('Voltar ao site')}</span></Link>
      </div>
    </header>
  );
}

export function PageFooter() {
  const { t } = useLocale();
  return (
    <footer className="page-footer">
      <p>© {new Date().getFullYear()} ezway.</p>
       <nav aria-label={t('Links institucionais')}>
        <Link href="/privacidade">{t('Privacidade')}</Link>
        <Link href="/termos">{t('Termos')}</Link>
        <Link href="/cookies">Cookies</Link>
        <a href="mailto:nexosperformance@gmail.com">{t('Fale com a ezway')} <ArrowUpRight size={13} aria-hidden="true" /></a>
      </nav>
    </footer>
  );
}
