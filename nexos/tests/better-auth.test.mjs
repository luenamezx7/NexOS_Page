import test, { after } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Testes de integração do Better Auth contra um Postgres real.
 *
 * São pulados (não reprovados) sem `DATABASE_URL` + `BETTER_AUTH_SECRET`, porque
 * exigem um banco de verdade — um stub não provaria nada sobre hash de senha,
 * persistência de sessão ou revogação, que é justamente o que mudou.
 *
 * Para rodar: aponte DATABASE_URL para um Postgres vazio e aplique
 * supabase/migrations/20260930120000_better_auth.sql antes.
 *
 *   DATABASE_URL=postgres://... BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
 *     node --conditions=react-server --test tests/better-auth.test.mjs
 */

const CONFIGURED = !!(process.env.DATABASE_URL?.trim() && process.env.BETTER_AUTH_SECRET?.trim());
const SKIP = CONFIGURED ? false : 'DATABASE_URL/BETTER_AUTH_SECRET ausentes — integração exige Postgres real';

const baseURL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

let auth = null;
const createdUsers = [];

/** Confirma o e-mail direto no banco, para pular o passo de verificação. */
async function confirmEmail(id) {
  await auth.$context.adapter.update({
    model: 'user',
    where: [{ id }],
    update: { emailVerified: true },
  });
}

async function removeUser(id) {
  await auth.$context.adapter.delete({ model: 'user', where: [{ id }] });
}

test('fluxo completo de autenticação', { skip: SKIP }, async (t) => {
  const { getAuth } = await import('../src/lib/auth/instance.ts');
  auth = getAuth();

  const suffix = Date.now().toString(36);
  const email = `ba-${suffix}@example.test`;
  const password = 'Senha-Forte-1234!';

  await t.test('cadastra a conta', async () => {
    const res = await auth.api.signUpEmail({ body: { email, password, name: 'Teste' } });
    assert.equal(res.user?.email, email);
    createdUsers.push(res.user.id);
    await confirmEmail(res.user.id);
  });

  await t.test('recusa senha fraca e e-mail duplicado', async () => {
    await assert.rejects(
      auth.api.signUpEmail({ body: { email: `outro-${suffix}@example.test`, password: 'fraca', name: 'X' } }),
      'senha abaixo do mínimo deve ser rejeitada',
    );
    await assert.rejects(
      auth.api.signUpEmail({ body: { email, password, name: 'Dup' } }),
      'e-mail já cadastrado deve ser rejeitado',
    );
  });

  await t.test('senha errada falha e senha certa autentica', async () => {
    await assert.rejects(auth.api.signInEmail({ body: { email, password: 'Errada-1234!' } }));
    const res = await auth.api.signInEmail({ body: { email, password } });
    assert.equal(res.user.email, email);
    assert.ok(res.token, 'login deve emitir token de sessão');
  });

  await t.test('a sessão é lida do banco, não do cookie', async () => {
    const login = await auth.api.signInEmail({ body: { email, password } });
    const cookie = login.headers.get('set-cookie') ?? '';
    assert.ok(cookie.includes('nexos'), 'o cookie de sessão deve usar o prefixo configurado');

    const session = await auth.api.getSession({
      headers: new Headers({ cookie }),
      query: { disableCookieCache: true },
    });
    assert.equal(session?.user?.email, email);
  });

  await t.test('logout invalida a sessão no servidor', async () => {
    const login = await auth.api.signInEmail({ body: { email, password } });
    const cookie = login.headers.get('set-cookie') ?? '';
    const headers = new Headers({ cookie });

    assert.ok((await auth.api.getSession({ headers }))?.session, 'sessão deve existir antes do logout');

    await auth.api.signOut({ headers });

    const after = await auth.api.getSession({ headers }).catch(() => null);
    assert.equal(after, null, 'sessão removida do banco não pode continuar válida');
  });

  await t.test('recuperação de senha não revela se o e-mail existe', async () => {
    const existente = await auth.api
      .requestPasswordReset({ body: { email, redirectTo: `${baseURL}/portal/redefinir` } })
      .then(() => 'ok', (e) => e?.code ?? 'erro');
    const inexistente = await auth.api
      .requestPasswordReset({ body: { email: `fantasma-${suffix}@example.test`, redirectTo: `${baseURL}/portal/redefinir` } })
      .then(() => 'ok', (e) => e?.code ?? 'erro');

    assert.equal(
      existente,
      inexistente,
      'a resposta deve ser idêntica para e-mail existente e inexistente, ou a resposta vira enumerador de contas',
    );
  });

  await t.test('limpa os usuários criados', async () => {
    for (const id of createdUsers) await removeUser(id);
    createdUsers.length = 0;
  });
});

after(async () => {
  // Rede de segurança caso um teste falhe antes da limpeza.
  if (!auth) return;
  for (const id of createdUsers) {
    await removeUser(id).catch(() => {});
  }
});
