'use client';

import { createAuthClient } from 'better-auth/react';
import { twoFactorClient, adminClient, magicLinkClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { authErrorMessage } from '@/lib/auth/error-message';
import { supabaseOAuthClient } from './supabase-oauth-client';

export { authErrorMessage };

/**
 * Cliente de autenticação para a interface.
 *
 * Não carrega segredos nem conexão de banco: `baseURL` aponta para o handler
 * do servidor, que é quem valida sessão, rate limit, CAPTCHA e 2FA.
 */
export const authClient = createAuthClient({
  // Mesma origem do documento: previews e localhost não enviam dados a produção.
  basePath: '/api/auth',
  plugins: [twoFactorClient(), adminClient(), magicLinkClient(), passkeyClient(), supabaseOAuthClient()],
});

/** Único endpoint de logout; erros do SDK precisam ser tratados antes de navegar. */
export async function signOutAccount(): Promise<void> {
  const result = await authClient.signOut({ fetchOptions: { signal: AbortSignal.timeout(15000) } });
  if (result.error) throw result.error;
}
