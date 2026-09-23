'use client';

import { useEffect, useRef } from 'react';

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
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); loader = undefined; reject(new Error('Turnstile indisponível')); };
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
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onVerify, onExpire, onError });
  useEffect(() => { callbacks.current = { onVerify, onExpire, onError }; }, [onVerify, onExpire, onError]);
  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    let widget: string | undefined;
    void loadTurnstile().then(() => {
      if (cancelled || !container.current || !window.turnstile) return;
      widget = window.turnstile.render(container.current, {
        sitekey: siteKey, theme, size,
        callback: (token: string) => callbacks.current.onVerify(token),
        'expired-callback': () => callbacks.current.onExpire?.(),
        'error-callback': () => callbacks.current.onError?.(),
      });
    }).catch(() => { if (!cancelled) callbacks.current.onError?.(); });
    return () => { cancelled = true; if (widget !== undefined) window.turnstile?.remove(widget); };
  }, [siteKey, theme, size]);
  return siteKey ? <div ref={container} className="min-h-[65px]" aria-label="Verificação de segurança" /> : null;
}
