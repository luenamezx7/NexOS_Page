'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { LEGAL_DOCS, getLegalDoc } from './legal-content';
import { CloudflareEmailBoundary } from './CloudflareEmailBoundary';
import { PageFooter, PageHeader } from './PageChrome';

export function LegalPage({ slug }: { slug: string }) {
  const doc = getLegalDoc(slug);

  return (
    <CloudflareEmailBoundary>
    <div className="interior-page">
    <PageHeader />
    <main id="main-content" className="page-narrow">
        <div className="page-intro">
          <p className="page-kicker">NexOS / Legal</p>
          <h1 className="page-title">{doc.title}</h1>
          <p className="mt-4 text-sm text-[var(--text-tertiary)]">{doc.updated}</p>
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-[var(--text-secondary)]">{doc.intro}</p>
        </div>

        <nav aria-label="Documentos legais" className="page-tabs">
          {LEGAL_DOCS.map((d) => {
            const active = d.slug === doc.slug;
            return (
              <Link
                key={d.slug}
                href={`/${d.slug}`}
                aria-current={active ? 'page' : undefined}
                className="page-tab"
              >
                {d.tab}
              </Link>
            );
          })}
        </nav>

        <div className="page-panel legal-document">
          {doc.sections.map((s) => (
            <section key={s.heading} aria-label={s.heading}>
              <h2>{s.heading}</h2>
              <p className="mt-4 max-w-[65ch] text-base leading-7 text-[var(--text-secondary)]">{s.body}</p>
            </section>
          ))}
          <p className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-5 text-sm text-[var(--text-tertiary)]">
            <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
            Dúvidas? nexosperformance@gmail.com · +55 64 99328-9250
          </p>
        </div>
    </main>
    <PageFooter />
    </div>
    </CloudflareEmailBoundary>
  );
}

export default LegalPage;
