import 'server-only';
import bcrypt from 'bcryptjs';
import { verifyPassword } from 'better-auth/crypto';

/**
 * Verificação de senha que aceita os dois formatos coexistentes.
 *
 * ── Por que dois formatos ──
 * O GoTrue (Supabase Auth) guardava a senha como bcrypt (`$2a$10$…`). O Better
 * Auth usa scrypt (`salt:key` em hex, sem prefixo). As migrações copiam os
 * hashes existentes para `public.account`, então no primeiro login a aplicação
 * encontra bcrypt; toda senha nova passa a ser scrypt.
 *
 * Sem este verificador customizado, todo usuário migrado receberia "senha
 * incorreta" — a conta existiria, mas ninguém conseguiria entrar.
 *
 * ── Por que não regravamos em scrypt no login ──
 * `password.verify` recebe apenas `{ hash, password }`, sem o usuário a que a
 * linha pertence. Regravar exigiria adivinhar a linha, e um palpite errado
 * sobrescreveria a credencial de outra conta. bcrypt com custo 10 continua sendo
 * um algoritmo seguro e stronghold; a troca pode ser feita depois, por um
 * endpoint dedicado, com o `userId` em mãos.
 */

/** bcrypt: `$2a$`, `$2b$` ou `$2y$`. */
function isBcrypt(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
}

/**
 * scrypt do Better Auth: dois blocos hexadecimais separados por `:`.
 * Usado só para rejeitar lixo antes de mandar para o verificador padrão.
 */
function looksLikeScrypt(hash: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(hash);
}

/**
 * Compara a senha contra um hash de qualquer um dos formatos suportados.
 * Lança apenas para formatos irreconhecíveis — falha fechada, nunca aberta.
 */
export async function verifyMigratedPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (typeof hash !== 'string' || !hash) return false;

  if (isBcrypt(hash)) return bcrypt.compare(password, hash);

  // Confia no verificador do Better Auth para o formato que ele mesmo produz.
  if (looksLikeScrypt(hash)) return verifyPassword({ hash, password });

  throw new Error('Formato de hash de senha desconhecido: recusando verificar.');
}

/**
 * Utilitário de inspeção para a migração: classifica um hash sem tentar adivinhá-lo.
 * Usado pelo script de migração para relatar o que existe no banco antes de
 * aplicar qualquer alteração.
 */
export function classifyHash(hash: string | null | undefined): 'bcrypt' | 'scrypt' | 'vazio' | 'desconhecido' {
  if (typeof hash !== 'string' || !hash.trim()) return 'vazio';
  if (isBcrypt(hash)) return 'bcrypt';
  if (looksLikeScrypt(hash)) return 'scrypt';
  return 'desconhecido';
}