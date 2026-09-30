/** Supabase TokenHash, not a numeric email OTP or a PKCE authorization code. */
export function isRecoveryTokenHash(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{40,128}$/i.test(value);
}
