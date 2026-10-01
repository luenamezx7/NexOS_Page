// Reutiliza configuração autorizada; nunca imprime valores ou passa segredos em argv.
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes('--apply');
const values = Object.fromEntries(['BETTER_AUTH_SECRET', 'DATABASE_URL', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'RESEND_FROM_EMAIL'].map(key => [key, process.env[key]?.trim()]));

// Credenciais Google anteriores podem estar no provider Supabase. Só leitura.
if ((!values.GOOGLE_CLIENT_ID || !values.GOOGLE_CLIENT_SECRET) && process.env.SUPABASE_ACCESS_TOKEN && process.env.SUPABASE_URL) {
  const ref = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(20000),
  });
  if (response.ok) {
    const auth = await response.json();
    const id = auth.external_google_client_id, secret = auth.external_google_secret;
    if (typeof id === 'string' && typeof secret === 'string' && id.trim() && secret.trim() && !secret.includes('*')) {
      values.GOOGLE_CLIENT_ID = id.split(',')[0].trim(); values.GOOGLE_CLIENT_SECRET = secret.trim();
      console.log('Configuração anterior de Google recuperada via Management API.');
    }
  } else console.log(`Configuração anterior Google indisponível: HTTP ${response.status}.`);
}
if (apply) values.CRON_SECRET = process.env.CRON_SECRET?.trim() || randomBytes(48).toString('hex');

for (const [key, value] of Object.entries(values)) {
  if (!value) { console.log(`${key}: ausente`); continue; }
  if (!apply) { console.log(`${key}: disponível para configurar`); continue; }
  const command = `vercel env add ${key} production --scope nex-os2 --project prj_HuEB41QNsOmunUVqGs09ximPX3PM --sensitive --yes`;
  const result = spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'bash',
    process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-c', command],
    { input: value, encoding: 'utf8', timeout: 60000, env: { ...process.env, NODE_OPTIONS: '--use-system-ca' } });
  console.log(`${key}: ${result.status === 0 ? 'configurada em produção' : 'não configurada (verifique se já existe ou se há acesso)'}`);
  if (result.status !== 0) process.exitCode = 1;
}
