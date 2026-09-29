'use client';

/**
 * Hook to fetch Turnstile configuration from /api/security/config.
 * Caches the result for 60 seconds to avoid repeated requests.
 *
 * @returns `{ required, configured, siteKey, loading, error }`
 * - `required` — whether CAPTCHA is enforced
 * - `configured` — whether both site key and secret are set
 * - `siteKey` — public Turnstile site key (empty string if not configured)
 */

import { useEffect, useState } from 'react';

type Config = { required: boolean; configured: boolean; siteKey: string };
let pending: Promise<Config> | undefined;
let cached: { value: Config; expires: number } | undefined;

function load(): Promise<Config> {
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
  pending ??= fetch('/api/security/config', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    .then(async response => {
      if (!response.ok) throw new Error('Verificação indisponível. Atualize a página.');
      const value = await response.json();
      if (typeof value.required !== 'boolean' || typeof value.configured !== 'boolean' || typeof value.siteKey !== 'string') {
        throw new Error('Configuração de segurança indisponível.');
      }
      cached = { value, expires: Date.now() + 60000 };
      return value as Config;
    }).finally(() => { pending = undefined; });
  return pending;
}

export function useTurnstileConfig() {
  const [config, setConfig] = useState<Config>({ required: true, configured: false, siteKey: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void load().then(value => { if (active) setConfig(value); })
      .catch(() => { if (active) setError('Verificação indisponível. Atualize a página e tente novamente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { ...config, loading, error };
}
