import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

export function matchesWebhookSecret(
  received: string | null,
  expected: string | undefined,
): boolean {
  if (!expected || !received || received.length > 1024) return false;
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  return timingSafeEqual(digest(received), digest(expected));
}
