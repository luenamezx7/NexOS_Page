import 'server-only';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth/instance';

/**
 * Sessão e autorização — a fronteira entre identidade e permissão.
 *
 * Divisão de responsabilidades:
 * - AUTENTICAÇÃO: credenciais, OAuth, 2FA (instância Better Auth)
 * - SESSÃO: cookie httpOnly persistido no Postgres (mesma instância)
 * - AUTORIZAÇÃO: este módulo — decide papel e acesso, sempre no servidor
 *
 * Por que `disableCookieCache`: com cache de cookie, um logout ou banimento
 * continuaria aparentando sessão válida até o cache expirar. Operações
 * sensíveis (conta, pedidos, painel) não podem confiar nisso.
 *
 * Por que não há checagem de "2FA verificado": o plugin twoFactor do Better
 * Auth NÃO cria sessão enquanto o segundo fator está pendente — apaga a
 * sessão emitida no login e responde com um cookie de desafio de 10 minutos.
 * Existindo sessão, o segundo fator já foi satisfeito.
 */

export type SessionState =
  | { ok: true; userId: string; email: string; name: string; role: string | null }
  | { ok: false; status: 401 | 403 | 503; reason?: 'banned' | 'unverified' | 'unauthenticated' | 'unavailable' };

type PersistedSession = Awaited<ReturnType<ReturnType<typeof getAuth>['api']['getSession']>>;

/**
 * Resultado da leitura da sessão, com as três situações separadas.
 * `absent` e `error` não podem virar o mesmo `null`: um banco indisponível não
 * é "não autenticado", e tratá-los igual transforma falha de infraestrutura em
 * convite a tentar logar de novo.
 */
type SessionLookup =
  | { status: 'found'; data: PersistedSession }
  | { status: 'absent' }
  | { status: 'error' };

/**
 * Sessão persistida, lida do Postgres e nunca do cache de cookie.
 *
 * O cache está desabilitado de propósito: com cache, um logout ou banimento
 * continuaria aparentando sessão válida até expirar.
 */
async function lookupSession(): Promise<SessionLookup> {
  try {
    const data = (await getAuth().api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    })) as PersistedSession;
    if (!data?.session || !data?.user) return { status: 'absent' };
    return { status: 'found', data };
  } catch {
    // Exceção aqui é infraestrutura (Postgres fora, rede, timeout) — não é
    // ausência de sessão, e a resposta precisa dizer isso.
    return { status: 'error' };
  }
}

function evaluate(lookup: SessionLookup): SessionState {
  if (lookup.status === 'error') return { ok: false, status: 503, reason: 'unavailable' };
  if (lookup.status === 'absent') return { ok: false, status: 401, reason: 'unauthenticated' };

  const user = (lookup.data as { user?: Record<string, unknown> }).user ?? {};
  if (user.banned === true) return { ok: false, status: 403, reason: 'banned' };
  if (user.emailVerified !== true) return { ok: false, status: 403, reason: 'unverified' };
  return {
    ok: true,
    userId: String(user.id),
    email: String(user.email),
    name: typeof user.name === 'string' ? user.name : '',
    role: typeof user.role === 'string' ? user.role : null,
  };
}

/**
 * Estado de acesso da sessão atual.
 *
 * @param _requireTwoFactor - Aceito por compatibilidade de chamada. A exigência
 *   de segundo fator é garantida pelo próprio Better Auth (não existe sessão
 *   enquanto o 2FA está pendente), portanto não há verificação adicional a fazer.
 */
export async function getUserAccess(_requireTwoFactor = true): Promise<SessionState> {
  return evaluate(await lookupSession());
}

/**
 * Acesso administrativo.
 *
 * O papel vem do banco (plugin admin), não de variável de ambiente: a allowlist
 * anterior exigia editar e redeployar para conceder ou revogar acesso.
 */
export async function getAdminAccess(_requireTwoFactor = true): Promise<SessionState> {
  const access = evaluate(await lookupSession());
  if (!access.ok) return access;
  if (access.role !== 'admin') return { ok: false, status: 403 };
  return access;
}

export async function getSessionUserId(): Promise<string | null> {
  const access = await getUserAccess();
  return access.ok ? access.userId : null;
}