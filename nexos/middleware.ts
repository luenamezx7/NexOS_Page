import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ── Rate limit app-level (fallback ao WAF Cloudflare) ──
const WINDOW_MS = 60_000;
const MAX_REQ = 60;
const buckets = new Map<string, number[]>();

function getIp(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function middleware(req: NextRequest) {
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
  }

  // ── Supabase: refresh session (SSR) ──
  // Mantém auth cookies atualizados em toda rota (necessário para RLS)
  let supabaseResponse = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    });
    // Não bloqueia rota se falhar, só tenta refresh
    try {
      await supabase.auth.getUser();
    } catch {}
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
