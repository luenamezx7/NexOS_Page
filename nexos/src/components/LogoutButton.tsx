'use client';

/**
 * Logout button — encerra a sessão Better Auth e abre a página de acesso.
 * Shows error state on failure.
 */
import { useState } from 'react';
import { signOutAccount } from '@/lib/auth/client';

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return <div className="flex flex-col gap-2">
    <button className="btn-secondary-nex" disabled={busy} onClick={async () => {
      setBusy(true); setError(false);
      try {
        await signOutAccount();
        window.location.replace('/portal/acesso');
      } catch { setError(true); }
      finally { setBusy(false); }
    }}>{busy ? 'Saindo…' : 'Sair da conta'}</button>
    {error && <p role="alert">Não foi possível sair. Tente novamente.</p>}
  </div>;
}
