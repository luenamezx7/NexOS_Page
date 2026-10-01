import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { hashPassword } from 'better-auth/crypto';
import { verifyMigratedPassword, classifyHash } from '../src/lib/auth/password.ts';

/**
 * Verificador de senha em formato duplo (bcrypt legado + scrypt novo).
 *
 * Testável sem banco, e é justamente o ponto: a migração de senhas só é
 * confiável se este verificador aceitar o hash que veio do GoTrue e recusar o que
 * não reconhece.
 */

const SENHA = 'Senha-Forte-1234!';

test('o verificador aceita bcrypt, o formato que o GoTrue gravava', async () => {
  // bcrypt com custo baixo: o algoritmo é o mesmo, só o custo muda.
  const hash = await bcrypt.hash(SENHA, 10);

  assert.equal(classifyHash(hash), 'bcrypt');
  assert.equal(await verifyMigratedPassword({ hash, password: SENHA }), true);
  assert.equal(await verifyMigratedPassword({ hash, password: 'Senha-Forte-1234?' }), false);
  assert.equal(await verifyMigratedPassword({ hash, password: '' }), false);
});

test('o verificador aceita scrypt, o formato que o Better Auth produz', async () => {
  const hash = await hashPassword(SENHA);

  assert.equal(classifyHash(hash), 'scrypt');
  assert.equal(await verifyMigratedPassword({ hash, password: SENHA }), true);
  assert.equal(await verifyMigratedPassword({ hash, password: 'outra-senha-qualquer' }), false);
});

test('os três prefixos de bcrypt do GoTrue são reconhecidos', async () => {
  // GoTrue pode gravar $2a$ (PGCrypto) ou $2b$ (bcryptjs/GoTrue recente).
  for (const prefix of ['$2a$', '$2b$', '$2y$']) {
    const original = await bcrypt.hash(SENHA, 10);
    const swapped = original.replace(/^\$2[aby]\$/, prefix);
    assert.equal(classifyHash(swapped), 'bcrypt', `prefixo ${prefix} deveria ser reconhecido`);
    assert.equal(await verifyMigratedPassword({ hash: swapped, password: SENHA }), true);
  }
});

test('formatos desconhecidos falham fechados, nunca abertos', async () => {
  // Um hash ilegível precisa recusar o login, não aceitá-lo.
  for (const hash of ['$argon2id$v=19$m=1,t=3,p=4$abc$def', 'plaine', '123456', 'a:b', '$2z$10$x']) {
    assert.equal(classifyHash(hash), 'desconhecido', `deveria classificar "${hash}" como desconhecido`);
    await assert.rejects(
      verifyMigratedPassword({ hash, password: SENHA }),
      /desconhecido/,
      `deveria recusar "${hash}" em vez de tentar adivinhar`,
    );
  }
});

test('hash vazio ou ausente nunca autentica', async () => {
  for (const hash of ['', null, undefined]) {
    assert.equal(classifyHash(hash), 'vazio');
    assert.equal(await verifyMigratedPassword({ hash, password: SENHA }), false);
  }
});

test('senhas com normalização unicode são comparadas como o GoTrue comparava', async () => {
  // O scrypt do Better Auth normaliza em NFKC; o bcrypt não. Uma senha com
  // acento precisa continuar entrando depois da migração, sob qualquer hash.
  const senhaComAcento = 'Sênha-Forte-1234!';

  const scryptHash = await hashPassword(senhaComAcento);
  assert.equal(await verifyMigratedPassword({ hash: scryptHash, password: senhaComAcento }), true);

  // bcrypt armazena bytes; o mesmo texto precisa verificar.
  const bcryptHash = await bcrypt.hash(senhaComAcento, 10);
  assert.equal(await verifyMigratedPassword({ hash: bcryptHash, password: senhaComAcento }), true);
});