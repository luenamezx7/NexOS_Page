import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkPixStatus, isInfinitePayConfigured } from '@/lib/infinitepay';

// ============================================================
// NexOS — polling do Pix InfinitePay
// POST /api/checkout/status { orderNsu | slug | transactionNsu | code }
//   → { paid, captureMethod, amount, paidAmount }
// `code` aceita o link da cobrança ou o order_nsu colado.
// ============================================================

const idSchema = z.string().min(1).max(120);

const bodySchema = z
  .object({
    orderNsu: z
      .string()
      .min(1)
      .max(36)
      .regex(/^([a-zA-Z0-9-]+)$/)
      .optional(),
    slug: idSchema.regex(/^([a-zA-Z0-9-_]+)$/).optional(),
    transactionNsu: idSchema.optional(),
    code: z.string().trim().min(1).max(500).optional(),
  })
  .refine((d) => d.orderNsu || d.slug || d.transactionNsu || d.code, {
    message: 'Informe orderNsu, slug ou link da cobrança',
  });

/** Extrai slug de um link checkout.infinitepay.com.br/<slug> ou devolve o texto. */
function normalizeCode(code: string): { orderNsu?: string; slug?: string } {
  const trimmed = code.trim();
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('infinitepay')) {
      const slug = url.pathname.split('/').filter(Boolean).pop();
      if (slug) return { slug };
    }
  } catch {
    /* não é URL — trata como order_nsu/slug puro */
  }
  if (/^([a-zA-Z0-9-]+)$/.test(trimmed) && trimmed.length <= 36) return { orderNsu: trimmed };
  return { slug: trimmed };
}

const WINDOW_MS = 60_000;
const MAX_REQ = 20;
const buckets = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function headers(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self';",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const valid = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (valid.length >= MAX_REQ) {
    return NextResponse.json({ error: 'Muitas verificações. Aguarde um pouco.' }, { status: 429, headers: headers() });
  }
  valid.push(now);
  buckets.set(ip, valid);

  if (!isInfinitePayConfigured()) {
    return NextResponse.json({ error: 'Pix indisponível.' }, { status: 500, headers: headers() });
  }

  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400, headers: headers() });
    }
    const { orderNsu, slug, transactionNsu, code } = parsed.data;
    const fromCode = code ? normalizeCode(code) : {};
    const status = await checkPixStatus({
      orderNsu: orderNsu ?? fromCode.orderNsu,
      slug: slug ?? fromCode.slug,
      transactionNsu,
    });
    return NextResponse.json(status, { status: 200, headers: headers() });
  } catch {
    return NextResponse.json({ error: 'Falha ao verificar pagamento.' }, { status: 500, headers: headers() });
  }
}
