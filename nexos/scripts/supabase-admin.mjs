// Documented Management API fallback when the CLI transport fails.
// Credentials are read from the environment, never logged or used as DB passwords.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const [mode, argument] = process.argv.slice(2);
const ref = process.env.SUPABASE_PROJECT_REF;
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && process.platform === 'win32') {
  token = execFileSync('powershell.exe', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN','User')"], { encoding: 'utf8' }).trim();
}
if (!token || !ref) throw new Error('Configure SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF.');
if (!['query', 'apply', 'history', 'advisors'].includes(mode)) throw new Error('Uso: query <sql-file> | apply <migration-file> | history | advisors');
let path = 'database/query';
let body;
if (mode === 'query') body = { query: await readFile(argument, 'utf8') };
if (mode === 'apply') {
  path = 'database/migrations';
  const name = argument.split(/[\\/]/).pop().replace(/^\d+_/, '').replace(/\.sql$/, '');
  const query = (await readFile(argument, 'utf8')).replace(/^begin;\s*$/gmi, '').replace(/^commit;\s*$/gmi, '');
  body = { name, query };
}
if (mode === 'history') path = 'database/migrations';
if (mode === 'advisors') path = 'advisors/security';
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/${path}`, {
  method: body ? 'POST' : 'GET',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined,
  signal: AbortSignal.timeout(60000),
});
console.log(`HTTP ${response.status}`);
console.log(await response.text());
if (!response.ok) process.exitCode = 1;
