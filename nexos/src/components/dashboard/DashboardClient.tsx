'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function StatusDot({ ok }: { ok: boolean | null }) {
  const cls = ok === true ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ok === false ? 'bg-red-500' : 'bg-amber-400';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} aria-hidden="true" />;
}

function Card({ title, ok, detail, sub }: { title: string; ok: boolean | null; detail: string; sub?: string }) {
  return (
    <div className="bento-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        <StatusDot ok={ok} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink/60">{detail}</p>
      {sub && <p className="mt-1 font-mono text-[10px] text-ink/35">{sub}</p>}
    </div>
  );
}

type Diagnostics = {
  checkedAt: string;
  supabase: { ok?: boolean };
  notion: { ok?: boolean; configured?: boolean; error?: string };
  cloudflare: { ok?: boolean; configured?: boolean };
  asaas: { configured?: boolean; environment?: string };
};

export function DashboardClient({ user, isAllowed, diagnostics }: {
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
    setLoading(true); setMsg(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error();
      router.replace('/login'); router.refresh();
    } catch { setMsg('Não foi possível sair. Tente novamente.'); }
    finally { setLoading(false); }
  };

  if (!user || !isAllowed) {
    return null;
  }

  const supaOk = supaDiag?.ok ?? null;
  const notionOk = notionDiag?.ok ?? null;
  const asaasOk = asaasDiag?.configured ? null : false;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="font-display text-lg font-black tracking-tighter">NexOS — Dashboard Técnica</h1>
            <p className="font-mono text-[11px] text-ink/60">{user.email} • Atualizado: {diagnostics?.checkedAt.replace('T', ' ').slice(0, 19)} UTC</p>
          </div>
          <button disabled={loading} onClick={handleLogout} className="btn-secondary-nex !px-4 !py-2 text-xs">{loading ? 'Saindo…' : 'Sair'}</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {msg && <p role="alert" className="mb-4 text-sm">{msg}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Supabase" ok={supaOk} detail={supaOk ? 'Consulta de pedidos pelo servidor: OK' : 'Falha na consulta: confira chave secreta, schema e permissões.'} />
          <Card title="Notion (contato)" ok={notionOk} detail={notionOk ? 'Token e acesso ao database: OK' : notionDiag?.configured ? 'Configurado, mas a consulta falhou.' : 'Integração não configurada.'} />
          <Card title="Asaas (checkout)" ok={asaasOk} detail={asaasDiag?.configured ? `Chave presente • ${asaasDiag.environment}. Conectividade não testada.` : 'ASAAS_API_KEY faltando'} />
          <Card title="Cloudflare" ok={cloudflareDiag?.ok ?? null} detail={cloudflareDiag?.ok ? 'Token verificado e ativo.' : cloudflareDiag?.configured ? 'Falha ao verificar o token.' : 'Token não configurado.'} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="bento-card p-5 lg:col-span-2">
            <h2 className="text-sm font-bold">Diagnóstico Administrativo</h2>
            <pre className="mt-3 max-h-[320px] overflow-auto rounded-lg bg-ink/[0.04] p-3 font-mono text-[11px] leading-relaxed">{JSON.stringify(diagnostics, null, 2)}</pre>
          </div>
          <div className="bento-card p-5">
            <h2 className="text-sm font-bold">Ações</h2>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => router.refresh()} className="btn-secondary-nex justify-center text-xs">Atualizar diagnóstico</button>
              <a href="/api/supabase/health" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Abrir /api/supabase/health</a>
              <a href="/api/cloudflare/verify" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Abrir /api/cloudflare/verify</a>
              <a href="https://supabase.com/dashboard/project/lgfttyeezviecfqbbmqk" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Supabase Dashboard</a>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Cloudflare Dash</a>
            </div>
            <p className="mt-4 text-xs text-ink/60">Diagnósticos disponíveis apenas para administradores autorizados com e-mail confirmado e MFA.</p>
          </div>
        </div>

        <div className="mt-6 bento-card p-5">
          <h2 className="text-sm font-bold">Escopo do diagnóstico</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink/60">Esta tela verifica acesso às integrações. A presença de uma chave não garante que pagamentos, DNS ou envio de e-mails estejam operacionais. Consulte SECURITY.md para os requisitos de implantação.</p>
        </div>
      </main>
    </div>
  );
}
