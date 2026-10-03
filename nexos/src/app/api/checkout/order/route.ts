import { z } from 'zod';
import { getUserAccess } from '@/lib/auth/session';
import { privateJson } from '@/lib/auth/http';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadCheckoutOrder } from '@/lib/checkout-order';
import { isSameOrigin, readJsonBody, RequestError } from '@/lib/request-security';

export const dynamic = 'force-dynamic';
const lookupSchema = z.object({ key: z.string().uuid().optional(), externalReference: z.string().min(1).max(36).regex(/^nexos-[a-zA-Z0-9_-]+$/).optional(), paymentId: z.string().min(1).max(40).regex(/^pay_[a-zA-Z0-9_-]+$/).optional() }).refine(value => [value.key, value.externalReference, value.paymentId].filter(Boolean).length === 1);

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return privateJson({ error: 'Origem inválida.' }, 403);
  const access = await getUserAccess();
  if (!access.ok) return privateJson({ error: 'Entre na sua conta para consultar este pedido.' }, access.status);
  try {
    const parsed = lookupSchema.safeParse(await readJsonBody(request, 4096));
    if (!parsed.success) return privateJson({ error: 'Referência de pedido inválida.' }, 400);
    const order = await loadCheckoutOrder(createAdminClient(), access.userId, parsed.data);
    return order ? privateJson(order) : privateJson({ error: 'Pedido não encontrado para esta conta.' }, 404);
  } catch (error) {
    if (error instanceof RequestError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: 'Não foi possível retomar o pedido. Tente novamente.' }, 503);
  }
}
