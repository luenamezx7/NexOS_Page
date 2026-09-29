type ProviderError = { code?: string; status?: number };

// Keep account existence private, but never disguise infrastructure failures as success.
export function authEmailFailure(error: ProviderError | null) {
  if (!error) return null;
  if (['user_not_found', 'user_already_exists', 'email_exists', 'signup_disabled', 'otp_disabled'].includes(error.code ?? '')) return null;
  if (error.code === 'captcha_failed') {
    return { status: 400, error: 'A verificação de segurança expirou ou foi recusada. Complete o CAPTCHA novamente.' };
  }
  if (error.status === 429 || ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(error.code ?? '')) {
    return { status: 429, error: 'Limite de solicitações atingido. Aguarde alguns minutos antes de pedir outro e-mail.' };
  }
  return { status: 503, error: 'Não foi possível solicitar o e-mail agora. Tente novamente em instantes.' };
}
