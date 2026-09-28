'use server';

import { resend, FROM_EMAIL } from '@/lib/emails/resend';
import { WelcomeEmail } from '@/emails/welcome';
import { MagicLinkEmail } from '@/emails/magic-link';
import { ResetPasswordEmail } from '@/emails/reset-password';
import { VerifyEmail } from '@/emails/verify-email';
import { NotificationEmail } from '@/emails/notification';

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
  userType: 'user' | 'admin' = 'user'
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Bem-vindo ao NexOS! 🚀',
      react: WelcomeEmail({
        name,
        dashboardUrl: getDashboardUrl(userType),
      }),
    });

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
 * Envia magic link ou OTP para login sem senha
 */
export async function sendMagicLinkEmail(
  email: string,
  name: string,
  magicLink: string,
  expiresInMinutes: number = 15,
  isOtp: boolean = false,
  otpCode?: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: isOtp ? `Seu código de acesso: ${otpCode}` : 'Acesse sua conta no NexOS',
      react: MagicLinkEmail({
        name,
        magicLink,
        expiresInMinutes,
        isOtp,
        otpCode,
      }),
    });

    if (error) {
      console.error('[sendMagicLinkEmail] Erro:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[sendMagicLinkEmail] Exceção:', error);
    return { success: false, error: 'Erro interno ao enviar e-mail' };
  }
}

/**
 * Envia email de redefinição de senha
 */
export async function sendResetPasswordEmail(
  email: string,
  name: string,
  resetLink: string,
  expiresInMinutes: number = 30
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Redefina sua senha no NexOS',
      react: ResetPasswordEmail({
        name,
        resetLink,
        expiresInMinutes,
      }),
    });

    if (error) {
      console.error('[sendResetPasswordEmail] Erro:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[sendResetPasswordEmail] Exceção:', error);
    return { success: false, error: 'Erro interno ao enviar e-mail' };
  }
}

/**
 * Envia email de verificação de e-mail
 */
export async function sendVerifyEmail(
  email: string,
  name: string,
  verifyLink: string,
  expiresInMinutes: number = 60
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Confirme seu e-mail para ativar sua conta NexOS',
      react: VerifyEmail({
        name,
        verifyLink,
        expiresInMinutes,
      }),
    });

    if (error) {
      console.error('[sendVerifyEmail] Erro:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[sendVerifyEmail] Exceção:', error);
    return { success: false, error: 'Erro interno ao enviar e-mail' };
  }
}

/**
 * Envia notificação genérica
 */
export async function sendNotificationEmail(
  email: string,
  name: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string,
  actionVariant?: 'primary' | 'secondary' | 'warning'
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: title,
      react: NotificationEmail({
        name,
        title,
        message,
        actionUrl,
        actionLabel,
        actionVariant,
      }),
    });

    if (error) {
      console.error('[sendNotificationEmail] Erro:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[sendNotificationEmail] Exceção:', error);
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
    const { data, error } = await resend.emails.send({
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