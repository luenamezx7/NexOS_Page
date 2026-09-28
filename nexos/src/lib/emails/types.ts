export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface WelcomeEmailData {
  email: string;
  name: string;
  userType?: 'user' | 'admin';
}

export interface MagicLinkEmailData {
  email: string;
  name: string;
  magicLink: string;
  expiresInMinutes?: number;
  isOtp?: boolean;
  otpCode?: string;
}

export interface ResetPasswordEmailData {
  email: string;
  name: string;
  resetLink: string;
  expiresInMinutes?: number;
}

export interface VerifyEmailData {
  email: string;
  name: string;
  verifyLink: string;
  expiresInMinutes?: number;
}

export interface NotificationEmailData {
  email: string;
  name: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  actionVariant?: 'primary' | 'secondary' | 'warning';
}