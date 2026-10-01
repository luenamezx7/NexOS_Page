import 'server-only';
import { getResend, FROM_EMAIL } from '@/lib/emails/resend';

/**
 * Envio de e-mails transacionais de autenticação via Resend.
 *
 * URLs de verificação e redefinição carregam token de uso único: nunca são
 * registradas em log nem incluídas no corpo do erro devolvido ao cliente.
 */

interface AuthEmailParams {
  to: string;
  url: string;
  name?: string | null;
}

async function sendAuthEmail(to: string, subject: string, heading: string, actionLabel: string, url: string, extra: string): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject,
    text: `${heading}\n\n${actionLabel}: ${url}\n\n${extra}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;background:#0b0b0d;color:#e8e8ea;padding:32px">
  <h1 style="font-size:22px;margin:0 0 16px">${heading}</h1>
  <p style="font-size:15px;line-height:1.6;color:#b3b3b3;margin:0 0 24px">${extra}</p>
  <p style="margin:0 0 28px">
    <a href="${url}" style="display:inline-block;padding:14px 28px;border-radius:10px;background:linear-gradient(135deg,#ff6b4a 0%,#ff3366 100%);color:#fff;text-decoration:none;font-weight:600">${actionLabel}</a>
  </p>
  <p style="font-size:13px;line-height:1.6;color:#6b6b6b;margin:0 0 8px">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
  <p style="font-size:13px;word-break:break-all;color:#8a8a8a;margin:0">${url}</p>
  <p style="font-size:13px;line-height:1.6;color:#6b6b6b;margin:28px 0 0">Se você não solicitou esta ação, ignore este e-mail.</p>
</div>`,
  });
  // Falha de entrega é logada sem a URL (contém token) e sem o endereço completo.
  if (error) console.error('[auth/mailer] falha no envio', { subject, name: error.name });
}

export async function sendVerificationEmail({ to, url, name }: AuthEmailParams): Promise<void> {
  await sendAuthEmail(
    to,
    'Confirme seu e-mail no NexOS',
    'Confirme seu e-mail',
    'Confirmar e-mail',
    url,
    `Olá${name ? `, ${escapeHtml(name)}` : ''}! Confirme seu e-mail para ativar sua conta. O link expira em 1 hora.`,
  );
}

export async function sendResetPasswordEmail({ to, url, name }: AuthEmailParams): Promise<void> {
  await sendAuthEmail(
    to,
    'Redefina sua senha no NexOS',
    'Redefina sua senha',
    'Criar nova senha',
    url,
    `Olá${name ? `, ${escapeHtml(name)}` : ''}! Recebemos um pedido para redefinir sua senha. O link é de uso único e expira em 1 hora.`,
  );
}

/** Caracteres de controle que quebrariam o HTML do e-mail. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}