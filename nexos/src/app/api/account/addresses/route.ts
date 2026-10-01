import { NextRequest, NextResponse } from 'next/server';
import { getUserScope } from '@/lib/db/user-scope';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/addresses
 * Returns all delivery addresses for the authenticated user.
 * Ordered by: is_default DESC, created_at DESC.
 */
export async function GET() {
  try {
    const scope = await getUserScope();
    if (!scope) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { data: addresses, error } = await scope
      .selectOwn('addresses')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao carregar endereços' }, { status: 500 });
    }

    return NextResponse.json({ addresses: addresses ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/account/addresses
 * Creates a new delivery address for the authenticated user.
 * If `isDefault` is true, removes the default flag from all other addresses first.
 * Required fields: street, number, neighborhood, city, state, cep.
 */
export async function POST(req: NextRequest) {
  try {
    const scope = await getUserScope();
    if (!scope) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
    const { type, street, number, complement, neighborhood, city, state, cep, country, isDefault } = body;

    if (!street || !number || !neighborhood || !city || !state || !cep) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    if (isDefault) {
      await scope.client.from('addresses').update({ is_default: false }).eq('user_id', scope.userId);
    }

    const { data: address, error } = await scope.client
      .from('addresses')
      .insert({
        user_id: scope.userId,
        type: type ?? 'home',
        street: street.trim(),
        number: number.trim(),
        complement: complement?.trim() || null,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        cep: cep.trim(),
        country: country?.trim() || 'Brasil',
        is_default: isDefault ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar endereço' }, { status: 500 });
    }

    return NextResponse.json({ address }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
