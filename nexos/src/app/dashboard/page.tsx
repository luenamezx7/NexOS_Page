import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

async function getHealth() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const fetchOpts = { cache: 'no-store' as const, signal: AbortSignal.timeout(8000) };
  const safeJson = async (url: string) => {
    try {
      const r = await fetch(url, fetchOpts);
      return await r.json();
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };
  const [supabase, notion, asaas, checkout] = await Promise.all([
    safeJson(`${base}/api/supabase/health`),
    safeJson(`${base}/api/contact`),
    safeJson(`${base}/api/checkout`),
    safeJson(`${base}/api/checkout/status`),
  ]);
  return { supabase, notion, asaas, checkout };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Allowlist simples: se DASHBOARD_ADMIN_EMAILS definido, só esses entram; senão qualquer authenticated entra (dev)
  const allowList = (process.env.DASHBOARD_ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const isAllowed = !user ? false : allowList.length === 0 ? true : allowList.includes((user.email ?? '').toLowerCase());

  const health = await getHealth();

  return <DashboardClient user={user} isAllowed={isAllowed} health={health} />;
}
