'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { LEGAL_DOCS, getLegalDoc } from './legal-content';
import { useTheme } from './ThemeProvider';
import { CloudflareEmailBoundary } from './CloudflareEmailBoundary';

export function LegalPage({ slug }: { slug: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const doc = getLegalDoc(slug);

  return (
    <CloudflareEmailBoundary>
    <main className="page-surface min-h-screen text-ink">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          Voltar ao site
        </Link>

        <div className="mt-6 border-b border-ink/12 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#be185d]">NexOS · Legal</p>
          <h1 className="brand-heading mt-2 text-balance">{doc.title}</h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/40">{doc.updated}</p>
          <p className="mt-4 text-base leading-relaxed text-ink/70">{doc.intro}</p>
        </div>

        <nav aria-label="Documentos legais" className="mt-6 flex flex-wrap gap-2">
          {LEGAL_DOCS.map((d) => {
            const active = d.slug === doc.slug;
            return (
              <Link
                key={d.slug}
                href={`/${d.slug}`}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[40px] items-center rounded-lg px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                  active
                    ? 'bg-[image:var(--action-gradient)] text-white'
                    : isDark
                      ? 'border border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white'
                      : 'border border-ink/10 bg-ink/[0.04] text-ink/60 hover:bg-ink/10 hover:text-ink'
                }`}
              >
                {d.tab}
              </Link>
            );
          })}
        </nav>

        <div className="surface-glass mt-8 flex flex-col gap-7 p-7 md:p-9">
          {doc.sections.map((s) => (
            <section key={s.heading} aria-label={s.heading}>
              <h2 className="!text-xl text-ink">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
            </section>
          ))}
          <p className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">
            <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
            Dúvidas? nexosperformance@gmail.com · +55 64 99328-9250
          </p>
        </div>
      </div>
    </main>
    </CloudflareEmailBoundary>
  );
}

export default LegalPage;
