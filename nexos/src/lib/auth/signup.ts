import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Server-only view of the Auth e-mail index (see migration 20260930000001). */
type EmailIndex = { data: { confirmed: boolean } | null; error: { code?: string } | null };

/**
 * Is this address already tied to a confirmed account?
 *
 * Only confirmed accounts are reported. Pending sign-ups fall through to the
 * normal confirmation flow, so the message cannot be used to discover that
 * somebody merely started registering an address.
 *
 * The lookup is a single indexed read. The previous implementation paged
 * through every Auth user on each attempt, which grew with the account base
 * and could be driven into a costly scan.
 */
export async function isConfirmedEmailTaken(
  email: string,
  admin: Pick<SupabaseClient, 'from'>,
): Promise<boolean> {
  const { data, error }: EmailIndex = await admin
    .from('account_email_index')
    .select('confirmed')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  // A missing index row must not block sign-up; the provider still validates.
  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[auth/signup] e-mail index lookup failed', { code: error.code });
    }
    return false;
  }
  return data?.confirmed === true;
}

/**
 * Narrow follow-up for a signup that raced the index check.
 *
 * Supabase only reports these codes for an address already tied to a
 * confirmed account, so the same policy applies. The obfuscated-user response
 * for a merely pending sign-up is deliberately NOT treated as a duplicate:
 * reporting it would expose that someone started registering an address.
 */
export function isConfirmedDuplicateError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return ['user_already_exists', 'email_exists'].includes(error.code ?? '') ||
    /already (been )?registered|user already exists/i.test(error.message ?? '');
}
