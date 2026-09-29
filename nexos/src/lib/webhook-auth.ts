import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Verifica se o token de webhook fornecido corresponde ao esperado.
 * Usa timing-safe comparison para prevenir timing attacks.
 * Rejeita tokens com mais de 1024 caracteres.
 */
export function matchesWebhookSecret(
  received: string | null,
  expected: string | undefined,
): boolean {
  if (!expected || !received || received.length > 1024) return false;
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  return timingSafeEqual(digest(received), digest(expected));
}
