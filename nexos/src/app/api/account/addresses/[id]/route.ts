import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { type, street, number, complement, neighborhood, city, state, cep, country, isDefault } = body;

    if (isDefault) {
      await client.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    }

    const updates: Record<string, string | boolean | null> = { updated_at: new Date().toISOString() };
    if (type !== undefined) updates.type = type;
    if (street !== undefined) updates.street = street.trim();
    if (number !== undefined) updates.number = number.trim();
    if (complement !== undefined) updates.complement = complement?.trim() || null;
    if (neighborhood !== undefined) updates.neighborhood = neighborhood.trim();
    if (city !== undefined) updates.city = city.trim();
    if (state !== undefined) updates.state = state.trim();
    if (cep !== undefined) updates.cep = cep.trim();
    if (country !== undefined) updates.country = country.trim();
    if (isDefault !== undefined) updates.is_default = isDefault;

    const { data: address, error } = await client
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !address) {
      return NextResponse.json({ error: 'Erro ao atualizar endereço' }, { status: 500 });
    }

    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await client
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Erro ao remover endereço' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
