import { createElement } from 'react';
import { loadEnvConfig } from '@next/env';
import { Resend } from 'resend';
import { TransactionalEmail } from '../src/emails/transactional';

async function main() {
  loadEnvConfig(process.cwd());
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error('RESEND_API_KEY ausente.');
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM_EMAIL || 'NexOS <noreply@nexoslab.online>';
  const templates = ['Boas-vindas', 'Confirmação de e-mail', 'Novo login', 'Magic Link', 'Redefinição de senha', 'Alerta 2FA', 'Notificação geral'];
  let passed = 0;
  for (const heading of templates) {
    try {
      const { data, error } = await resend.emails.send({ from, to: ['delivered@resend.dev'], subject: `[Teste NexOS] ${heading}`,
        react: createElement(TransactionalEmail, { heading, message: 'Teste de template e transporte. Este e-mail não contém um token de autenticação válido.', actionLabel: 'Abrir NexOS', url: 'https://nexoslab.online' }),
        text: `${heading}\n\nTeste de template e transporte, sem token válido.`,
      });
      console.log(`${heading}: ${!error && data?.id ? 'aceito pelo Resend' : 'falha de envio'}`);
      if (!error && data?.id) passed++;
    } catch { console.log(`${heading}: falha de transporte`); }
    await new Promise(resolve => setTimeout(resolve, 650));
  }
  console.log(`${passed}/${templates.length} templates aceitos. Isso valida o transporte, não a entrega na caixa de entrada de um usuário.`);
  if (passed !== templates.length) process.exitCode = 1;
}

void main().catch(() => {
  console.error('Teste de e-mail indisponível. Confira a configuração e a conexão com o Resend.');
  process.exitCode = 1;
});
