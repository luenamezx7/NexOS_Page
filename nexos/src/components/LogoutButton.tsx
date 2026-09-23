'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  return <div className="flex flex-col gap-2">
    <button className="btn-secondary-nex" disabled={busy} onClick={async () => {
      setBusy(true); setError(false);
      try {
        const result = await fetch('/api/auth/user-logout', { method: 'POST', signal: AbortSignal.timeout(15000) });
        if (!result.ok) throw new Error();
        router.replace('/portal/acesso'); router.refresh();
      } catch { setError(true); }
      finally { setBusy(false); }
    }}>{busy ? 'Saindo…' : 'Sair da conta'}</button>
    {error && <p role="alert">Não foi possível sair. Tente novamente.</p>}
  </div>;
}
