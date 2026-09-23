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
if (!['query', 'apply', 'history', 'advisors', 'auth-status', 'auth-harden', 'auth-hibp'].includes(mode)) throw new Error('Uso: query <sql-file> | apply <migration-file> | history | advisors | auth-status | auth-harden | auth-hibp');
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
const authMode = mode.startsWith('auth-');
if (authMode) path = 'config/auth';
if (mode === 'auth-harden') {
  const previousResponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000),
  });
  if (!previousResponse.ok) throw new Error(`Auth configuration unavailable: ${previousResponse.status}`);
  const previous = await previousResponse.json();
  const allowed = new Set((previous.uri_allow_list || '').split(',').filter(Boolean));
  if (previous.site_url) allowed.add(new URL('/auth/callback', previous.site_url).toString());
  body = {
    mailer_autoconfirm: false, mailer_allow_unverified_email_sign_ins: false,
    mailer_secure_email_change_enabled: true, refresh_token_rotation_enabled: true,
    password_min_length: Math.max(12, previous.password_min_length || 0),
    security_update_password_require_reauthentication: true,
    mfa_totp_enroll_enabled: true, mfa_totp_verify_enabled: true,
    external_anonymous_users_enabled: false,
    uri_allow_list: [...allowed].join(','),
  };
}
if (mode === 'auth-hibp') body = { password_hibp_enabled: true };
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/${path}`, {
  method: body ? authMode ? 'PATCH' : 'POST' : 'GET',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined,
  signal: AbortSignal.timeout(60000),
});
console.log(`HTTP ${response.status}`);
if (authMode && response.ok) {
  const result = await response.json();
  const safeKeys = ['site_url', 'uri_allow_list', 'mailer_autoconfirm', 'mailer_allow_unverified_email_sign_ins', 'password_min_length', 'password_hibp_enabled', 'mfa_totp_enroll_enabled', 'mfa_totp_verify_enabled', 'refresh_token_rotation_enabled', 'external_anonymous_users_enabled', 'security_update_password_require_reauthentication', 'security_captcha_enabled'];
  console.log(JSON.stringify({ ...Object.fromEntries(safeKeys.map(key => [key, result[key]])), smtpConfigured: Boolean(result.smtp_host) }, null, 2));
} else console.log(await response.text());
if (!response.ok) process.exitCode = 1;
