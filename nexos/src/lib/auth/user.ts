import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Result type for user access validation.
 * - `ok: true` — user is authenticated, email confirmed, and MFA verified (if required)
 * - `ok: false` — access denied with HTTP status and optional reason
 */
export type UserAccess =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 401 | 403 | 503; reason?: 'mfa' | 'email' };

/**
 * Validates the current user's access level.
 *
 * Checks:
 * 1. Valid Supabase session (not expired, not anonymous)
 * 2. Email confirmed (email_confirmed_at is set)
 * 3. MFA verified (aal2 claim) — only if requireMfa is true
 *
 * @param requireMfa - Whether to require MFA (aal2). Default: true
 * @param existingClient - Optional existing Supabase client to reuse
 * @returns UserAccess with userId and email on success
 */
export async function getUserAccess(requireMfa = true, existingClient?: SupabaseClient): Promise<UserAccess> {
  try {
    const client = existingClient ?? await createClient();
    const { data, error } = await client.auth.getUser();
    if (error) {
      const invalid = error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403 ||
        ['bad_jwt', 'session_not_found', 'refresh_token_not_found', 'refresh_token_already_used'].includes(error.code ?? '');
      return { ok: false, status: invalid ? 401 : 503 };
    }
    if (!data.user) return { ok: false, status: 401 };
    if (data.user.is_anonymous) return { ok: false, status: 403 };
    if (!data.user.email || !data.user.email_confirmed_at) return { ok: false, status: 403, reason: 'email' };
    if (requireMfa) {
      const { data: verified, error: claimsError } = await client.auth.getClaims();
      if (claimsError || !verified || verified.claims.sub !== data.user.id) return { ok: false, status: 401 };
      if (verified.claims.aal !== 'aal2') return { ok: false, status: 403, reason: 'mfa' };
    }
    return { ok: true, userId: data.user.id, email: data.user.email };
  } catch { return { ok: false, status: 503 }; }
}
