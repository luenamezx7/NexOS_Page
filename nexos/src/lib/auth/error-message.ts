/**
 * Normalização de erros de autenticação para exibição.
 *
 * Módulo puro, sem dependência de React ou de cliente de auth, para poder ser
 * testado isoladamente (`node:test`) sem carregar o bundle do browser.
 */

/**
 * Códigos que revelariam se uma conta existe.
 *
 * Sem este filtro, o formulário de recuperação de senha ou de login responderia
 * "conta não encontrada" a uns e "link enviado" a outros, permitindo enumerar
 * quais e-mails têm cadastro. Omitimos a distinção: o chamador escreve a
 * mensagem neutra e é ela que vale nos dois casos.
 *
 * Todos em maiúsculas: `readCode` normaliza, então variantes minúsculas aqui
 * seriam entradas mortas.
 */
const ENUMERATION_REVEALING = new Set([
  'USER_NOT_FOUND',
  'USER_ALREADY_EXISTS',
  'USER_ALREADY_HAS_PASSWORD',
  'EMAIL_ALREADY_EXISTS',
  'EMAIL_EXISTS',
  'EMAIL_NOT_VERIFIED',
  'INVALID_EMAIL_OR_PASSWORD',
  'CREDENTIALS_NOT_FOUND',
]);

/** Mensagens de infraestrutura que o usuário pode agir sobre. */
const ACTIONABLE_STATUS: Record<number, string> = {
  429: 'Muitas tentativas. Aguarde um momento e tente de novo.',
  503: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
};
const ACTIONABLE_CODES: Record<string, string> = {
  INVALID_CODE: 'Código inválido ou expirado. Tente novamente.',
  INVALID_BACKUP_CODE: 'Código de recuperação inválido ou já usado.',
  INVALID_TWO_FACTOR_COOKIE: 'O desafio de segurança expirou. Entre novamente.',
  INVALID_TOKEN: 'Este link expirou ou já foi usado. Solicite um novo.',
  INVALID_PASSWORD: 'A senha atual não está correta.',
  WEAK_PASSWORD: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.',
  ERROR_CEREMONY_ABORTED: 'O acesso com a chave foi cancelado. Você pode tentar novamente.',
  PASSKEY_NOT_FOUND: 'Esta chave não está disponível para entrar nesta conta.',
};

function readCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const value = (error as { code?: unknown }).code;
  return typeof value === 'string' ? value.toUpperCase() : '';
}

function readStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const value = (error as { status?: unknown }).status;
  return typeof value === 'number' ? value : null;
}

/**
 * Converte um erro do Better Auth em texto exibível.
 *
 * @param error - Erro devolvido por `authClient`.
 * @param fallback - Texto neutro, usado sempre que a mensagem do servidor puder
 *   vazar informação ou não for confiável.
 */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const code = readCode(error);

  if (code && ENUMERATION_REVEALING.has(code)) return fallback;
  if (ACTIONABLE_CODES[code]) return ACTIONABLE_CODES[code];

  const status = readStatus(error);
  if (status !== null && ACTIONABLE_STATUS[status]) return ACTIONABLE_STATUS[status];

  // CAPTCHA falhando é informação útil e não revela existência de conta.
  if (code === 'CAPTCHA_FAILED') {
    return 'Verificação de segurança falhou. Recarregue a página e tente de novo.';
  }

  const message = String((error as { message?: unknown }).message ?? '').trim();
  // Descarta stack traces e textos longos: a mensagem do servidor pode ser
  //detailada demais para a tela.
  if (message && !code && !message.includes('at ') && message.length < 240 && !/database|postgres|sql|secret|token=|https?:|api.?key|connection|pool/i.test(message)) return message;

  return fallback;
}
