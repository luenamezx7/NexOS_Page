import 'server-only';

/**
 * Server-only email sending actions via Resend SDK.
 *
 * These functions are NOT exposed as Server Actions — they are internal
 * helpers called by other server code (e.g., sendWelcomeIfNeeded).
 * Do not expose recipient addresses via public Server Actions or API routes.
 */

import { getResend, FROM_EMAIL } from '@/lib/emails/resend';
import { WelcomeEmail } from '@/emails/welcome';

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://nexoslab.online';
}

function getDashboardUrl(userType: 'user' | 'admin'): string {
  const base = getBaseUrl();
  return userType === 'admin' ? `${base}/admin-dashboard-su/secure-entry` : `${base}/conta`;
}

/**
 * Envia email de boas-vindas após confirmação de cadastro
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  userType: 'user' | 'admin' = 'user',
  idempotencyKey?: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Bem-vindo ao NexOS! 🚀',
      react: WelcomeEmail({
        name,
        dashboardUrl: getDashboardUrl(userType),
      }),
    }, idempotencyKey ? { idempotencyKey } : undefined);

    if (error) {
      console.error('[sendWelcomeEmail] Erro:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[sendWelcomeEmail] Exceção:', error);
    return { success: false, error: 'Erro interno ao enviar e-mail' };
  }
}

/**
 * Envia email customizado com React Email
 */
export async function sendCustomEmail(
  email: string,
  subject: string,
  react: React.ReactElement
): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      react,
    });

    if (error) {
      console.error('[sendCustomEmail] Erro:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[sendCustomEmail] Exceção:', error);
    return { success: false, error: 'Erro interno ao enviar e-mail' };
  }
}
