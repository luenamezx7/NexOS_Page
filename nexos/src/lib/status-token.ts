import { createHmac, timingSafeEqual } from 'node:crypto';

function secret(): string {
  const key = process.env.CHECKOUT_STATUS_SECRET || (process.env.SUPABASE_SECRET_KEY
    ? createHmac('sha256', process.env.SUPABASE_SECRET_KEY).update('nexos-checkout-status-v1').digest('hex')
    : undefined);
  if (!key || key.length < 32) throw new Error('CHECKOUT_STATUS_SECRET precisa de pelo menos 32 caracteres.');
  return key;
}

export function issueStatusToken(externalReference: string, now = Date.now()): { token: string } {
  const expiry = Math.floor(now / 1000) + 86400;
  const signature = createHmac('sha256', secret()).update(`${externalReference}.${expiry}`).digest('base64url');
  return { token: `${expiry}.${signature}` };
}

export function verifyStatusToken(externalReference: string, token: string | null | undefined, now = Date.now()): boolean {
  if (!token || token.length > 128) return false;
  const [expiry, signature, extra] = token.split('.');
  if (extra || !/^\d{10}$/.test(expiry ?? '') || !signature || Number(expiry) <= Math.floor(now / 1000)) return false;
  const expected = createHmac('sha256', secret()).update(`${externalReference}.${expiry}`).digest();
  const received = Buffer.from(signature, 'base64url');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
