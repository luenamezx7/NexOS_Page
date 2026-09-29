import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/emails/actions';

// userId must come from a verified Supabase session, never from a request body.
export async function sendWelcomeIfNeeded(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) throw error;
    const user = data.user;
    if (!user?.email || !user.email_confirmed_at || user.is_anonymous || user.app_metadata.welcome_email_sent_at) return;
    if (!process.env.RESEND_API_KEY?.trim()) {
      console.error('[email/welcome] RESEND_API_KEY não configurada; envio pendente para o próximo acesso.');
      return;
    }
    // Stable content and key protect concurrent callback/login attempts (Resend: 24h).
    const result = await sendWelcomeEmail(user.email, 'cliente NexOS', 'user', `welcome/${user.id}`);
    if (!result.success) return;
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, welcome_email_sent_at: new Date().toISOString() },
    });
    if (updateError) throw updateError;
  } catch (error) {
    console.error('[email/welcome] Falha no envio ou registro', { name: error instanceof Error ? error.name : 'UnknownError' });
  }
}
