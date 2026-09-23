import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const target = new URL('/entrar', process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || request.url);
  const code = request.nextUrl.searchParams.get('code');
  let success = false;
  if (code && code.length <= 2048) {
    try {
      const client = await createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      success = !error;
    } catch { /* Render a fixed, non-sensitive error below. */ }
  }
  if (!success) target.searchParams.set('confirmation', 'error');
  // Fixed destination: never accept a user-supplied `next` URL.
  const response = NextResponse.redirect(target, 303);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
