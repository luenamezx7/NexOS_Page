import 'server-only';
import { createElement } from 'react';
import { APIError } from 'better-auth/api';
import { TransactionalEmail } from '@/emails/transactional';
import { getResend, FROM_EMAIL } from '@/lib/emails/resend';

export interface AuthEmailParams { to: string; url: string; name?: string | null }

async function sendAuthEmail({ to, url }: AuthEmailParams, heading: string, message: string, actionLabel: string) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL, to: [to], subject: heading,
      text: `${heading}\n\n${message}\n\n${actionLabel}: ${url}\n\nSe você não solicitou esta ação, ignore este e-mail.`,
      react: createElement(TransactionalEmail, { heading, message, actionLabel, url }),
    });
    if (error || !data?.id) throw new Error('EMAIL_DELIVERY_FAILED');
  } catch {
    // Nunca registrar URL, token, destinatário ou conteúdo da resposta do provedor.
    console.error('[auth/email] envio indisponível', { template: actionLabel });
    throw new APIError('SERVICE_UNAVAILABLE', { code: 'EMAIL_UNAVAILABLE', message: 'Envio de e-mail temporariamente indisponível. Tente novamente.' });
  }
}

export const sendVerificationEmail = (params: AuthEmailParams) => sendAuthEmail(params,
  'Confirme seu e-mail na ezway', 'Confirme seu endereço para ativar a conta. O link expira em 1 hora.', 'Confirmar e-mail');
export const sendResetPasswordEmail = (params: AuthEmailParams) => sendAuthEmail(params,
  'Redefina sua senha na ezway', 'Recebemos um pedido de redefinição de senha. Este link é de uso único e expira em 1 hora.', 'Criar nova senha');
export const sendMagicLinkEmail = (params: AuthEmailParams) => sendAuthEmail(params,
  'Seu link de acesso à ezway', 'Use este link para entrar com segurança. Ele pode ser usado uma única vez e expira em 10 minutos.', 'Entrar na ezway');

export interface LoginCodeEmailParams { to: string; code: string }
export async function sendLoginCodeEmail({ to, code }: LoginCodeEmailParams) {
  try {
    const { LoginCodeEmail } = await import('@/emails/login-code');
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL, to: [to], subject: 'Seu código de acesso à ezway',
      text: `Seu código de acesso à ezway: ${code}\n\nDigite o código no painel de login. Ele expira em 10 minutos e é de uso único. Não compartilhe este código. Se você não solicitou o acesso, ignore este e-mail.`,
      react: createElement(LoginCodeEmail, { code }),
    });
    if (error || !data?.id) throw new Error('EMAIL_DELIVERY_FAILED');
  } catch {
    console.error('[auth/email] envio indisponível', { template: 'login-code' });
    throw new APIError('SERVICE_UNAVAILABLE', { code: 'EMAIL_UNAVAILABLE', message: 'Envio de e-mail temporariamente indisponível. Tente novamente.' });
  }
}
