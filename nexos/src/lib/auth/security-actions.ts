'use server';

import { headers } from 'next/headers';
import { getUserAccess } from './session';
import { getAuth } from './instance';
import { evaluatePassword } from './password-strength';
import { authErrorMessage } from './error-message';
import { enqueueNotification } from '@/lib/emails/notifications';
import { randomUUID } from 'node:crypto';

/** setPassword é server-only no SDK; não expor um endpoint sem sessão. */
export async function setFirstPassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const access = await getUserAccess();
  if (!access.ok) return { ok: false, error: 'Sua sessão expirou. Entre novamente.' };
  if (typeof newPassword !== 'string' || newPassword.length > 256 || !evaluatePassword(newPassword).acceptable) {
    return { ok: false, error: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.' };
  }
  try {
    await getAuth().api.setPassword({ headers: await headers(), body: { newPassword } });
    await enqueueNotification(access.userId, `password/${randomUUID()}`, { kind: 'security', detail: 'Uma senha foi definida para sua conta.' });
    return { ok: true };
  } catch (error) { return { ok: false, error: authErrorMessage(error, 'Não foi possível definir a senha. Entre novamente e tente de novo.') }; }
}
