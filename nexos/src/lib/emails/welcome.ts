import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/emails/actions';

const TEMPLATE = 'boas-vindas';

/**
 * Envia o e-mail de boas-vindas uma vez por conta, logo após a confirmação.
 *
 * Substitui o antigo registro em `auth.users.app_metadata`, que dependia do
 * GoTrue. Agora o controle é a chave primária de `public.welcome_email_log`.
 *
 * A reserva acontece ANTES do envio: se o envio falhar, a linha é removida e a
 * próxima tentativa pode refazer. O inverso (marcar depois) abriria uma janela
 * em que um envio bem-sucedido não é registrado e o usuário recebe o e-mail de
 * novo. A chave primária resolve a corrida entre requests simultâneos — o
 * segundo recebe violação de PK e não envia.
 *
 * Nunca lança: uma falha de e-mail não pode derrubar o acesso do usuário.
 */
export async function sendWelcomeIfNeeded(userId: string, knownEmail?: string): Promise<void> {
  try {
    const admin = createAdminClient();

    // Reserva atômica: se já existe, alguém já cuidou deste envio.
    const { error: reserveError } = await admin.from('welcome_email_log').insert({
      user_id: userId,
      template: TEMPLATE,
    });
    if (reserveError) return; // já registrado (violação de PK) ou indisponível

    if (!process.env.RESEND_API_KEY?.trim()) {
      await admin.from('welcome_email_log').delete().eq('user_id', userId).eq('template', TEMPLATE);
      console.error('[email/welcome] RESEND_API_KEY não configurada; envio adiado.');
      return;
    }

    // O gancho já tem o e-mail; a consulta é só para quando a função é chamada
    // de outro ponto sem ele em mãos. Lemos a tabela em vez de passar pela API
    // de auth porque aqui só precisamos de um campo.
    const { data } = knownEmail
      ? { data: { email: knownEmail } }
      : await admin.from('user').select('email').eq('id', userId).maybeSingle();
    const email = data?.email;

    if (!email) {
      await admin.from('welcome_email_log').delete().eq('user_id', userId).eq('template', TEMPLATE);
      return;
    }

    const result = await sendWelcomeEmail(email, 'cliente NexOS', 'user', `welcome/${userId}`);
    if (!result.success) {
      // Libera a reserva para permitir nova tentativa.
      await admin.from('welcome_email_log').delete().eq('user_id', userId).eq('template', TEMPLATE);
    }
  } catch (error) {
    console.error('[email/welcome] Falha no envio', { name: error instanceof Error ? error.name : 'UnknownError' });
  }
}
