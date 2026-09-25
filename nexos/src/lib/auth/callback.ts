const MAX_LENGTH = 512;

/**
 * Aceita apenas caminhos internos (início com "/", sem protocolo, sem "//",
 * sem barra invertida). Qualquer outra coisa vira null — evita open redirect.
 */
export function sanitizeCallbackPath(value: unknown): string | null {
  // Next searchParams can contain arrays when a query parameter is repeated.
  if (typeof value !== 'string' || !value) return null;
  if (value.length > MAX_LENGTH) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.includes('\\') || value.includes('://')) return null;
  // URL parsers strip control characters and normalize dot segments. Validate
  // the normalized path too, otherwise a login callback can loop back to itself.
  if (/[\u0000-\u0020\u007f]/.test(value)) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(new URL(value, 'https://callback.invalid').pathname); }
  catch { return null; }
  if (decoded.startsWith('//') || decoded.includes('\\') || /[\u0000-\u0020\u007f]/.test(decoded)) return null;
  const path = decoded.replace(/\/+$/, '').toLowerCase();
  if (/^\/(?:api|auth)(?:\/|$)/.test(path) ||
      ['/portal/acesso', '/admin-dashboard-su/secure-entry', '/login', '/entrar'].includes(path)) return null;
  return value;
}
