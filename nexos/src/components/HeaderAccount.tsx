'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IdCard, LogOut, ShieldCheck } from 'lucide-react';
import { authClient, signOutAccount } from '@/lib/auth/client';
import { ProfileOrb } from './ProfileOrb';
import { Skeleton } from './ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import styles from './Header.module.css';
import { useLocale } from '@/lib/locale';

/** Session state comes exclusively from the existing Better Auth client. */
export function HeaderAccount({ expanded = false, onNavigate }: { expanded?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const { t } = useLocale();
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const user = session?.user;
  const state = isPending ? 'loading' : error ? 'error' : user ? 'authenticated' : 'guest';
  const logout = async () => {
    setBusy(true); setLogoutError(false);
    try { await signOutAccount(); router.push('/portal/acesso'); router.refresh(); }
    catch { setLogoutError(true); }
    finally { setBusy(false); }
  };
  const avatar = <ProfileOrb className={styles.avatar} />;

  return <div className={expanded ? styles.expandedAccount : styles.accountSlot} data-account-state={state}>
    {isPending ? <span role="status" aria-label={t('Verificando sua sessão')}><Skeleton className={styles.accountSkeleton} /></span> : error ? <button type="button" className={styles.accountLink} onClick={() => void refetch()} title="Não foi possível verificar a sessão. Tentar novamente.">{avatar}<span className={styles.accountLabel}>{t('Verificar conta')}</span></button> : !user ? <Link href="/portal/acesso" prefetch={false} className={styles.accountLink} onClick={onNavigate}>{avatar}<span className={styles.accountLabel}>{t('Minha conta')}</span></Link> : expanded ? <>
      <div className={styles.userRow}>{avatar}<span>{user.name || 'Sua conta'}</span></div>
      <Link href="/conta" onClick={onNavigate}>{t('Minha conta')}</Link>
      <Link href="/portal/seguranca" onClick={onNavigate}>{t('Segurança da conta')}</Link>
      <button type="button" onClick={() => void logout()} disabled={busy}>{t(busy ? 'Saindo…' : 'Sair da conta')}</button>
    </> : <DropdownMenu>
      <DropdownMenuTrigger className={styles.avatarButton} aria-label={t('Abrir opções da conta')}>{avatar}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={14} className={styles.popup}>
        <DropdownMenuGroup>
          <p className={styles.userName}>{user.name || t('Sua conta')}</p>
          <DropdownMenuItem render={<Link href="/conta" />} className={styles.menuItem}><IdCard /> {t('Minha conta')}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/portal/seguranca" />} className={styles.menuItem}><ShieldCheck /> {t('Segurança da conta')}</DropdownMenuItem>
          <DropdownMenuItem className={styles.menuItem} disabled={busy} closeOnClick={false} onClick={() => void logout()}><LogOut /> {t(busy ? 'Saindo…' : 'Sair da conta')}</DropdownMenuItem>
        </DropdownMenuGroup>
        {logoutError && <p role="alert" className={styles.accountError}>Não foi possível sair. Tente novamente.</p>}
      </DropdownMenuContent>
    </DropdownMenu>}
    {expanded && logoutError && <p role="alert" className={styles.accountError}>Não foi possível sair. Tente novamente.</p>}
  </div>;
}
