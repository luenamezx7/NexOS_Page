import 'server-only';
import { createAdminClient as createServerAdminClient } from '@supabase/server/core';

/**
 * Cria cliente admin Supabase (service_role, bypass RLS).
 * APENAS para operações server-side confiáveis — nunca expor ao client.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase administrativo não configurado.');
  return createServerAdminClient({ env: { url, secretKeys: { default: key } } });
}
