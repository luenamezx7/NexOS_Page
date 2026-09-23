const MAX_LENGTH = 512;

/**
 * Aceita apenas caminhos internos (início com "/", sem protocolo, sem "//",
 * sem barra invertida). Qualquer outra coisa vira null — evita open redirect.
 */
export function sanitizeCallbackPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length > MAX_LENGTH) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.includes('\\') || value.includes('://')) return null;
  return value;
}
