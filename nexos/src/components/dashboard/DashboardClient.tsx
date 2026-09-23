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
  supabase: { ok?: boolean };
  notion: { ok?: boolean; configured?: boolean; error?: string };
  cloudflare: { ok?: boolean; configured?: boolean };
  asaas: { configured?: boolean };
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

  const handleLogout = async () => {
    setLoading(true); setMsg(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
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
  const asaasOk = asaasDiag?.configured ?? null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="font-display text-lg font-black tracking-tighter">NexOS — Dashboard Técnica</h1>
            <p className="font-mono text-[11px] text-ink/40">{user.email} • {new Date().toLocaleString('pt-BR')}</p>
          </div>
          <button disabled={loading} onClick={handleLogout} className="btn-secondary-nex !px-4 !py-2 text-xs">{loading ? 'Saindo…' : 'Sair'}</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {msg && <p role="alert" className="mb-4 text-sm">{msg}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Supabase" ok={supaOk} detail={supaOk ? 'Conectado' : 'Falha — verifique publishable key'} sub={supaDiag?.ok !== undefined ? `status: ${supaDiag.ok ? 'ok' : 'error'}` : ''} />
          <Card title="Notion (contato)" ok={notionOk} detail={notionOk ? 'Token + Database OK' : (notionDiag?.error ?? 'Desconfigurado')} sub={`configured:${String(notionDiag?.configured)}`} />
          <Card title="Asaas (checkout)" ok={asaasOk} detail={asaasOk ? 'production • key OK' : 'ASAAS_API_KEY faltando'} />
          <Card title="Cloudflare" ok={null} detail="nexoslab.online Pending — verificando nameservers (segundo plano)" sub="A 216.198.79.1 + CNAME www Proxied, _domainconnect removido" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="bento-card p-5 lg:col-span-2">
            <h2 className="text-sm font-bold">Diagnóstico Administrativo</h2>
            <pre className="mt-3 max-h-[320px] overflow-auto rounded-lg bg-ink/[0.04] p-3 font-mono text-[11px] leading-relaxed">{JSON.stringify(diagnostics, null, 2)}</pre>
          </div>
          <div className="bento-card p-5">
            <h2 className="text-sm font-bold">Ações</h2>
            <div className="mt-3 flex flex-col gap-2">
              <a href="/api/supabase/health" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Abrir /api/supabase/health</a>
              <a href="/api/cloudflare/verify" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Abrir /api/cloudflare/verify</a>
              <a href="https://supabase.com/dashboard/project/lgfttyeezviecfqbbmqk" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Supabase Dashboard</a>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Cloudflare Dash</a>
            </div>
            <p className="mt-4 font-mono text-[10px] text-ink/35">Constituição: .agents/skills/SKILL-SUPABASE/CONSTITUICAO-SUPABASE.md (contexto NexOS preenchido). RLS: ativar em tabelas públicas antes de expor via Data API.</p>
          </div>
        </div>

        <div className="mt-6 bento-card p-5">
          <h2 className="text-sm font-bold">Próximos passos (constituição §13)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-ink/60">
            <li>Criar tabelas `contacts`/`orders` com RLS + policies `TO authenticated` + `USING (auth.uid()=owner)` — não usar `auth.role()`.</li>
            <li>Quando Cloudflare virar `Active`, habilitar `Full (strict)` + `WAF ON` + `Bot Fight Mode`.</li>
            <li>Definir `DASHBOARD_ADMIN_USER_IDS` no Vercel para allowlist.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
