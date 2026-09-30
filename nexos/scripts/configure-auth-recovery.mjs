// Updates only the recovery email template for the Supabase project used by this app.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import env from '@next/env';

env.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const token = process.env.SUPABASE_ACCESS_TOKEN;
assert.ok(url && token, 'SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required');
const hostname = new URL(url).hostname;
assert.ok(hostname.endsWith('.supabase.co'), 'A hosted Supabase project is required');
const ref = hostname.split('.')[0];
const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const template = await readFile(new URL('../supabase/templates/recovery.html', import.meta.url), 'utf8');

async function getConfig() {
  const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20000) });
  assert.ok(response.ok, `Could not inspect Auth configuration (${response.status})`);
  return response.json();
}

const before = await getConfig();
const changes = {
  mailer_templates_recovery_content: template,
  mailer_subjects_recovery: 'Redefina sua senha no NexOS',
};
if (process.argv.includes('--check')) {
  assert.equal(before.mailer_templates_recovery_content, template, 'Recovery template body is not configured');
  assert.equal(before.mailer_subjects_recovery, changes.mailer_subjects_recovery, 'Recovery subject is not configured');
} else if (before.mailer_templates_recovery_content !== template || before.mailer_subjects_recovery !== changes.mailer_subjects_recovery) {
  const updated = await fetch(endpoint, {
    method: 'PATCH', headers,
    body: JSON.stringify(changes),
    signal: AbortSignal.timeout(20000),
  });
  assert.ok(updated.ok, `Could not update recovery template (${updated.status})`);
  const after = await getConfig();
  assert.equal(after.mailer_templates_recovery_content, template, 'Recovery template update was not persisted');
  assert.equal(after.mailer_subjects_recovery, changes.mailer_subjects_recovery, 'Recovery subject update was not persisted');
  assert.equal(after.site_url, before.site_url, 'Site URL must remain unchanged');
  assert.equal(after.mailer_autoconfirm, before.mailer_autoconfirm, 'Email confirmation must remain enabled');
}
console.log(`PASS: recovery email body and subject are configured for project ${ref}.`);
