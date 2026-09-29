// Inspect SMTP/CAPTCHA and add OTP to existing templates without replacing branding.
// Usage: node --use-system-ca scripts/configure-auth-email.mjs [--apply]
import env from '@next/env';
env.loadEnvConfig(process.cwd());

const projectUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!projectUrl || !token) {
  console.error('Configure SUPABASE_URL e SUPABASE_ACCESS_TOKEN no ambiente local.');
  process.exit(1);
}
const ref = new URL(projectUrl).hostname.split('.')[0];
const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function config(method = 'GET', body) {
  const response = await fetch(endpoint, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Supabase Management API: HTTP ${response.status}`);
  return response.json();
}

try {
  const before = await config();
  console.log('Projeto:', ref);
  for (const key of ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_admin_email', 'site_url', 'security_captcha_enabled', 'security_captcha_provider', 'mailer_otp_length', 'hook_send_email_enabled']) {
    console.log(`${key}:`, before[key]);
  }
  // Never print credentials, hashes, message bodies, user addresses or tokens.
  const patch = {};
  for (const key of ['mailer_templates_confirmation_content', 'mailer_templates_magic_link_content']) {
    const html = before[key];
    if (typeof html !== 'string' || !html.trim()) throw new Error(`Template ausente: ${key}`);
    if (/\{\{\s*\.Token\s*\}\}/.test(html)) continue;
    const otp = '<div style="padding:24px;text-align:center;font-family:Arial,sans-serif"><p>Seu código de acesso NexOS:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p><p>Digite este código na tela de acesso. Não compartilhe com ninguém. Use apenas o código mais recente.</p></div>';
    patch[key] = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${otp}</body>`) : `${html}\n${otp}`;
  }
  console.log('Templates que precisam incluir OTP:', Object.keys(patch));
  if (process.argv.includes('--apply') && Object.keys(patch).length) {
    await config('PATCH', patch);
    const after = await config();
    for (const [key, value] of Object.entries(patch)) {
      if (after[key] !== value) throw new Error(`Verificação falhou: ${key}`);
    }
    console.log('Templates atualizados e verificados.');
  } else if (Object.keys(patch).length) {
    console.log('Execute com --apply para adicionar o código preservando os templates existentes.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Não foi possível verificar a configuração.');
  process.exitCode = 1;
}
