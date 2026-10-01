import { readFileSync } from 'node:fs';
import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());
const file = 'supabase/migrations/20261001152936_auth_methods_and_email_outbox.sql';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente');
  const result = await pool.query("select to_regclass('public.passkey') is not null as passkey, to_regclass('public.auth_email_outbox') is not null as outbox");
  if (result.rows[0].passkey && result.rows[0].outbox) {
    console.log('Migration de autenticação já aplicada.');
  } else if (!process.argv.includes('--apply')) {
    console.log(`Migration pendente: ${file}. Execute npm run migrate:auth -- --apply para aplicar.`);
  } else {
    // DDL transacional: falhas não deixam um schema parcialmente aplicado.
    await pool.query(readFileSync(file, 'utf8'));
    console.log('Migration aplicada. Passkeys e outbox disponíveis; sessões anteriores com MFA revogadas.');
  }
} catch (error) {
  console.error('Falha na migration de autenticação.', { type: error.name, code: error.code });
  process.exitCode = 1;
} finally { await pool.end(); }
