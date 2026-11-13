// Read-only inventory. Emits aggregate counts, never identities or credentials.
import nextEnv from '@next/env';
import { writeFile } from 'node:fs/promises';
import { createPool } from '../src/lib/auth/db.ts';
nextEnv.loadEnvConfig(process.cwd());
const pool = createPool();
try {
  const result = await pool.query(`SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE u."emailVerified")::int AS verified,
    count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.account a WHERE a."userId" = u.id AND a."providerId" = 'credential' AND a.password IS NOT NULL))::int AS without_password,
    count(*) FILTER (WHERE u."emailVerified" AND NOT EXISTS (SELECT 1 FROM public.account a WHERE a."userId" = u.id AND a."providerId" = 'credential' AND a.password IS NOT NULL))::int AS verified_passwordless,
    count(*) FILTER (WHERE NOT u."emailVerified")::int AS needs_identity_review
    FROM public."user" u`);
  const report = { checkedAt: new Date().toISOString(), counts: result.rows[0], action: 'Preserve users and account links; use verified mailbox recovery, manually review unverified identities before production cutover.' };
  if (process.argv.includes('--save')) await writeFile('docs/nexos-lab/access-inventory.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} catch (error) { console.error('Access inventory unavailable:', error.code ?? error.name); process.exitCode = 1; }
finally { await pool.end(); }
