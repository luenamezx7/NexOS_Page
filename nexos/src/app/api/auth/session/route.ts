import { getUserAccess } from '@/lib/auth/session';
import { privateJson } from '@/lib/auth/http';

export const dynamic = 'force-dynamic';

/**
 * Estado de autenticação para o front.
 *
 * `requireMfa` é aceito por compatibilidade de chamada. A exigência de segundo
 * fator é garantida pelo Better Auth, que não emite sessão enquanto o desafio
 * estiver pendente — portanto um `200` aqui já significa acesso pleno.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await getUserAccess(searchParams.get('requireMfa') !== 'false');
  if (!access.ok) return privateJson({ ok: false, reason: access.reason ?? 'unauthenticated' }, access.status);
  return privateJson({ ok: true, email: access.email, role: access.role });
}