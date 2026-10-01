'use server';

import { getUserAccess, type SessionState } from '@/lib/auth/session';

export type { SessionState };

/**
 * Server Action que expõe o estado de sessão ao cliente.
 * `requireTwoFactor` é aceito por compatibilidade: o Better Auth não cria
 * sessão enquanto o segundo fator está pendente, então não há verificação extra.
 */
export async function getUserAccessAction(requireTwoFactor = true): Promise<SessionState> {
  return getUserAccess(requireTwoFactor);
}
