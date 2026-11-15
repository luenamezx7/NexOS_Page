import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ENTRY_PATH = '/verificar';
export const ENTRY_ACTION = 'site-entry';
export const ENTRY_TTL = 30 * 60;
export const CHALLENGE_TTL = 5 * 60;
type Purpose = 'challenge' | 'clearance';
type Claims = { purpose: Purpose; expires: number; nonce: string; browser: string };

export function siteEntryEnforced() {
  if (process.env.SITE_ENTRY_ENFORCED === 'true') return true;
  if (process.env.SITE_ENTRY_ENFORCED === 'false') return false;
  if (process.env.TURNSTILE_ENFORCED === 'false') return false;
  return process.env.TURNSTILE_ENFORCED === 'true' || process.env.NODE_ENV === 'production';
}

function secret() {
  const key = process.env.SITE_ENTRY_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!key || key.length < 32) throw new Error('Verificação de entrada indisponível.');
  return key;
}
const browserHash = (userAgent: string) => createHash('sha256').update(userAgent).digest('base64url');
const signature = (payload: string) => createHmac('sha256', secret()).update(`ezway-site-entry-v1:${payload}`).digest();

export function createEntryToken(purpose: Purpose, userAgent: string, now = Date.now()) {
  const claims: Claims = { purpose, expires: Math.floor(now / 1000) + (purpose === 'challenge' ? CHALLENGE_TTL : ENTRY_TTL), nonce: randomBytes(24).toString('hex'), browser: browserHash(userAgent) };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return { token: `${payload}.${signature(payload).toString('base64url')}`, claims };
}

export function readEntryToken(token: string | undefined, purpose: Purpose, userAgent: string, now = Date.now()): Claims | null {
  try {
    if (!token || token.length > 1024) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const actual = Buffer.from(parts[1], 'base64url');
    const expected = signature(parts[0]);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as Claims;
    const seconds = Math.floor(now / 1000);
    const ttl = purpose === 'challenge' ? CHALLENGE_TTL : ENTRY_TTL;
    return claims.purpose === purpose && Number.isInteger(claims.expires) && claims.expires > seconds && claims.expires <= seconds + ttl &&
      /^[a-f0-9]{48}$/.test(claims.nonce) && claims.browser === browserHash(userAgent) ? claims : null;
  } catch { return null; }
}

export function entryCookies(requestUrl: string) {
  const secure = new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || requestUrl).protocol === 'https:';
  const prefix = secure ? '__Host-' : '';
  return { clearance: `${prefix}ezway-clearance`, challenge: `${prefix}ezway-entry`, secure };
}

/** Page requests are protected independently of Accept, RSC and prefetch headers. */
export function isEntryProtectedPath(path: string) {
  return path !== ENTRY_PATH && !path.startsWith(`${ENTRY_PATH}/`) && path !== '/api' && !path.startsWith('/api/') &&
    !path.startsWith('/_next/') && !path.startsWith('/.well-known/') && !['/robots.txt', '/sitemap.xml'].includes(path);
}

export function entryReturnPath(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || /[\\\u0000-\u0020\u007f]/.test(value)) return '/';
  try {
    const url = new URL(value, 'https://entry.invalid');
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== 'https://entry.invalid' || path.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(path) || !isEntryProtectedPath(path)) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return '/'; }
}
