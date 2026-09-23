import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { matchesWebhookSecret } from '@/lib/webhook-auth';
import { processWebhookEvent } from '@/lib/webhook-processor';
import { readJsonBody, RequestError } from '@/lib/request-security';

const webhookSchema = z.object({
  id: z.string().min(1).max(100),
  event: z.string().min(1).max(40),
  payment: z.object({
    id: z.string().min(1).max(40),
    externalReference: z.string().min(1).max(36).optional().nullable(),
    status: z.string().min(1).max(32),
    value: z.number().optional(),
    billingType: z.string().optional(),
  }),
});

export async function GET() {
  return NextResponse.json({ ok: true, provider: 'asaas' }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('asaas-access-token');
  if (!matchesWebhookSecret(authHeader, process.env.ASAAS_WEBHOOK_TOKEN)) {
    return NextResponse.json({ error: 'Credencial inválida.' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await readJsonBody(req, 102400);
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Shape inválido' }, { status: 400 });
  }

  const { id, event, payment } = parsed.data;

  try {
    await processWebhookEvent(id, event, payment);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha no processamento';
    console.error(`[webhook/checkout] processamento falhou: ${msg}`);
    return NextResponse.json({ error: 'Erro ao processar evento.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
