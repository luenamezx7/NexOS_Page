import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ENTRY_PATH = '/verificar';
export const ENTRY_ACTION = 'site-entry';
export const ENTRY_TTL = 30 * 60;
export const CHALLENGE_TTL = 5 * 60;
type Purpose = 'challenge' | 'clearance';
type Claims = { purpose: Purpose; expires: number; nonce: string; browser: string; net: string };

/**
 * F-02 — vínculo de rede do token de entrada.
 *
 * O token de clearance é um portador (bearer): quem o tiver, usa. Hoje ele é
 * atrelado ao User-Agent (que é público e trivialmente forjável), mas NÃO à
 * rede. Consequência: um cookie vazado (perfil compartilhado, HAR, log de
 * proxy) vale por 30 min a partir de QUALQUER IP — e, com o origin da Vercel
 * acessível direto (F-13), um atacante com IPs rotativos nunca esbarra nos
 * limites por IP do app.
 *
 * Aqui o token passa a carregar também o vínculo de rede, dentro do MAC
 * (HMAC-SHA256 já existente), então não é forjável.
 *
 * Política (SITE_ENTRY_NETWORK_BINDING):
 *   strict — exige match de /24 (IPv4) ou /64 (IPv6). Mais forte, mas quebra
 *            CGNAT e IPv6 rotativo (celular, VPN, iCloud Private Relay).
 *   soft   — padrão. Aceita, mas marca a sessão como "movida" (header de
 *            diagnóstico) para o time de segurança perceber cookie em
 *            circulação. Não quebra ninguém.
 *   off    — desliga (equivalente ao comportamento atual).
 *
 * O endereço vem de `trustedClientAddress` (src/lib/rate-limit.ts), que só
 * confia no header de plataforma da Vercel.
 */
function networkBinding(): 'strict' | 'soft' | 'off' {
  const value = (process.env.SITE_ENTRY_NETWORK_BINDING ?? 'soft').toLowerCase();
  return value === 'strict' || value === 'off' ? value : 'soft';
}

/** Prefixo de rede: /24 em IPv4 (256 enderecos), /64 em IPv6 (prefixo assinante). */
export function networkOf(address: string): string {
  if (!address || address === 'shared' || !isIPAddress(address)) return 'shared';
  if (address.includes(':')) return address.split(':').slice(0, 4).join(':') + '::/64';
  const parts = address.split('.');
  return parts.length === 4 ? `${parts.slice(0, 3).join('.')}.0/24` : 'shared';
}

function isIPAddress(value: string): boolean {
  return /^[0-9a-fA-F:.]+$/.test(value) && /[.:]/.test(value);
}

const netClaim = (address: string) =>
  createHmac('sha256', secret()).update(`ezway-site-entry-net-v1:${networkOf(address)}`).digest('base64url').slice(0, 22);

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

export function createEntryToken(purpose: Purpose, userAgent: string, now = Date.now(), address = 'shared') {
  const claims: Claims = { purpose, expires: Math.floor(now / 1000) + (purpose === 'challenge' ? CHALLENGE_TTL : ENTRY_TTL), nonce: randomBytes(24).toString('hex'), browser: browserHash(userAgent), net: netClaim(address) };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return { token: `${payload}.${signature(payload).toString('base64url')}`, claims };
}

export function readEntryToken(token: string | undefined, purpose: Purpose, userAgent: string, now = Date.now(), address = 'shared'): Claims | null {
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
    // Politica de vinculo de rede:
    //   strict -> a rede tem de bater (rejeita em caso contrario)
    //   soft   -> aceita a divergencia (so marca a sessao como movida)
    //   off    -> nao compara
    // BUG CORRIGIDO: a condicao final exigia netMatches mesmo em 'soft',
    // o que invalidava todo token emitido sem vinculo de rede.
    const netMatches = claims.net === netClaim(address);
    const netOk = claims.net === undefined || netMatches || networkBinding() !== 'strict';
    return claims.purpose === purpose && Number.isInteger(claims.expires) && claims.expires > seconds && claims.expires <= seconds + ttl &&
      /^[a-f0-9]{48}$/.test(claims.nonce) && claims.browser === browserHash(userAgent) && netOk ? claims : null;
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

/** O token foi visto de uma rede diferente da original (policy 'soft'). */
export function entryNetworkMoved(claims: Claims | null, address: string): boolean {
  if (!claims || networkBinding() !== 'soft') return false;
  return claims.net !== netClaim(address);
}
