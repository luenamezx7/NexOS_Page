import 'server-only';
import { Client } from '@notionhq/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { isCloudflareConfigured, verifyToken } from '@/lib/cloudflare';

export async function publicHealth() {
  return { supabase: await supabasePublicHealth() };
}

async function supabasePublicHealth() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { ok: false };
    const response = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key }, cache: 'no-store', signal: AbortSignal.timeout(5000) });
    return { ok: response.ok };
  } catch { return { ok: false }; }
}

export async function adminDiagnostics() {
  const [supabase, notion, cloudflare] = await Promise.all([
    supabaseAdminHealth(),
    notionHealth(),
    cloudflareHealth(),
  ]);
  return {
    checkedAt: new Date().toISOString(), supabase, notion, cloudflare,
  };
}

async function supabaseAdminHealth() {
  try {
    const client = createAdminClient();
    const { error } = await client.from('profiles').select('id', { head: true }).limit(1);
    return { ok: !error };
  } catch { return { ok: false }; }
}

export async function notionHealth() {
  const configured = !!(process.env.NOTION_TOKEN?.trim() && process.env.NOTION_DATABASE_ID?.trim());
  if (!configured) return { ok: false, configured };
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN, timeoutMs: 8000, logLevel: 'error' as never });
    await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID!.trim() });
    return { ok: true, configured };
  } catch { return { ok: false, configured }; }
}

export async function cloudflareHealth() {
  const configured = isCloudflareConfigured();
  if (!configured) return { ok: false, configured };
  try {
    const result = await verifyToken();
    return { ok: result.result.status === 'active', configured };
  } catch { return { ok: false, configured }; }
}
