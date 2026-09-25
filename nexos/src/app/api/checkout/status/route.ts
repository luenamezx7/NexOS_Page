import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentStatus, isAsaasConfigured } from '@/lib/asaas';
import { getAdminAccess } from '@/lib/auth/admin';
import { verifyStatusToken } from '@/lib/status-token';
import { readJsonBody, RequestError, isSameOrigin } from '@/lib/request-security';

const bodySchema = z
  .object({
    paymentId: z.string().min(1).max(40).optional(),
    externalReference: z.string().min(1).max(36).optional(),
    statusToken: z.string().optional(),
  })
  .refine((d) => d.paymentId || d.externalReference, {
    message: 'Informe paymentId ou externalReference',
  });

function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self';",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'private, no-store',
  };
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403, headers: securityHeaders() });
  }
  if (!isAsaasConfigured()) {
    return NextResponse.json({ error: 'Gateway de pagamentos (Asaas) não está configurado.' }, { status: 503, headers: securityHeaders() });
  }

  try {
    const body = await readJsonBody(req);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400, headers: securityHeaders() });
    }

    const { paymentId, externalReference, statusToken } = parsed.data;

    if (paymentId) {
      const access = await getAdminAccess();
      if (!access.ok) {
        return NextResponse.json({ error: 'Autenticação necessária para consulta por paymentId.' }, { status: 401, headers: securityHeaders() });
      }
      const status = await getPaymentStatus(paymentId, 'id');
      return NextResponse.json({ status: status.status, paid: status.paid, value: status.value, billingType: status.billingType }, { status: 200, headers: securityHeaders() });
    }

    if (externalReference) {
      const tokenValid = verifyStatusToken(externalReference, statusToken);
      if (!tokenValid) {
        return NextResponse.json({ error: 'Token de acesso inválido.' }, { status: 403, headers: securityHeaders() });
      }
      const status = await getPaymentStatus(externalReference, 'externalReference');
      return NextResponse.json({ status: status.status, paid: status.paid, value: status.value, billingType: status.billingType }, { status: 200, headers: securityHeaders() });
    }

    return NextResponse.json({ error: 'Identificador inválido' }, { status: 400, headers: securityHeaders() });
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status, headers: securityHeaders() });
    return NextResponse.json({ error: 'Falha ao verificar pagamento.' }, { status: 500, headers: securityHeaders() });
  }
}
