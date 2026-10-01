import { NextResponse } from 'next/server';
import { getUserScope } from '@/lib/db/user-scope';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/orders
 * Pedidos do usuário autenticado.
 *
 * A posse é aplicada por `selectOwn` — a conexão é privilegiada e não depende
 * de RLS para isolar as linhas.
 */
export async function GET() {
  try {
    const scope = await getUserScope();
    if (!scope) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { data: orders, error } = await scope
      .selectOwn('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Erro ao carregar pedidos' }, { status: 500 });
    return NextResponse.json({ orders: orders ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}