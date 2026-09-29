import { Resend } from 'resend';

let client: Resend | undefined;

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error('RESEND_API_KEY não configurada no servidor');
  return client ??= new Resend(key);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NexOS <noreply@nexoslab.online>';
