import { after, NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { sendWelcomeIfNeeded } from '@/lib/emails/welcome';

/**
 * Auth callback — handles OAuth/OTP code exchange.
 * On successful user-flow authentication, triggers welcome email via `after()`.
 */
export async function GET(request: NextRequest) {
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || request.url;
  // entry/next só valem se forem caminhos internos — nunca open redirect.
  const entry = request.nextUrl.searchParams.get('entry') === '/admin-dashboard-su/secure-entry'
    ? '/admin-dashboard-su/secure-entry' : '/portal/acesso';
  const next = sanitizeCallbackPath(request.nextUrl.searchParams.get('next'));
  const code = request.nextUrl.searchParams.get('code');
  let success = false;
  let errorCode = '';
  if (code && code.length <= 2048) {
    try {
      const client = await createClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) {
        errorCode = error.code ?? error.name ?? '';
        console.error('[auth/callback] exchangeCodeForSession failed', { code: errorCode, message: error.message });
      }
      success = !error;
      if (success && data.user && entry === '/portal/acesso' && next !== '/portal/redefinir') {
        const userId = data.user.id;
        after(() => sendWelcomeIfNeeded(userId));
      }
    } catch (err) {
      errorCode = err instanceof Error ? err.name : 'UnknownError';
      console.error('[auth/callback] exchangeCodeForSession threw', { code: errorCode });
    }
  } else if (!code) {
    console.error('[auth/callback] missing code parameter');
  }
  let target: URL;
  if (success && next === '/portal/redefinir') {
    target = new URL(next, site);
  } else {
    target = new URL(entry, site);
    // The entry page checks email/MFA/admin access before resuming a purchase.
    if (next) target.searchParams.set('callbackUrl', next);
    if (!success) {
      target.searchParams.set('confirmation', 'error');
      if (errorCode) target.searchParams.set('reason', errorCode);
    }
  }
  const response = NextResponse.redirect(target, 303);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
