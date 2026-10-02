/**
 * Providers sociais com credenciais configuradas.
 *
 * Lido no servidor e devolvido apenas como lista de nomes: o browser recebe
 * "existe Google" e nada mais. Nenhum segredo sai daqui.
 *
 * Usado para decidir quais botões renderizar. Um botão de provider sem
 * credencial configurada falharia silenciosamente no clique, então a lista
 * precisa refletir a configuração real — não um array fixo no componente.
 */
export type SocialProviderId = 'google' | 'github';

export function socialAuthMode(): 'direct' | 'supabase' {
  return process.env.SOCIAL_AUTH_USE_SUPABASE === 'true' ? 'supabase' : 'direct';
}

export function enabledSocialProviders(): SocialProviderId[] {
  if (socialAuthMode() === 'supabase') {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url?.trim() && key?.trim() ? ['google', 'github'] : [];
  }
  const providers: SocialProviderId[] = [];
  if (process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()) providers.push('google');
  if (process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim()) providers.push('github');
  return providers;
}
