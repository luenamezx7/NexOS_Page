'use client';

import { createAuthClient } from 'better-auth/react';
import { twoFactorClient, adminClient, magicLinkClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { authErrorMessage } from '@/lib/auth/error-message';

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
  plugins: [twoFactorClient(), adminClient(), magicLinkClient(), passkeyClient()],
});
