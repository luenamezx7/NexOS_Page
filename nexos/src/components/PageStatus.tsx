import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { PageFooter, PageHeader } from './PageChrome';

/** Branded status layout, also used when a protected page cannot load its session. */
export function PageStatus({ label, title, description, alert = false }: {
  label: string; title: string; description: string; alert?: boolean;
}) {
  return (
    <div className="interior-page">
      <PageHeader />
      <main className="page-narrow page-status" id="main-content">
        <div className="page-panel page-status-panel">
          <p className="page-kicker">NexOS / {label}</p>
          <h1 className="page-title">{title}</h1>
          <p role={alert ? 'alert' : undefined}>{description}</p>
          <div className="page-status-actions">
            <Link href="/" className="btn-primary-nex"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao site</Link>
            <a href="mailto:nexosperformance@gmail.com" className="page-text-link">Falar com a NexOS <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
