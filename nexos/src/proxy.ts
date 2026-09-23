import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { randomBytes } from 'node:crypto';

function getNonce(): string {
  return randomBytes(16).toString('base64url');
}

// ── Rate limit app-level (fallback ao WAF Cloudflare) ──
const WINDOW_MS = 60_000;
const MAX_REQ = 60;
const buckets = new Map<string, number[]>();

function getIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function proxy(req: NextRequest) {
  const nonce = getNonce();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origin = url ? new URL(url).origin : '';
  const csp = [
    "default-src 'self'", "object-src 'none'", "base-uri 'self'",
    "frame-ancestors 'none'", "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:",
    "font-src 'self' data:", "frame-src https://challenges.cloudflare.com",
    `connect-src 'self' ${origin} ${origin.replace('https:', 'wss:')} https://challenges.cloudflare.com${process.env.NODE_ENV === 'development' ? ' ws: wss:' : ''}`,
  ].join('; ');
  req.headers.set('x-nonce', nonce);
  req.headers.set('Content-Security-Policy', csp);

  // Rate-limit para APIs sensíveis
  if (req.nextUrl.pathname.startsWith('/api/contact') || req.nextUrl.pathname.startsWith('/api/checkout')) {
    const ip = getIp(req);
    const now = Date.now();
    const arr = buckets.get(ip) ?? [];
    const valid = arr.filter((t) => now - t < WINDOW_MS);
    if (valid.length >= MAX_REQ) {
      return NextResponse.json({ error: 'Muitas requisições. Tente em 1 min.' }, { status: 429 });
    }
    valid.push(now);
    buckets.set(ip, valid);
    if (buckets.size > 5000) {
      for (const [key, times] of buckets) {
        if (times.every(t => now - t >= WINDOW_MS)) buckets.delete(key);
      }
    }
  }

  // ── Supabase: refresh session (SSR) ──
  // Mantém auth cookies atualizados em toda rota (necessário para RLS)
  let supabaseResponse = NextResponse.next({ request: req });
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          Object.entries(cacheHeaders).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
        },
      },
    });
    // Não bloqueia rota se falhar, só tenta refresh
    try {
      await supabase.auth.getUser();
    } catch {}
  }

  supabaseResponse.headers.set('Content-Security-Policy', csp);
  supabaseResponse.headers.set('Cache-Control', 'private, no-store');
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
