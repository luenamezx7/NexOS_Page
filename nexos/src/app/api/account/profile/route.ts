import { NextRequest, NextResponse } from 'next/server';
import { getUserScope } from '@/lib/db/user-scope';
import { getAuth } from '@/lib/auth/instance';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * Perfil do usuário autenticado.
 *
 * `id` da linha é o próprio id do usuário: o escopo garante a posse, então não
 * há id vindo do cliente que pudesse ser adulterado.
 */
export async function GET() {
  try {
    const scope = await getUserScope();
    if (!scope) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { data: profile, error } = await scope
      .selectOwn('profiles')
      .select('full_name, phone, updated_at')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 });
    }

    const session = await getAuth().api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
    return NextResponse.json({
      email: scope.email,
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      emailConfirmed: true,
      twoFactorEnabled: session?.user.twoFactorEnabled === true,
      lastSignIn: session?.session.createdAt ?? null,
      createdAt: session?.user.createdAt ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/** Atualiza nome e telefone. A linha é identificada pelo usuário da sessão. */
export async function PATCH(req: NextRequest) {
  try {
    const scope = await getUserScope();
    if (!scope) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });

    const { fullName, phone } = body as { fullName?: unknown; phone?: unknown };
    if (fullName !== undefined && typeof fullName !== 'string') {
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    }
    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (fullName !== undefined) updates.full_name = String(fullName).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();

    const { error } = await scope.client
      .from('profiles')
      .upsert({ id: scope.userId, ...updates });

    if (error) return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
