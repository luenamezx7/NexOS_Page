'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserRound, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { authClient, signOutAccount } from '@/lib/auth/client';
import { ProfileOrb } from './ProfileOrb';
import { NavigationGlass } from './NavigationGlass';
import { Skeleton } from './ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import styles from './Header.module.css';
import { useLocale } from '@/lib/locale';

/** Session state comes exclusively from the existing Better Auth client. */
export function HeaderAccount({ expanded = false, onNavigate, open, onOpenChange }: { expanded?: boolean; onNavigate?: () => void; open?: boolean; onOpenChange?: (open: boolean) => void }) {
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
  const loginLink = <Link href="/portal/acesso" prefetch={false} className={styles.accountLink} data-navigation-glass="control" onClick={onNavigate}><NavigationGlass />{t('Entrar')}</Link>;

  return <div className={expanded ? styles.expandedAccount : styles.accountSlot} data-account-state={state}>
    {isPending ? <div className={styles.guestActions}>{loginLink}<span role="status" className={styles.expandedAccountLoading} aria-label={t('Verificando sua sessão')}><Skeleton className={styles.accountSkeleton} /></span></div> : error ? <div className={styles.guestActions}>{loginLink}<button type="button" className={styles.accountLink} data-navigation-glass="control" onClick={() => void refetch()} title={t('Não foi possível verificar a sessão. Tentar novamente.')}><NavigationGlass /><RefreshCw size={20} aria-hidden="true" /><span className={styles.accountLabel}>{t('Verificar conta')}</span></button>{expanded && <p role="status" className={styles.accountError}>{t('Não foi possível verificar a sessão. Tentar novamente.')}</p>}</div> : !user ? <div className={styles.guestActions}>{loginLink}</div> : expanded ? <>
      <div className={styles.userRow}>{avatar}<span>{user.name || t('Sua conta')}</span></div>
      <Link href="/conta" onClick={onNavigate}>{t('Minha conta')}</Link>
      <Link href="/portal/seguranca" onClick={onNavigate}>{t('Segurança da conta')}</Link>
      <button type="button" onClick={() => void logout()} disabled={busy}>{t(busy ? 'Saindo…' : 'Sair da conta')}</button>
    </> : <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger className={styles.avatarButton} data-navigation-glass="control" aria-label={t('Abrir opções da conta')}><NavigationGlass />{avatar}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={14} className={styles.popup} data-navigation-glass="panel">
        <NavigationGlass variant="panel" />
        <DropdownMenuGroup>
          <p className={styles.userName}>{user.name || t('Sua conta')}</p>
          <DropdownMenuItem render={<Link href="/conta" />} className={styles.menuItem}><UserRound aria-hidden="true" /> {t('Minha conta')}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/portal/seguranca" />} className={styles.menuItem}><ShieldCheck /> {t('Segurança da conta')}</DropdownMenuItem>
          <DropdownMenuItem className={styles.menuItem} disabled={busy} closeOnClick={false} onClick={() => void logout()}><LogOut /> {t(busy ? 'Saindo…' : 'Sair da conta')}</DropdownMenuItem>
        </DropdownMenuGroup>
        {logoutError && <p role="alert" className={styles.accountError}>{t("Não foi possível sair. Tente novamente.")}</p>}
      </DropdownMenuContent>
    </DropdownMenu>}
    {expanded && logoutError && <p role="alert" className={styles.accountError}>{t("Não foi possível sair. Tente novamente.")}</p>}
  </div>;
}
