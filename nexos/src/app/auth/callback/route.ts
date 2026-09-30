import { after, NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { sendWelcomeIfNeeded } from '@/lib/emails/welcome';
import { isRecoveryTokenHash } from '@/lib/auth/recovery';

/**
 * Auth callback — handles OAuth/OTP code exchange.
 * On successful user-flow authentication, triggers welcome email via `after()`.
 */
export async function GET(request: NextRequest) {
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || request.url;
  const entry = request.nextUrl.searchParams.get('entry') === '/admin-dashboard-su/secure-entry'
    ? '/admin-dashboard-su/secure-entry' : '/portal/acesso';
  const next = sanitizeCallbackPath(request.nextUrl.searchParams.get('next'));
  const code = request.nextUrl.searchParams.get('code');
  const type = request.nextUrl.searchParams.get('type');
  const isRecovery = type === 'recovery' || next === '/portal/redefinir';
  const tokenHash = request.nextUrl.searchParams.get('token_hash') ?? request.nextUrl.searchParams.get('token');
  if (isRecovery && isRecoveryTokenHash(tokenHash)) {
    // Do not consume the one-time token here: email scanners follow links, and
    // verifying on GET would invalidate the token before the user sees the form.
    // The form renders immediately and the POST verifies the hash before saving.
    const target = new URL('/portal/redefinir', site);
    target.searchParams.set('token_hash', tokenHash);
    return privateRedirect(target);
  }
  let success = false;
  if (code && code.length <= 2048) {
    try {
      const client = await createClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[auth/callback] code exchange failed', { code: error.code, status: error.status, isRecovery });
      }
      success = !error && !!data.session && !!data.user;
      if (success && data.user && entry === '/portal/acesso' && !isRecovery) {
        const userId = data.user.id;
        after(() => sendWelcomeIfNeeded(userId));
      }
    } catch (err) {
      console.error('[auth/callback] code exchange threw', { name: err instanceof Error ? err.name : 'UnknownError' });
    }
  } else {
    console.error('[auth/callback] missing or invalid credentials', { hasCode: !!code, hasTokenHash: !!tokenHash, isRecovery });
  }
  let target: URL;
  if (isRecovery) {
    target = new URL('/portal/redefinir', site);
    if (!success) target.searchParams.set('recovery', 'error');
  } else {
    target = new URL(entry, site);
    if (next) target.searchParams.set('callbackUrl', next);
    if (!success) {
      target.searchParams.set('confirmation', 'error');
    }
  }
  return privateRedirect(target);
}

function privateRedirect(target: URL) {
  const response = NextResponse.redirect(target, 303);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
