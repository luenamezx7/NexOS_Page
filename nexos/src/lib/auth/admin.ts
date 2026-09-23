import 'server-only';
import { getUserAccess, type UserAccess } from '@/lib/auth/user';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminAccess = UserAccess;

export async function getAdminAccess(requireMfa = true, client?: SupabaseClient): Promise<AdminAccess> {
  const ids = new Set((process.env.DASHBOARD_ADMIN_USER_IDS ?? '').split(',').map(v => v.trim()).filter(Boolean));
  if (!ids.size) return { ok: false, status: 503 };
  const identity = await getUserAccess(false, client);
  if (!identity.ok) return identity;
  if (!ids.has(identity.userId)) return { ok: false, status: 403 };
  return requireMfa ? getUserAccess(true, client) : identity;
}

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export function deniedJson(status: 401 | 403 | 503) {
  return privateJson({ error: status === 401 ? 'Autenticação necessária.' : status === 403 ? 'Acesso negado.' : 'Serviço indisponível.' }, status);
}
