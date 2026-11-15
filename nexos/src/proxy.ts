import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isSameOrigin } from './lib/request-security';
import { getSessionCookie } from 'better-auth/cookies';
import { isPrivatePage, loginPathFor } from './lib/auth/policy';
import { ENTRY_PATH, entryCookies, entryNetworkMoved, isEntryProtectedPath, readEntryToken, siteEntryEnforced } from './lib/site-entry';
import { trustedClientAddress } from './lib/rate-limit';

// Rotas mutantes que exigem mesma origem (defesa em profundidade antes dos handlers).
const ORIGIN_PROTECTED = ['/api/auth', '/api/account', '/api/contact'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getNonce(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * F-13 — O origin da Vercel é alcançável DIRETO (216.198.79.1), sem o
 * Cloudflare. Verificado: GET https://nexoslab.online/ com --resolve para o
 * IP da Vercel devolve `server: Vercel` (sem `server: cloudflare`) e 303 para
 * /verificar.
 *
 * O gate do Turnstile continua valendo (é app-level), mas TODA a camada de
 * borda é contornada: sem WAF, sem Bot Management, sem anti-DDoS da Cloudflare
 * — e, principalmente, os rate limits POR IP do app (que usam
 * `x-vercel-forwarded-for`) deixam de proteger: um atacante com IPs rotativos
 * bate no origin e nunca esbarra neles. Restam o Turnstile e o limite POR
 * CONTA.
 *
 * ESTA VERIFICAÇÃO (defesa em profundidade na aplicação) fecha o bypass:
 * exige que o request tenha passado pela Cloudflare. Em produção o header
 * `cf-ray` só existe quando a requisição chega pela Cloudflare; hitting o
 * origin direto, ele não vem.
 *
 * Impacto de falso-positivo: preview deployments (vercel.app) e o ambiente
 * local NÃO passam por Cloudflare. Por isso a checagem é habilitada só em
 * produção E só quando `SITE_CLOUDFLARE_REQUIRED` não for 'false'.
 */
function cameThroughCloudflare(req: NextRequest): boolean {
  if (process.env.SITE_CLOUDFLARE_REQUIRED === 'false') return true;
  // desenvolvimento e suites de teste nao passam pela Cloudflare
  if (process.env.NODE_ENV !== 'production') return true;
  // Só exige para o HOST CANÔNICO. Preview deployments têm outro host
  // (vercel.app) e não passam pela Cloudflare — exigi-las quebraria todo
  // preview. `NODE_ENV` não serve de discriminante: em preview da Vercel
  // ele também é 'production'.
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  try {
    if (site && req.nextUrl.host !== new URL(site).host) return true;
  } catch { /* site mal configurado: não bloqueia */ }
  return Boolean(req.headers.get('cf-ray'));
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!cameThroughCloudflare(req)) {
    const response = NextResponse.json(
      { error: 'Acesso direto ao origin não permitido.' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  if (siteEntryEnforced() && isEntryProtectedPath(pathname)) {
    const names = entryCookies(req.url);
    const address = trustedClientAddress(req.headers);
    const clearance = readEntryToken(req.cookies.get(names.clearance)?.value, 'clearance', req.headers.get('user-agent') || '', Date.now(), address);
    if (!clearance) {
      const gate = new URL(ENTRY_PATH, req.url);
      gate.searchParams.set('next', `${pathname}${req.nextUrl.search}`);
      const response = NextResponse.redirect(gate, 303);
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return response;
    }
    if (entryNetworkMoved(clearance, address)) {
      const moved = NextResponse.next({ request: req });
      moved.headers.set('X-Ezway-Session-Moved', '1');
      return moved;
    }
  }
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
  // F-11: o CSP NAO deve autorizar o origin do Supabase por padrao.
  //
  // O client nao usa o Supabase: a grep nos 47 chunks (publicos E
  // autenticados) nao encontra nenhuma chave nem a URL, e a RLS bloqueia as
  // 7 tabelas para a publishable key. Autorizar o origin do banco no
  // connect-src e, portanto, uma autorizacao SEM CONTRAPARTE.
  //
  // O risco e latente, nao atual: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  // esta definida em producao. Se um dia um componente client passar a
  // referenciar `process.env.NEXT_PUBLIC_SUPABASE_URL`, a publishable key
  // e inlinada no bundle E o CSP ja estaria autorizando o browser a falar
  // direto com o banco - contornando o controle de acesso que esta no
  // route handler.
  //
  // Por isso a origem entra no CSP por FLAG EXPLICITA, e nao por inferencia
  // de variavel de ambiente: inferir nao funciona, porque as duas
  // NEXT_PUBLIC_* estao definidas em producao mesmo sem uso.
  //
  // Para ligar de verdade: o client precisa passar a usar o SDK do browser
  // do Supabase E defina SITE_CSP_ALLOW_SUPABASE=true.
  const supabaseAllowed = process.env.SITE_CSP_ALLOW_SUPABASE === 'true';
  const url = supabaseAllowed ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
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
