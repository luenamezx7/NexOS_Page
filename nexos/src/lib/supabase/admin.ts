import 'server-only';
import { createAdminClient as createServerAdminClient } from '@supabase/server/core';

// Only trusted server operations may use this client: it bypasses RLS.
export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase administrativo não configurado.');
  return createServerAdminClient({ env: { url, secretKeys: { default: key } } });
}
