import type { BetterAuthClientPlugin } from 'better-auth/client';
import type { supabaseOAuth } from './supabase-oauth';

export const supabaseOAuthClient = () => ({
  id: 'nexos-supabase-oauth',
  $InferServerPlugin: {} as ReturnType<typeof supabaseOAuth>,
}) satisfies BetterAuthClientPlugin;
