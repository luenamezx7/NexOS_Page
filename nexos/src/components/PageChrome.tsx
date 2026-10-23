'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

const PAGE_LINKS = [
  { href: '/placa-nfc', label: 'Placa NFC' },
  { href: '/criacao-de-sites', label: 'Serviços' },
  { href: '/portal/acesso', label: 'Minha conta' },
];

/** Shared navigation for reading, service and account pages. */
export function PageHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="page-header" role="banner" data-page-header>
      <a href="#main-content" className="page-skip-link">Pular para o conteúdo</a>
      <Link href="/" className="page-header-brand" aria-label="NexOS — página inicial"><BrandMark /></Link>
      <nav className="page-header-nav" aria-label="Navegação de páginas">
        {PAGE_LINKS.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <div className="page-header-actions">
        {children}
        <Link href="/" className="page-back-link"><ArrowLeft size={16} aria-hidden="true" /><span>Voltar ao site</span></Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function PageFooter() {
  return (
    <footer className="page-footer">
      <p>© {new Date().getFullYear()} NexOS Lab.</p>
      <nav aria-label="Links institucionais">
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos</Link>
        <Link href="/cookies">Cookies</Link>
        <a href="mailto:nexosperformance@gmail.com">Fale com a NexOS <ArrowUpRight size={13} aria-hidden="true" /></a>
      </nav>
    </footer>
  );
}
