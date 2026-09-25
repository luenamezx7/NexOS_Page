'use client';

import { useEffect, useRef, useState } from 'react';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let loader: Promise<void> | undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!loader) loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => { clearTimeout(timeout); script.remove(); loader = undefined; reject(new Error('Turnstile indisponível')); };
    const timeout = window.setTimeout(fail, 12000);
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => { clearTimeout(timeout); if (window.turnstile) resolve(); else fail(); };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loader;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export function Turnstile({ onVerify, onExpire, onError, theme = 'auto', size = 'normal' }: TurnstileProps) {
  const { siteKey, required, loading, configured, error } = useTurnstileConfig();
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const callbacks = useRef({ onVerify, onExpire, onError });
  useEffect(() => { callbacks.current = { onVerify, onExpire, onError }; }, [onVerify, onExpire, onError]);
  useEffect(() => {
    if (loading || !siteKey || !required || !configured) return;
    let cancelled = false;
    let widget: string | undefined;
    void loadTurnstile().then(() => {
      if (cancelled || !container.current || !window.turnstile) return;
      widget = window.turnstile.render(container.current, {
        sitekey: siteKey, theme, size,
        callback: (token: string) => { if (!cancelled) { setFailed(false); callbacks.current.onVerify(token); } },
        'expired-callback': () => { if (!cancelled) callbacks.current.onExpire?.(); },
        'error-callback': () => { if (!cancelled) { setFailed(true); callbacks.current.onError?.(); } },
      });
    }).catch(() => { if (!cancelled) { setFailed(true); callbacks.current.onError?.(); } });
    return () => { cancelled = true; if (widget !== undefined) window.turnstile?.remove(widget); };
  }, [siteKey, required, configured, loading, theme, size, attempt]);
  if (loading) return <p role="status" className="text-sm">Preparando verificação de segurança…</p>;
  if (error || (required && !configured)) return <p role="alert" className="text-sm">{error || 'Verificação de segurança temporariamente indisponível. Tente novamente mais tarde.'}</p>;
  return required && siteKey ? <div>
    <div ref={container} className="min-h-[65px]" aria-label="Verificação de segurança" />
    {failed && <button type="button" className="text-sm underline underline-offset-4" onClick={() => { setFailed(false); callbacks.current.onExpire?.(); setAttempt(v => v + 1); }}>Tentar verificação novamente</button>}
  </div> : null;
}
