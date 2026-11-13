// Operator-only local provisioning. No public route, no default password, no execution without --apply.
import nextEnv from '@next/env';
import { randomBytes } from 'node:crypto';
import { createAuth } from '../src/lib/auth/instance.ts';
import { createPool } from '../src/lib/auth/db.ts';
nextEnv.loadEnvConfig(process.cwd());
const [email, name] = process.argv.slice(2).filter(arg => arg !== '--apply');
if (!email || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length > 100) {
  console.error('Usage: node --use-system-ca --conditions=react-server --import tsx scripts/provision-member.mjs EMAIL NAME [--apply]');
  process.exitCode = 1;
} else if (!process.argv.includes('--apply')) {
  console.log('Dry run: would create a member, send email verification and require mailbox recovery to define a password. No changes made.');
} else {
  const pool = createPool();
  try {
    const auth = createAuth({ allowServerProvisioning: true });
    const { user } = await auth.api.createUser({ body: { email: email.toLowerCase(), name, password: `Aa1!${randomBytes(48).toString('base64url')}`, role: 'user' } });
    await auth.api.sendVerificationEmail({ body: { email: user.email, callbackURL: '/portal/acesso?verified=1' } });
    console.log('Member provisioned. Verification sent; after confirmation, use password recovery. No password was displayed.');
  } catch (error) {
    console.error('Provisioning incomplete. Verify whether the member was created before retrying. Error type:', error.name);
    process.exitCode = 1;
  } finally { await pool.end(); }
}
