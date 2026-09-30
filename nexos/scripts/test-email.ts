#!/usr/bin/env node
/**
 * Teste rápido de envio de email via Resend.
 *
 * Carrega .env.local automaticamente e envia e-mails de teste para
 * delivered@resend.dev (endereço de simulação do Resend).
 *
 * Uso: npm run test:email
 * Requer: RESEND_API_KEY configurada no .env.local
 *
 * Nota: o SMTP do Supabase é uma configuração separada. Este script cobre
 * apenas o envio direto via SDK do Resend, hoje usado só para boas-vindas.
 * Os e-mails de autenticação (magic link, OTP, confirmação, recuperação)
 * são gerados pelo Supabase Auth e não têm template na aplicação — não há
 * token válido para forjar aqui. Para inspecionar esses templates, use
 * `node --use-system-ca scripts/configure-auth-email.mjs`.
 */

import React from 'react';
import { loadEnvConfig } from '@next/env';
import { getResend } from '../src/lib/emails/resend';
import { WelcomeEmail } from '../src/emails/welcome';

loadEnvConfig(process.cwd());
const TEST_EMAIL = process.env.TEST_EMAIL || 'delivered@resend.dev';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NexOS <noreply@nexoslab.online>';

async function testEmail(name: string, subject: string, react: React.ReactElement) {
  console.log(`\n📧 Testando: ${name}...`);
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [TEST_EMAIL],
      subject,
      react,
    });
    if (error) {
      console.error(`❌ Erro:`, error);
      return false;
    }
    console.log(`✅ Sucesso! ID: ${data?.id}`);
    return true;
  } catch (err) {
    console.error(`❌ Exceção:`, err);
    return false;
  }
}

async function main() {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error('RESEND_API_KEY ausente. Configure em .env.local para testar o envio direto. O SMTP do Supabase é uma configuração separada.');
    process.exitCode = 1;
    return;
  }
  console.log('🚀 Iniciando testes de email NexOS');
  console.log(`📬 Enviando para: ${TEST_EMAIL}`);
  console.log(`📤 De: ${FROM_EMAIL}`);

  const baseUrl = 'https://nexoslab.online';

  const tests: Array<[string, string, React.ReactElement]> = [
    ['WelcomeEmail', 'Bem-vindo ao NexOS! 🚀', WelcomeEmail({ name: 'João', dashboardUrl: `${baseUrl}/conta` })],
  ];

  let passed = 0;
  for (const [name, subject, react] of tests) {
    const ok = await testEmail(name, subject, react);
    if (ok) passed++;
    // Rate limit: 10 req/s, mas vamos dar um respiro
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n📊 Resultado: ${passed}/${tests.length} envios concluíram`);
  if (passed === tests.length) {
    console.log('🎉 Envio direto funcionando!');
  } else {
    console.log('⚠️  Algum envio falhou. Verifique logs acima.');
    process.exit(1);
  }
}

main();
