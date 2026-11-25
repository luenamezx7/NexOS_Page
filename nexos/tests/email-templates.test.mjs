import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { render } from '@react-email/render';
import { EmailLayout } from '../src/emails/layout.tsx';
import { LoginCodeEmail } from '../src/emails/login-code.tsx';
import { TransactionalEmail } from '../src/emails/transactional.tsx';
import { WelcomeEmail } from '../src/emails/welcome.tsx';

const output = '/tmp/nexos-email-previews';
const fixtures = [
  ['login-code', createElement(LoginCodeEmail, { code: '204815' })],
  ['confirmation', createElement(TransactionalEmail, { heading: 'Confirme seu e-mail na ezway', message: 'Confirme seu endereço para ativar a conta.', actionLabel: 'Confirmar e-mail', url: 'https://nexoslab.online/api/auth/verify-email?token=fixture-only' })],
  ['password-reset', createElement(TransactionalEmail, { heading: 'Redefina sua senha na ezway', message: 'Este link é de uso único e expira em 1 hora.', actionLabel: 'Criar nova senha', url: 'https://nexoslab.online/portal/redefinir?token=fixture-only' })],
  ['security', createElement(TransactionalEmail, { heading: 'Alerta de segurança da ezway', message: 'Uma alteração foi realizada na sua conta.', actionLabel: 'Segurança da conta', url: 'https://nexoslab.online/portal/seguranca' })],
  ['welcome', createElement(WelcomeEmail, { name: 'Cliente de exemplo', dashboardUrl: 'https://nexoslab.online/conta' })],
];
for (const [name, component] of fixtures) {
  test(`${name} uses the shared green email design without an empty banner`, async () => {
    const html = await render(component);
    assert.match(html, /#eef0e9/);
    assert.match(html, /#f4faec/);
    assert.match(html, /#14200e/);
    assert.equal((html.match(/data-email-layout="ezway-code"/g) || []).length, 1);
    assert.doesNotMatch(html, /<img|#0a0a0a|#111111|linear-gradient|fonts.googleapis/);
    assert.match(html, /Privacidade/);
    assert.match(html, /Termos/);
    if (name === 'login-code') {
      assert.match(html, /204815/);
      assert.doesNotMatch(html, /href="[^\"]*(?:sign-in|verify|magic)/);
    }
    mkdirSync(output, { recursive: true });
    writeFileSync(`${output}/${name}.html`, html);
  });
}
test('one optional banner slot works for all emails without changing the body', async () => {
  const html = await render(createElement(EmailLayout, { banner: { src: 'https://example.test/approved-brand-banner.png', width: 960, height: 240, alt: 'Banner da marca ezway' } }, createElement('p', null, 'Mensagem preservada')));
  assert.equal((html.match(/<img/g) || []).length, 1);
  assert.match(html, /alt="Banner da marca ezway"/);
  assert.match(html, /height:auto/);
  assert.match(html, /Mensagem preservada/);
});
