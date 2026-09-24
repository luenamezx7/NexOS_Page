'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Cloud,
  Database,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import styles from './Dashboard.module.css';

function StatusDot({ ok }: { ok: boolean | null }) {
  const cls = ok === true ? styles.dotOk : ok === false ? styles.dotFail : '';
  return <span className={`${styles.dot} ${cls}`.trim()} aria-hidden="true" />;
}

function ServiceCard({
  title,
  ok,
  detail,
  sub,
  icon,
}: {
  title: string;
  ok: boolean | null;
  detail: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  const label = ok === true ? 'Operacional' : ok === false ? 'Com falha' : 'Não verificado';
  return (
    <article className={styles.card} aria-label={`${title}: ${label}`}>
      <div className={styles.cardTop}>
        <span className={styles.cardTitle}>
          {icon}
          {title}
        </span>
        <StatusDot ok={ok} />
      </div>
      <p className={styles.cardDetail}>{detail}</p>
      <p className={styles.cardSub}>{sub ?? label}</p>
    </article>
  );
}

type Diagnostics = {
  checkedAt: string;
  supabase: { ok?: boolean };
  notion: { ok?: boolean; configured?: boolean; error?: string };
  cloudflare: { ok?: boolean; configured?: boolean };
  asaas: { configured?: boolean; environment?: string };
};

export function DashboardClient({
  user,
  isAllowed,
  diagnostics,
}: {
  user: { email: string; is_anonymous?: boolean } | null;
  isAllowed: boolean;
  diagnostics?: Diagnostics;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supaDiag = diagnostics?.supabase;
  const notionDiag = diagnostics?.notion;
  const asaasDiag = diagnostics?.asaas;
  const cloudflareDiag = diagnostics?.cloudflare;

  const handleLogout = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error();
      router.replace('/admin-dashboard-su/secure-entry');
    } catch {
      setMsg('Não foi possível sair. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAllowed) return null;

  const supaOk = supaDiag?.ok ?? null;
  const notionOk = notionDiag?.ok ?? null;
  const asaasOk = asaasDiag?.configured ? null : false;
  const checkedAt = diagnostics?.checkedAt
    ? diagnostics.checkedAt.replace('T', ' ').slice(0, 19)
    : '—';

  return (
    <div className={styles.page}>
      <header className={styles.header} role="banner">
        <div className={styles.headerInner}>
          <div className={styles.brandRow}>
            <span className={styles.mark} aria-hidden="true">
              NX
            </span>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>NexOS — Dashboard Técnica</h1>
              <p className={styles.meta}>
                {user.email} · {checkedAt} UTC
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              disabled={loading}
              onClick={handleLogout}
              className={`${styles.logout} btn-secondary-nex`}
            >
              {loading ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {msg && (
          <p role="alert" className={styles.alert}>
            {msg}
          </p>
        )}

        <div className={styles.sectionLabel}>
          <h2>Integrações</h2>
          <span>Saúde em tempo de requisição</span>
        </div>

        <div className={styles.statusGrid}>
          <ServiceCard
            title="Supabase"
            ok={supaOk}
            icon={<Database size={14} strokeWidth={1.75} aria-hidden="true" />}
            detail={
              supaOk
                ? 'Consulta de pedidos pelo servidor: OK.'
                : 'Falha na consulta: confira chave secreta, schema e permissões.'
            }
          />
          <ServiceCard
            title="Notion"
            ok={notionOk}
            icon={<Cloud size={14} strokeWidth={1.75} aria-hidden="true" />}
            detail={
              notionOk
                ? 'Token e acesso ao database de contato: OK.'
                : notionDiag?.configured
                  ? 'Configurado, mas a consulta falhou.'
                  : 'Integração de contato não configurada.'
            }
          />
          <ServiceCard
            title="Asaas"
            ok={asaasOk}
            icon={<Zap size={14} strokeWidth={1.75} aria-hidden="true" />}
            detail={
              asaasDiag?.configured
                ? `Chave presente · ${asaasDiag.environment}. Conectividade não testada.`
                : 'ASAAS_API_KEY ausente no ambiente.'
            }
          />
          <ServiceCard
            title="Cloudflare"
            ok={cloudflareDiag?.ok ?? null}
            icon={<ShieldCheck size={14} strokeWidth={1.75} aria-hidden="true" />}
            detail={
              cloudflareDiag?.ok
                ? 'Token verificado e ativo.'
                : cloudflareDiag?.configured
                  ? 'Falha ao verificar o token.'
                  : 'Token não configurado.'
            }
          />
        </div>

        <div className={styles.bodyGrid}>
          <section className={styles.panel} aria-labelledby="diag-title">
            <h2 id="diag-title">Diagnóstico bruto</h2>
            <pre className={styles.json}>{JSON.stringify(diagnostics, null, 2)}</pre>
          </section>

          <section className={styles.panel} aria-labelledby="actions-title">
            <h2 id="actions-title">Ações rápidas</h2>
            <div className={styles.actionList}>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="btn-secondary-nex"
              >
                <span>Atualizar diagnóstico</span>
                <RefreshCw size={15} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <a href="/api/supabase/health" target="_blank" rel="noreferrer">
                <span>API Supabase health</span>
                <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
              </a>
              <a href="/api/cloudflare/verify" target="_blank" rel="noreferrer">
                <span>API Cloudflare verify</span>
                <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
              </a>
              <a
                href="https://supabase.com/dashboard/project/lgfttyeezviecfqbbmqk"
                target="_blank"
                rel="noreferrer"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" />
              </a>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">
                <span>Cloudflare Dash</span>
                <ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>

        <aside className={styles.note} aria-labelledby="scope-title">
          <h2 id="scope-title">Escopo do diagnóstico</h2>
          <p>
            Esta tela verifica acesso às integrações. A presença de uma chave não garante que
            pagamentos, DNS ou envio de e-mails estejam operacionais. Diagnósticos disponíveis
            apenas para administradores autorizados com e-mail confirmado e MFA. Consulte
            SECURITY.md para os requisitos de implantação.
          </p>
        </aside>
      </main>
    </div>
  );
}
