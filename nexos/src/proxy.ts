import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isSameOrigin } from './lib/request-security';
import { getSessionCookie } from 'better-auth/cookies';
import { isPrivatePage, loginPathFor } from './lib/auth/policy';

// Rotas mutantes que exigem mesma origem (defesa em profundidade antes dos handlers).
const ORIGIN_PROTECTED = ['/api/auth', '/api/account', '/api/contact', '/api/checkout'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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
  const pathname = req.nextUrl.pathname;
  // Filtro otimista: os RSC/handlers validam a sessão no banco.
  if (isPrivatePage(pathname) && !getSessionCookie(req, { cookiePrefix: 'nexos' })) {
    const login = new URL(loginPathFor(pathname), req.url);
    login.searchParams.set('callbackUrl', `${pathname}${req.nextUrl.search}`);
    const response = NextResponse.redirect(login);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  const isProtected = ORIGIN_PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isProtected && !SAFE_METHODS.has(req.method) && !isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  }

  const nonce = getNonce();
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origin = url ? new URL(url).origin : '';
  const csp = [
    "default-src 'self'", "object-src 'none'", "base-uri 'self'",
    "frame-ancestors 'none'", "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:",
    "font-src 'self' data:", "frame-src https://challenges.cloudflare.com", "worker-src 'self'",
    `connect-src 'self' ${origin} ${origin.replace('https:', 'wss:')} https://challenges.cloudflare.com${process.env.NODE_ENV === 'development' ? ' ws: wss:' : ''}`,
  ].join('; ');
  req.headers.set('x-nonce', nonce);
  req.headers.set('Content-Security-Policy', csp);

  // Rate-limit para APIs sensíveis
  if (req.nextUrl.pathname.startsWith('/api/contact') || req.nextUrl.pathname.startsWith('/api/checkout')) {
    const ip = getIp(req);
    const now = Date.now();
    if (buckets.size >= 5000) {
      for (const [key, times] of buckets) if (times.every(t => now - t >= WINDOW_MS)) buckets.delete(key);
      if (buckets.size >= 5000 && !buckets.has(ip)) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 });
    }
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

  const response = NextResponse.next({ request: req });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
