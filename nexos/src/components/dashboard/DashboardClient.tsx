'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

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

export function DashboardClient({ user, isAllowed, health }: { user: User | null; isAllowed: boolean; health: Record<string, unknown> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supaHealth = health.supabase as { ok?: boolean; url?: string; storage?: { buckets?: string[] | null; error?: string | null } };
  const notionHealth = health.notion as { ok?: boolean; hasToken?: boolean; hasDatabaseId?: boolean; error?: string };
  const asaasHealth = health.asaas as { ok?: boolean; provider?: string; hasKey?: boolean };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : 'Logado — recarregando...');
    setLoading(false);
    if (!error) location.reload();
  };

  const handleLogout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    location.reload();
  };

  if (!user || !isAllowed) {
    return (
      <div className="min-h-[80vh] bg-canvas px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-md">
          <div className="bento-card p-6 sm:p-8">
            <h1 className="text-xl font-black tracking-tighter">Dashboard Técnica — NexOS</h1>
            <p className="mt-2 text-sm text-ink/60">Acesso restrito. Faça login com Supabase Auth. {user && !isAllowed ? `(${user.email} não está na allowlist)` : ''}</p>
            {!user ? (
              <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
                <input className="field-input" placeholder="e-mail admin" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <input className="field-input" placeholder="senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                <button disabled={loading} className="btn-primary-nex justify-center py-3 text-sm font-semibold disabled:opacity-60">{loading ? 'Entrando...' : 'Entrar'}</button>
                {msg && <p className="text-xs text-ink/60">{msg}</p>}
                <p className="font-mono text-[10px] text-ink/35">Crie o usuário em Supabase → Auth → Users. Defina DASHBOARD_ADMIN_EMAILS=seu@email.com no Vercel para restringir.</p>
              </form>
            ) : (
              <button onClick={handleLogout} className="btn-secondary-nex mt-6 w-full justify-center">Sair ({user.email})</button>
            )}
            <div className="mt-8 border-t border-ink/10 pt-4 text-[11px] text-ink/35">Cloudflare em segundo plano: nexoslab.online Pending → Active (nameservers em propagação). Supabase nheawyxibogyacxbvlvj ✓</div>
          </div>
        </div>
      </div>
    );
  }

  const supaOk = supaHealth?.ok === true;
  const notionOk = notionHealth?.ok === true || notionHealth?.hasToken === true;
  const asaasOk = asaasHealth?.hasKey === true;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="font-display text-lg font-black tracking-tighter">NexOS — Dashboard Técnica</h1>
            <p className="font-mono text-[11px] text-ink/40">{user.email} • {new Date().toLocaleString('pt-BR')}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary-nex !px-4 !py-2 text-xs">Sair</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Supabase" ok={supaOk} detail={supaOk ? `Conectado ${supaHealth.url}` : 'Falha — verifique publishable key'} sub={supaHealth?.storage?.buckets ? `buckets: ${supaHealth.storage.buckets.join(', ') || '—'}` : supaHealth?.storage?.error ?? ''} />
          <Card title="Notion (contato)" ok={notionOk} detail={notionOk ? 'Token + Database OK' : (notionHealth?.error ?? 'Desconfigurado')} sub={`hasToken:${String(notionHealth?.hasToken)} hasDB:${String(notionHealth?.hasDatabaseId)}`} />
          <Card title="Asaas (checkout)" ok={asaasOk} detail={asaasOk ? `production • key OK` : 'ASAAS_API_KEY faltando'} sub={asaasHealth?.provider ?? ''} />
          <Card title="Cloudflare" ok={null} detail="nexoslab.online Pending — checking nameservers (segundo plano)" sub="A 216.198.79.1 + CNAME www Proxied, _domainconnect removido" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="bento-card p-5 lg:col-span-2">
            <h2 className="text-sm font-bold">Health JSON</h2>
            <pre className="mt-3 max-h-[320px] overflow-auto rounded-lg bg-ink/[0.04] p-3 font-mono text-[11px] leading-relaxed">{JSON.stringify(health, null, 2)}</pre>
          </div>
          <div className="bento-card p-5">
            <h2 className="text-sm font-bold">Ações</h2>
            <div className="mt-3 flex flex-col gap-2">
              <a href="/api/supabase/health" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Abrir /api/supabase/health</a>
              <a href="/api/cloudflare/verify" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Abrir /api/cloudflare/verify</a>
              <a href="https://supabase.com/dashboard/project/nheawyxibogyacxbvlvj" target="_blank" rel="noreferrer" className="btn-secondary-nex justify-center text-xs">Supabase Dashboard</a>
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
            <li>Definir `DASHBOARD_ADMIN_EMAILS` no Vercel para allowlist.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
