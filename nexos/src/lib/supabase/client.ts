import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY faltando');
  if (process.env.NODE_ENV !== 'production') console.info('[supabase] browser client conectado a', url);
  return createBrowserClient(url, key);
}
