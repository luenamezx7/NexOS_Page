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
  // Se não configurado, não bloqueia (modo permissivo para dev)
  // Defina TURNSTILE_ENFORCED=true para exigir em produção
  if (process.env.TURNSTILE_ENFORCED === "true") return true;
  if (process.env.TURNSTILE_ENFORCED === "false") return false;
  // Auto: exige apenas se secret estiver configurado
  return !!process.env.TURNSTILE_SECRET_KEY;
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

  const data = (await res.json()) as TurnstileVerifyResult;
  return data;
}
