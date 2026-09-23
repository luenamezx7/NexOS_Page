import 'server-only';
// ============================================================
// NexOS — Cloudflare Turnstile (proteção anti-bot)
// Docs: https://developers.cloudflare.com/turnstile/
// Site Key: NEXT_PUBLIC_TURNSTILE_SITE_KEY (exposto no client)
// Secret: TURNSTILE_SECRET_KEY (server-only)
// ============================================================

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  return !!(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export function isTurnstileEnforced(): boolean {
   // Produção exige anti-bot por padrão; falha fechada sem configuração.
  if (process.env.TURNSTILE_ENFORCED === "true") return true;
  if (process.env.TURNSTILE_ENFORCED === "false") return false;
   // Em desenvolvimento, exige quando há secret configurado.
  return process.env.NODE_ENV === 'production' || !!process.env.TURNSTILE_SECRET_KEY;
}

export interface TurnstileVerifyResult {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) throw new Error("TURNSTILE_SECRET_KEY não configurado");

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) form.append("remoteip", remoteIp);

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return { success: false };
  const data = (await res.json()) as TurnstileVerifyResult;
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (data.success && site && data.hostname !== new URL(site).hostname) return { success: false };
  return data;
}
