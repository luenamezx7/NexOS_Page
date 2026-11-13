/** Public OAuth is disabled. Historical account links remain stored for recovery. */
export type SocialProviderId = 'google' | 'github';
export function socialAuthMode(): 'direct' | 'supabase' { return 'direct'; }
export function enabledSocialProviders(): SocialProviderId[] { return []; }
