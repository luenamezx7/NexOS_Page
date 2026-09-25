import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeCallbackPath } from '@/lib/auth/callback';

export async function GET(request: NextRequest) {
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || request.url;
  // entry/next só valem se forem caminhos internos — nunca open redirect.
  const entry = request.nextUrl.searchParams.get('entry') === '/admin-dashboard-su/secure-entry'
    ? '/admin-dashboard-su/secure-entry' : '/portal/acesso';
  const next = sanitizeCallbackPath(request.nextUrl.searchParams.get('next'));
  const code = request.nextUrl.searchParams.get('code');
  let success = false;
  if (code && code.length <= 2048) {
    try {
      const client = await createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      success = !error;
    } catch { /* Render a fixed, non-sensitive error below. */ }
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
    }
  }
  const response = NextResponse.redirect(target, 303);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
