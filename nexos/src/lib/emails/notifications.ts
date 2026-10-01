import 'server-only';
import { createElement } from 'react';
import { createPool } from '@/lib/auth/db';
import { TransactionalEmail } from '@/emails/transactional';
import { getResend, FROM_EMAIL } from './resend';

export interface NotificationPayload {
  kind: 'welcome' | 'login' | 'security' | 'notice';
  name?: string;
  detail: string;
}
const HEADINGS: Record<NotificationPayload['kind'], string> = {
  welcome: 'Bem-vindo ao NexOS', login: 'Novo acesso à sua conta NexOS',
  security: 'Alerta de segurança do NexOS', notice: 'Notificação do NexOS',
};

export async function enqueueNotification(userId: string, eventKey: string, payload: NotificationPayload): Promise<void> {
  try {
    await createPool().query(
      'insert into public.auth_email_outbox (event_key, user_id, payload) values ($1, $2, $3) on conflict do nothing',
      [eventKey, userId, JSON.stringify(payload)],
    );
    await deliverNotification(eventKey);
  } catch {
    // Notificações não devem impedir uma sessão ou uma mudança já confirmada.
    console.error('[email/outbox] notificação pendente');
  }
}

async function deliverNotification(key: string): Promise<void> {
  const pool = createPool();
  const { rows } = await pool.query<{ event_key: string; payload: NotificationPayload; email: string }>(`
    update public.auth_email_outbox o
    set status = 'sending', lease_until = now() + interval '2 minutes', attempts = attempts + 1
    from public."user" u
    where o.event_key = $1 and u.id = o.user_id and u."emailVerified" = true
      and o.status <> 'sent' and o.next_attempt_at <= now()
      and (o.lease_until is null or o.lease_until < now())
    returning o.event_key, o.payload, u.email`, [key]);
  const row = rows[0];
  if (!row) return;
  try {
    const heading = HEADINGS[row.payload.kind];
    if (!heading) throw new Error('INVALID_TEMPLATE');
    const url = `${new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin}/portal/seguranca`;
    const message = `${row.payload.name ? `Olá, ${row.payload.name.slice(0, 120)}!\n\n` : ''}${row.payload.detail.slice(0, 2000)}`;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL, to: [row.email], subject: heading,
      text: `${heading}\n\n${message}\n\nSegurança da conta: ${url}`,
      react: createElement(TransactionalEmail, { heading, message, actionLabel: 'Segurança da conta', url }),
    }, { idempotencyKey: key });
    if (error || !data?.id) throw new Error('EMAIL_DELIVERY_FAILED');
    await pool.query("update public.auth_email_outbox set status = 'sent', sent_at = now(), lease_until = null where event_key = $1", [key]);
  } catch {
    await pool.query(`update public.auth_email_outbox set status = 'pending', lease_until = null,
      next_attempt_at = now() + interval '5 minutes' where event_key = $1`, [key]);
    console.error('[email/outbox] envio adiado');
  }
}

/** Retenta no próximo login, ou no job autenticado; batches limitados. */
export async function retryNotifications(userId?: string): Promise<void> {
  try {
    const { rows } = await createPool().query<{ event_key: string }>(`select event_key from public.auth_email_outbox
      where status <> 'sent' and next_attempt_at <= now()
      and (lease_until is null or lease_until < now()) and ($1::uuid is null or user_id = $1)
      order by next_attempt_at limit 10`, [userId ?? null]);
    for (const row of rows) await deliverNotification(row.event_key);
  } catch { console.error('[email/outbox] retentativa indisponível'); }
}
