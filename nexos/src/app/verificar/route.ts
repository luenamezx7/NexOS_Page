import { NextRequest, NextResponse } from 'next/server';
import { getTurnstileSiteKey, isTurnstileConfigured } from '@/lib/turnstile';
import { CHALLENGE_TTL, createEntryToken, ENTRY_ACTION, entryCookies, entryReturnPath, readEntryToken, siteEntryEnforced } from '@/lib/site-entry';

export const dynamic = 'force-dynamic';
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const scriptValue = (value: string) => JSON.stringify(value).replaceAll('<', '\\u003c');

/** Standalone document: no application layout, hydration, home content or media. */
export function GET(req: NextRequest) {
  const next = entryReturnPath(req.nextUrl.searchParams.get('next'));
  const names = entryCookies(req.url);
  const userAgent = req.headers.get('user-agent') || '';
  if (!siteEntryEnforced() || readEntryToken(req.cookies.get(names.clearance)?.value, 'clearance', userAgent)) {
    const response = NextResponse.redirect(new URL(next, req.url), 303);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  const nonce = req.headers.get('x-nonce') || '';
  let challenge: ReturnType<typeof createEntryToken> | undefined;
  if (isTurnstileConfigured()) {
    try { challenge = createEntryToken('challenge', userAgent); } catch { /* Fail closed. */ }
  }
  const available = Boolean(challenge);
  const script = challenge ? `<script nonce="${escape(nonce)}">
    const status = document.getElementById('status');
    const retry = document.getElementById('retry');
    let submitting = false;
    function failure(message) { submitting = false; status.textContent = message; retry.hidden = false; }
    retry.addEventListener('click', () => location.reload());
    window.ezwayEntryReady = function () {
      window.turnstile.render('#challenge', {
        sitekey: ${scriptValue(getTurnstileSiteKey())}, theme: 'dark', size: 'flexible', language: 'pt-br',
        appearance: 'always', action: ${scriptValue(ENTRY_ACTION)}, cData: ${scriptValue(challenge.claims.nonce)},
        callback: async function (token) {
          if (submitting) return;
          submitting = true; retry.hidden = true; status.textContent = 'Confirmando a verificação…';
          try {
            const response = await fetch('/api/security/entry', { method: 'POST', credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, next: ${scriptValue(next)} }) });
            const result = await response.json();
            if (!response.ok) { failure(result.error || 'Tente verificar novamente.'); return; }
            status.textContent = 'Verificação concluída. Abrindo o site…';
            location.replace(result.redirectTo + (result.redirectTo.includes('#') ? '' : location.hash));
          } catch { failure('Não foi possível conectar. Tente novamente.'); }
        },
        'error-callback': function () { failure('A verificação não carregou. Confira sua conexão e tente novamente.'); },
        'expired-callback': function () { failure('A verificação expirou. Tente novamente.'); },
        'timeout-callback': function () { failure('A verificação expirou. Tente novamente.'); }
      });
    };
    const timeout = setTimeout(() => { if (!window.turnstile) failure('A verificação não carregou. Confira sua conexão e tente novamente.'); }, 15000);
    </script><script nonce="${escape(nonce)}" src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=ezwayEntryReady&amp;render=explicit" async defer></script>` : '';
  const response = new NextResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="dark"><title>Verificação de segurança | ezway</title><link rel="icon" href="/favicon.png"><style>
    *{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;background:#09090b;color:#f8f8fa;font-family:Arial,Helvetica,sans-serif;padding:24px 10px}main{width:min(100%,420px)}.brand{font-size:30px;font-weight:700;letter-spacing:-1.2px;margin:0 0 56px}.brand span{color:#ff3f9f}h1{font-size:30px;letter-spacing:-1px;line-height:1.15;margin:0 0 16px}p{font-size:15px;line-height:1.6;color:#babac2}#challenge{min-height:70px;margin:28px 0}#status{min-height:48px;font-size:14px}button{min-height:44px;padding:10px 20px;border:1px solid #ff3f9f;border-radius:8px;background:#ff3f9f;color:#09090b;font:700 14px Arial;cursor:pointer}button:hover{background:#ff67b4}button:focus-visible{outline:2px solid white;outline-offset:4px}[hidden]{display:none}small{display:block;margin-top:40px;color:#878792;font-size:12px;line-height:1.6}
    </style></head><body><main><p class="brand" translate="no">ez<span>way</span></p><h1>Verificação de segurança</h1><p>Confirme que você é uma pessoa para acessar o site.</p><div id="challenge" aria-label="Verificação Cloudflare Turnstile"></div><p id="status" role="status" aria-live="polite">${available ? 'Conclua a verificação abaixo para continuar.' : 'A verificação está temporariamente indisponível. Tente novamente em instantes.'}</p><button id="retry" type="button" hidden>Tentar novamente</button><noscript><p>Ative o JavaScript para concluir a verificação de segurança.</p></noscript><small>O site será carregado após a confirmação da Cloudflare.</small></main>${script}</body></html>`, {
    status: available ? 200 : 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
  if (challenge) response.cookies.set(names.challenge, challenge.token, { httpOnly: true, secure: names.secure, sameSite: 'lax', path: '/', maxAge: CHALLENGE_TTL });
  return response;
}
