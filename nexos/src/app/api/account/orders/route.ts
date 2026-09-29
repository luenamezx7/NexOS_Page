import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: orders, error } = await client
      .from('orders')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao carregar pedidos' }, { status: 500 });
    }

    return NextResponse.json({ orders: orders ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
