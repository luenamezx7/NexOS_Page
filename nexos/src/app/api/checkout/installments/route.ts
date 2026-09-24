import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';
import { BULK_MAX_QTY, bulkUnitPrice } from '@/lib/bulk-pricing';
import { simulateInstallments } from '@/lib/asaas';

// GET /api/checkout/installments?productId=dev&quantity=1
// Retorna parcelas como o Asaas mostraria no redirect (1x até 12x)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const rawQty = Number(searchParams.get('quantity') ?? '1');
  const quantity = Number.isFinite(rawQty)
    ? Math.max(1, Math.min(BULK_MAX_QTY, Math.floor(rawQty)))
    : 1;

  if (!productId) {
    return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });
  }
  const service = config.services.find((s) => s.id === productId);
  if (!service) return NextResponse.json({ error: 'Produto inválido' }, { status: 400 });

  const unit = bulkUnitPrice(service.price, quantity, productId);
  const total = Number((unit * quantity).toFixed(2));
  const installments = simulateInstallments(total, 12);

  return NextResponse.json({ productId, quantity, total, installments }, { status: 200 });
}
