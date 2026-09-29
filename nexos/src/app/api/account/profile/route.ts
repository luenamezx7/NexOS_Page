import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/profile
 * Returns the authenticated user's profile data.
 * Combines data from `profiles` table and `auth.users` metadata.
 */
export async function GET() {
  try {
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile, error } = await client
      .from('profiles')
      .select('full_name, phone, updated_at')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 });
    }

    const admin = createAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(user.id);

    return NextResponse.json({
      email: user.email,
      fullName: profile?.full_name ?? userData?.user?.user_metadata?.full_name ?? '',
      phone: profile?.phone ?? '',
      emailConfirmed: !!user.email_confirmed_at,
      lastSignIn: userData?.user?.last_sign_in_at ?? null,
      createdAt: userData?.user?.created_at ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/account/profile
 * Updates the authenticated user's profile (fullName, phone).
 * Uses UPSERT to create the profile row if it doesn't exist yet.
 */
export async function PATCH(req: NextRequest) {
  try {
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone } = body;

    if (fullName !== undefined && typeof fullName !== 'string') {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }
    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (fullName !== undefined) updates.full_name = fullName.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const { error } = await client
      .from('profiles')
      .upsert({ id: user.id, ...updates });

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
