import { spawnSync } from 'node:child_process';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const APPLY = process.argv.includes('--apply');
const callback = 'https://nexoslab.online/api/auth/supabase/callback';

async function main() {
  if (!process.env.SUPABASE_ACCESS_TOKEN || !process.env.SUPABASE_URL) throw new Error('Configuração autorizada do Supabase ausente.');
  const ref = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
  const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
  const headers = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
  const read = async () => {
    const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Leitura de configuração: HTTP ${response.status}.`);
    return response.json();
  };
  const current = await read();
  for (const provider of ['google', 'github']) {
    const active = current[`external_${provider}_enabled`] && current[`external_${provider}_client_id`] && current[`external_${provider}_secret`];
    console.log(`${provider}: ${active ? 'provider configurado' : 'provider indisponível'}`);
    if (!active) throw new Error(`Provider ${provider} precisa de configuração no Supabase.`);
  }
  const allowed = new Set(String(current.uri_allow_list || '').split(',').map(value => value.trim()).filter(Boolean));
  console.log(`Callback da aplicação: ${allowed.has(callback) ? 'autorizado' : 'pendente'}`);
  if (!APPLY) return;
  if (!allowed.has(callback)) {
    allowed.add(callback);
    const updated = await fetch(endpoint, { method: 'PATCH', headers, body: JSON.stringify({ uri_allow_list: [...allowed].join(',') }), signal: AbortSignal.timeout(20000) });
    if (!updated.ok) throw new Error(`Atualização de callback: HTTP ${updated.status}.`);
  }
  const verified = await read();
  if (!String(verified.uri_allow_list).split(',').includes(callback)) throw new Error('Callback não confirmado após atualização.');
  console.log('Callback da aplicação autorizado e relido.');
  const command = 'vercel env add SOCIAL_AUTH_USE_SUPABASE production --scope nex-os2 --project prj_HuEB41QNsOmunUVqGs09ximPX3PM --no-sensitive --force --yes';
  const result = spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'bash',
    process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-c', command],
    { input: 'true', encoding: 'utf8', timeout: 60000, env: { ...process.env, NODE_OPTIONS: '--use-system-ca' } });
  if (result.status !== 0) throw new Error('Não foi possível ativar OAuth Supabase no projeto Vercel.');
  console.log('SOCIAL_AUTH_USE_SUPABASE=true configurado em Production. Novo deploy necessário.');
}

void main().catch(error => { console.error(error.message); process.exitCode = 1; });
