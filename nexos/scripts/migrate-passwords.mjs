#!/usr/bin/env node
/**
 * Copia os hashes de senha do Supabase Auth para o Better Auth.
 *
 * As migrations movem as CONTAS (auth.users → public."user") mas não podem
 * converter as senhas: bcrypt e scrypt são incompatíveis e o hash não é
 * reversível. Este script copia o hash como está para `public.account`, onde o
 * verificador de formato duplo (src/lib/auth/password.ts) passa a aceitá-lo.
 *
 * ── Regra deste script: não faz nada por acidente ──
 * Sem argumentos ele roda em MODO DE LEITURA e apenas relata. Só escreve com
 * `--apply`. E a escrita é transacional: ou as senhas migram, ou nenhuma
 * delas é tocada.
 *
 * Uso:
 *   DATABASE_URL=postgres://... node scripts/migrate-passwords.mjs
 *   DATABASE_URL=postgres://... node scripts/migrate-passwords.mjs --apply
 */

import fs from 'node:fs';
import pg from 'pg';

const APPLY = process.argv.includes('--apply');

// As demais variaveis vivem no .env.local; este script e um utilitario de
// linha de comando e nao passa pelo runtime do Next.
function loadLocalEnv() {
  try {
    for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadLocalEnv();

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('DATABASE_URL ausente.');
  console.error('Supabase > Project Settings > Database > Connection string > URI (modo Session, não Transaction).');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  max: 1,
  ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
});

/** Espelha src/lib/auth/password.ts · classifyHash. */
function classify(hash) {
  if (typeof hash !== 'string' || !hash.trim()) return 'vazio';
  if (/^\$2[aby]\$\d{2}\$/.test(hash)) return 'bcrypt';
  if (/^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(hash)) return 'scrypt';
  return 'desconhecido';
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('begin');

    // As tabelas precisam existir. Falhar aqui é melhor do que criar conta sem
    // senha e descobrir o problema no primeiro login de um usuário.
    const { rows: tables } = await client.query(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_name in ('user','account')`,
    );
    const found = new Set(tables.map((t) => t.table_name));
    for (const t of ['user', 'account']) {
      if (!found.has(t)) throw new Error(`Tabela public."${t}" não existe. Aplique 20260930120000_better_auth.sql antes.`);
    }

    // Só usuários já copiados pelo cutover. Ler auth.users direto escreveria em
    // contas que não existem.
    const { rows: candidates } = await client.query(`
      select u.id, lower(u.email) as email, u.encrypted_password as hash
        from auth.users u
        join public."user" bu on bu.id = u.id
       where u.encrypted_password is not null and u.encrypted_password <> ''
    `);

    const { rows: already } = await client.query(
      `select "userId" from public.account where "providerId" = 'credential'`,
    );
    const taken = new Set(already.map((r) => r.userId));

    const stats = { bcrypt: 0, scrypt: 0, vazio: 0, desconhecido: 0, jaMigrado: 0 };
    const unknownSamples = [];
    const pending = [];

    for (const row of candidates) {
      const kind = classify(row.hash);
      stats[kind] += 1;
      if (taken.has(row.id)) stats.jaMigrado += 1;
      else pending.push({ ...row, kind });

      if (kind === 'desconhecido' && unknownSamples.length < 5) {
        // Só o prefixo: imprime o suficiente para identificar o algoritmo sem
        // despejar um hash completo no terminal.
        unknownSamples.push({ email: row.email, prefix: String(row.hash).slice(0, 12) });
      }
    }

    console.log('── Diagnóstico ──');
    console.log('  usuários com senha em auth.users :', candidates.length);
    console.log('  formato bcrypt (migráveis)        :', stats.bcrypt);
    console.log('  formato scrypt (já no padrão)     :', stats.scrypt);
    console.log('  sem senha (OAuth/sem credencial)  :', stats.vazio);
    console.log('  formato desconhecido              :', stats.desconhecido);
    console.log('  já possuem conta credential       :', stats.jaMigrado);
    console.log('  a copiar agora                    :', pending.length);

    if (unknownSamples.length) {
      console.log('\n  ⚠  hashes em formato não reconhecido:');
      for (const s of unknownSamples) console.log(`     ${s.email}  ${s.prefix}…`);
      console.log('     Nenhum destes será importado. Investigue antes de prosseguir.');
    }

    if (!APPLY) {
      await client.query('rollback');
      console.log('\nMODO LEITURA: nada foi alterado. Rode com --apply para escrever.');
      return;
    }

    if (!pending.length) {
      await client.query('rollback');
      console.log('\nNada a copiar.');
      return;
    }

    // Uma única instrução: ou todas as senhas entram, ou nenhuma entra.
    const migrated = await client.query(
      `insert into public.account
         (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       select gen_random_uuid(), u.id::text, 'credential', u.id, u.encrypted_password, now(), now()
         from auth.users u
        where u.id = any($1::uuid[])
          and u.encrypted_password is not null
          and u.encrypted_password <> ''
          and not exists (
            select 1 from public.account a
             where a."userId" = u.id and a."providerId" = 'credential'
          )
       on conflict ("userId", "providerId") do update
          set password = excluded.password, "updatedAt" = now()`,
      [pending.map((p) => p.id)],
    );

    await client.query('commit');

    const byKind = pending.reduce((acc, p) => ({ ...acc, [p.kind]: (acc[p.kind] ?? 0) + 1 }), {});
    console.log('\n✔ CONCLUÍDO');
    console.log('  senhas copiadas:', migrated.rowCount, JSON.stringify(byKind));
    console.log('  Aguarde ~100ms por login: bcrypt é mais lento que scrypt.');
    console.log('  Faça login com uma conta real para validar antes de avisar os usuários.');
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error('\n✖ Falhou, nada foi gravado:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();