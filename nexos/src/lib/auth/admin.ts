import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type AdminAccess =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 | 503; reason?: 'mfa' };

export async function getAdminAccess(requireMfa = true): Promise<AdminAccess> {
  const ids = new Set((process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(v => v.trim()).filter(Boolean));
  if (!ids.size) return { ok: false, status: 503 };
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error) {
      const invalidSession = error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403 ||
        ['bad_jwt', 'session_not_found', 'refresh_token_not_found', 'refresh_token_already_used'].includes(error.code ?? '');
      return { ok: false, status: invalidSession ? 401 : 503 };
    }
    if (!data.user) return { ok: false, status: 401 };
    if (data.user.is_anonymous || !ids.has(data.user.id)) return { ok: false, status: 403 };
    if (requireMfa) {
      const { data: verified, error: claimsError } = await client.auth.getClaims();
      if (claimsError || !verified) return { ok: false, status: 401 };
      if (verified.claims.aal !== 'aal2') return { ok: false, status: 403, reason: 'mfa' };
    }
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, status: 503 };
  }
}

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export function deniedJson(status: 401 | 403 | 503) {
  return privateJson({ error: status === 401 ? 'Autenticação necessária.' : status === 403 ? 'Acesso negado.' : 'Serviço indisponível.' }, status);
}
