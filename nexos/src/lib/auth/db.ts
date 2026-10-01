import 'server-only';
import { Pool } from 'pg';

/**
 * Pool PostgreSQL do Better Auth.
 *
 * O projeto não usa ORM (migrations são SQL versionadas), então usamos o adapter
 * Kysely embutido do Better Auth alimentado por um `pg.Pool` direto — nenhum ORM
 * novo é introduzido.
 *
 * `DATABASE_URL` deve apontar para o Postgres do Supabase e incluir
 * `sslmode=require` quando for conexão direta. Em serverless o pool é pequeno de
 * propósito: cada função tem vida curta e um pool grande só multiplica conexões
 * ociosas.
 *
 * ── Por que o pool é criado sob demanda ──
 * O Next.js importa os módulos de rota durante `next build` para coletar dados de
 * página. Se este arquivo exigisse `DATABASE_URL` já no import, o build inteiro
 * passaria a depender de um segredo de runtime e falharia em qualquer ambiente
 * onde build e execução não compartilhem variáveis. A configuração incorreta
 * precisa aparecer no primeiro request, com mensagem clara, e não no build.
 *
 * O `PostgresDialect` do Kysely aceita `pool` como função justamente para isso,
 * então não é preciso nenhum truque de proxy: o pool nasce na primeira consulta.
 */
const globalForPool = globalThis as unknown as { __nexosPgPool?: Pool };

function connectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL ausente: o Better Auth precisa da conexão Postgres para sessões. ' +
        'Copie a connection string em Supabase > Project Settings > Database.',
    );
  }
  return url;
}

/** Cria (ou reaproveita, em dev) o pool. Chamado pelo Kysely na 1ª consulta. */
export function createPool(): Pool {
  if (!globalForPool.__nexosPgPool) {
    globalForPool.__nexosPgPool = new Pool({
      connectionString: connectionString(),
      // Serverless: uma função = poucas requisições concorrentes.
      max: Number(process.env.DATABASE_POOL_MAX ?? 2),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      // O pooler do Supabase termina TLS com certificado próprio.
      ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    });
  }
  return globalForPool.__nexosPgPool;
}

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim();
}
