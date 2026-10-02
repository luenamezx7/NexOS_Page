// Limpeza operacional explicitamente solicitada; não executar como migration/deploy.
// Dry-run por padrão. --apply exige a quantidade previamente conferida.
import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes('--apply');
const expectedArg = process.argv.find(value => value.startsWith('--expected-users='));
const expected = expectedArg ? Number(expectedArg.split('=')[1]) : NaN;

const countsSQL = `select
  (select count(*)::int from auth.users) as supabase_auth_users,
  (select count(*)::int from public."user") as better_auth_users,
  (select count(*)::int from public.session) as sessions,
  (select count(*)::int from public.account) as credential_accounts,
  (select count(*)::int from public.profiles) as profiles,
  (select count(*)::int from public.passkey) as passkeys,
  (select count(*)::int from public."twoFactor") as two_factor,
  (select count(*)::int from public.account_email_index) as email_index,
  (select count(*)::int from public.auth_email_outbox) as email_outbox,
  (select count(*)::int from public.verification) as pending_verifications,
  (select count(*)::int from public.orders) as orders,
  (select count(*)::int from public.orders where owner_id is not null) as owned_orders`;

async function main() {
  if (!process.env.DATABASE_URL || !process.env.SUPABASE_URL) throw new Error('Ambiente de banco ausente.');
  const ref = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
  const database = new URL(process.env.DATABASE_URL);
  if (!database.hostname.includes(ref) && !decodeURIComponent(database.username).includes(ref)) {
    throw new Error('A conexão Postgres não corresponde ao projeto Supabase configurado.');
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, max: 1 });
  let client;
  try {
    client = await pool.connect();
    const before = (await client.query(countsSQL)).rows[0];
    console.log('Antes:', JSON.stringify(before));
    if (!apply) { console.log('Somente leitura. --apply --expected-users=N executa a limpeza das contas Better Auth.'); return; }
    if (!Number.isInteger(expected) || expected < 0) throw new Error('Informe --expected-users=N após conferir a contagem.');
    if (before.supabase_auth_users !== 0) throw new Error('Supabase Authentication ainda contém usuários; use a API/painel Auth para removê-los antes desta limpeza.');
    await client.query('begin');
    try {
      await client.query("set local lock_timeout = '5s'");
      await client.query("set local statement_timeout = '30s'");
      await client.query('lock table public."user", public.session, public.orders, public.idempotency_keys, public.verification in share row exclusive mode');
      const users = await client.query('select id from public."user" for update');
      if (users.rowCount !== expected) throw new Error('A quantidade de usuários mudou. Confira novamente antes de excluir.');
      const ids = users.rows.map(user => user.id);
      const preserved = await client.query('update public.orders set owner_id = null where owner_id = any($1::uuid[])', [ids]);
      await client.query('update public.idempotency_keys set owner_id = null where owner_id = any($1::uuid[])', [ids]);
      const revoked = await client.query('delete from public.session where "userId" = any($1::uuid[])', [ids]);
      const removed = await client.query('delete from public."user" where id = any($1::uuid[])', [ids]);
      // Invalida reset, Magic Link, MFA e OAuth pendentes, incluindo verificadores PKCE.
      const pending = await client.query('delete from public.verification');
      const after = (await client.query(countsSQL)).rows[0];
      for (const key of ['supabase_auth_users', 'better_auth_users', 'sessions', 'credential_accounts', 'profiles', 'passkeys', 'two_factor', 'email_index', 'email_outbox', 'pending_verifications']) {
        if (after[key] !== 0) throw new Error(`Limpeza incompleta: ${key}. Transação cancelada.`);
      }
      if (after.orders !== before.orders) throw new Error('A quantidade de pedidos mudou. Transação cancelada.');
      await client.query('commit');
      console.log('Efetivado:', JSON.stringify({ users_removed: removed.rowCount, sessions_revoked: revoked.rowCount,
        pending_verifications_removed: pending.rowCount, orders_preserved_and_unlinked: preserved.rowCount }));
      console.log('Depois:', JSON.stringify(after));
    } catch (error) { await client.query('rollback'); throw error; }
  } finally { client?.release(); await pool.end(); }
}

void main().catch(error => { console.error('Limpeza não concluída:', error.message); process.exitCode = 1; });
