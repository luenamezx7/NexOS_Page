import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isSameOrigin } from './lib/request-security';
import { getSessionCookie } from 'better-auth/cookies';
import { isPrivatePage, loginPathFor } from './lib/auth/policy';

// Rotas mutantes que exigem mesma origem (defesa em profundidade antes dos handlers).
const ORIGIN_PROTECTED = ['/api/auth', '/api/account', '/api/contact'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getNonce(): string {
  return randomBytes(16).toString('base64url');
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
    ...(process.env.NODE_ENV === 'development' ? [] : ["frame-ancestors 'none'"]),
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:",
    "font-src 'self' data:", "frame-src https://challenges.cloudflare.com", "worker-src 'self'",
    `connect-src 'self' ${origin} ${origin.replace('https:', 'wss:')} https://challenges.cloudflare.com${process.env.NODE_ENV === 'development' ? ' ws: wss:' : ''}`,
  ].join('; ');
  req.headers.set('x-nonce', nonce);
  req.headers.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: req });
  response.headers.set('Content-Security-Policy', csp);
  // HTML carries a fresh CSP nonce: never replay it through a shared cache.
  // Static fonts/images/video bypass this proxy and retain their asset cache.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|mp4|webm)$).*)',
  ],
};
