import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Check real Auth records, including unconfirmed and social accounts. */
export async function emailAlreadyInUse(
  email: string,
  admin: Pick<SupabaseClient['auth']['admin'], 'listUsers'>,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  // Do not cache this check: a newly created account must be visible immediately.
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (data.users.some(user => user.email?.trim().toLowerCase() === normalized)) return true;
    // Read until an empty page, rather than assuming a server-side page-size cap.
    if (data.users.length === 0) return false;
  }
}

/** A new, unconfirmed user has no session; that alone never means duplicate. */
export function isDuplicateSignup(result: {
  error: { code?: string; message?: string } | null;
  data: { user?: { identities?: unknown[] } | null };
}): boolean {
  if (result.error) {
    return ['user_already_exists', 'email_exists'].includes(result.error.code ?? '') ||
      /already (been )?registered|already in use|user already exists/i.test(result.error.message ?? '');
  }
  // Supabase may return an obfuscated user instead of an error for a duplicate.
  return result.data.user?.identities?.length === 0;
}
