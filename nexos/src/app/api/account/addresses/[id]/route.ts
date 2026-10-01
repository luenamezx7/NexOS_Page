import { NextRequest, NextResponse } from 'next/server';
import { getUserScope } from '@/lib/db/user-scope';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/account/addresses/[id]
 *
 * O `id` da URL é entrada do cliente, não prova de posse. A mutation carrega
 * `.eq('user_id', scope.userId)` justamente para impedir que um usuário altere
 * o endereço de outro alterando o identificador na URL (IDOR).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scope = await getUserScope();
    if (!scope) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });

    const { type, street, number, complement, neighborhood, city, state, cep, country, isDefault } =
      body as {
        type?: string;
        street?: string;
        number?: string;
        complement?: string | null;
        neighborhood?: string;
        city?: string;
        state?: string;
        cep?: string;
        country?: string;
        isDefault?: boolean;
      };

    if (isDefault) {
      await scope.client.from('addresses').update({ is_default: false }).eq('user_id', scope.userId);
    }

    const updates: Record<string, string | boolean | null> = { updated_at: new Date().toISOString() };
    if (type !== undefined) updates.type = type;
    if (street !== undefined) updates.street = String(street).trim();
    if (number !== undefined) updates.number = String(number).trim();
    if (complement !== undefined) updates.complement = complement?.trim() || null;
    if (neighborhood !== undefined) updates.neighborhood = String(neighborhood).trim();
    if (city !== undefined) updates.city = String(city).trim();
    if (state !== undefined) updates.state = String(state).trim();
    if (cep !== undefined) updates.cep = String(cep).trim();
    if (country !== undefined) updates.country = String(country).trim();
    if (isDefault !== undefined) updates.is_default = isDefault;

    const { data: address, error } = await scope.client
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', scope.userId)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Erro ao atualizar endereço' }, { status: 500 });
    // Nenhuma linha afetada = o endereço não é do usuário. 404 não revela existência.
    if (!address) return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/account/addresses/[id]
 * Mesmo princípio: o filtro de dono acompanha o delete.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scope = await getUserScope();
    if (!scope) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    const { data, error } = await scope.client
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', scope.userId)
      .select('id')
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Erro ao remover endereço' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}