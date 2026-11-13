import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { RequestError } from '@/lib/request-security';
import { getUserAccess } from '@/lib/auth/session';

/**
 * Escopo de dados do usuário autenticado.
 *
 * POR QUE ESTE MÓDULO EXISTE
 *
 * As tabelas de cliente (como `profiles`) tinham RLS
 * baseado em `auth.uid()`, que vem do JWT do Supabase Auth. Com o Better Auth
 * não existe mais esse JWT: uma sessão Better Auth não se transforma em sessão
 * Supabase. Manter o cliente "do usuário" deixaria `auth.uid()` nulo e o RLS
 * negaria tudo.
 *
 * Consequência: a consulta passa pela conexão privilegiada — que ignora RLS — e o
 * filtro de propriedade passa a ser responsabilidade exclusiva deste arquivo.
 * Por isso a leitura vem pronta (`selectOwn`).
 *
 * RLS continua ligado, sem policies de cliente: um grant futuro a
 * `anon`/`authenticated` ainda cairia no default-deny.
 */

const OWNERSHIP = {
  profiles: 'id',
} as const;

export type OwnedTable = keyof typeof OWNERSHIP;

type AdminClient = ReturnType<typeof createAdminClient>;

export type UserScope = {
  ok: true;
  userId: string;
  email: string;
  /** Cliente privilegiado — usar apenas com filtro de posse aplicado. */
  client: AdminClient;
  /** Leitura da tabela já restrita ao usuário. */
  selectOwn(table: OwnedTable): ReturnType<ReturnType<AdminClient['from']>['select']>;
};

function ownerColumn(table: OwnedTable): string {
  const column = OWNERSHIP[table];
  if (!column) throw new Error(`Tabela "${table}" não tem dono declarado: adicione em OWNERSHIP antes de usar.`);
  return column;
}

/**
 * Valida a sessão e devolve o escopo de dados.
 * `null` significa "sem sessão válida" — o chamador deve responder 401.
 */
export async function getUserScope(): Promise<UserScope | null> {
  const access = await getUserAccess();
  if (!access.ok) {
    if (access.status !== 401) throw new RequestError(access.status === 503 ? 'Serviço indisponível.' : 'Acesso negado.', access.status);
    return null;
  }

  const client = createAdminClient();
  const userId = access.userId;

  return {
    ok: true,
    userId,
    email: access.email,
    client,
    selectOwn(table) {
      return client.from(table).select('*').eq(ownerColumn(table), userId);
    },
  };
}
