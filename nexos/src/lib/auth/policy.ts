/** Política compartilhada entre RSC, Proxy e testes; sem dependência de Next. */
export function isMfaSignIn(path: string): boolean {
  return path.startsWith('/callback/') || path === '/callback/:id' ||
    path === '/magic-link/verify' || path === '/passkey/verify-authentication';
}

export function loginPathFor(path: string): string {
  return path === '/dashboard' || path.startsWith('/dashboard/')
    ? '/admin-dashboard-su/secure-entry' : '/portal/acesso';
}

export function isPrivatePage(path: string): boolean {
  return ['/conta', '/dashboard', '/portal/seguranca'].some(p => path === p || path.startsWith(`${p}/`));
}

export function mfaDestination(location: string | null, origin: string): string {
  const fallback = '/conta';
  if (!location) return fallback;
  try {
    const url = new URL(location, origin);
    if (url.origin !== new URL(origin).origin || url.pathname.startsWith('/api/') || url.pathname === '/portal/acesso') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}
