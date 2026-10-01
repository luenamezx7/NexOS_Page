'use client';

import { createAuthClient } from 'better-auth/react';
import { twoFactorClient, adminClient } from 'better-auth/client/plugins';
import { authErrorMessage } from '@/lib/auth/error-message';

export { authErrorMessage };

/**
 * Cliente de autenticação para a interface.
 *
 * Não carrega segredos nem conexão de banco: `baseURL` aponta para o handler
 * do servidor, que é quem valida sessão, rate limit, CAPTCHA e 2FA.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  basePath: '/api/auth',
  plugins: [twoFactorClient(), adminClient()],
});
