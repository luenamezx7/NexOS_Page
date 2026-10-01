'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { authClient, authErrorMessage } from '@/lib/auth/client';
import { setFirstPassword } from '@/lib/auth/security-actions';
import { evaluatePassword } from '@/lib/auth/password-strength';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props { enabled: boolean; hasPassword: boolean; isAdmin: boolean; callbackUrl: string | null }
interface SavedPasskey { id: string; name?: string | null; createdAt?: Date | string | null }

export function SecuritySettings({ enabled: initialEnabled, hasPassword: initialPassword, isAdmin, callbackUrl }: Props) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(initialEnabled);
  const [hasPassword, setHasPassword] = useState(initialPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [qr, setQr] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [passkeys, setPasskeys] = useState<SavedPasskey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function guard(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await fn(); }
    catch (err) { setError(authErrorMessage(err, 'Não foi possível concluir. Confira sua conexão e tente novamente.')); }
    finally { lock.current = false; setBusy(false); }
  }
  async function loadKeys() {
    const result = await authClient.passkey.listUserPasskeys();
    if (result.error) throw result.error;
    setPasskeys((result.data ?? []).map(key => ({ id: key.id, name: key.name, createdAt: key.createdAt })));
  }
  useEffect(() => {
    let active = true;
    void authClient.passkey.listUserPasskeys().then(result => {
      if (!active) return;
      if (result.error) setError(authErrorMessage(result.error, 'Não foi possível listar suas chaves de acesso.'));
      else setPasskeys((result.data ?? []).map(key => ({ id: key.id, name: key.name, createdAt: key.createdAt })));
    }).catch(() => { if (active) setError('Não foi possível listar suas chaves de acesso.'); })
      .finally(() => { if (active) setKeysLoading(false); });
    return () => { active = false; };
  }, []);

  const passwordField = (id: string) => hasPassword && <Field data-disabled={busy}>
    <FieldLabel htmlFor={id}>Senha atual</FieldLabel><Input id={id} type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={busy} required maxLength={256} />
  </Field>;

  return <div className="flex flex-col gap-6">
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {message && <Alert role="status"><AlertDescription>{message}</AlertDescription></Alert>}
    {isAdmin && !enabled && <Alert><AlertDescription>Operadores precisam ativar o autenticador para acessar o painel administrativo.</AlertDescription></Alert>}
    <Card>
      <CardHeader><CardTitle>Senha</CardTitle><CardDescription>{hasPassword ? 'Confirme a senha atual para escolher uma nova. As outras sessões serão encerradas.' : 'Sua conta usa acesso sem senha. Você também pode cadastrar uma senha.'}</CardDescription></CardHeader>
      <CardContent><form onSubmit={e => {
        e.preventDefault(); const element = e.currentTarget; const form = new FormData(element);
        void guard(async () => {
          if (newPassword !== String(form.get('confirm') ?? '')) { setError('As senhas precisam ser iguais.'); return; }
          if (!evaluatePassword(newPassword).acceptable) { setError('Use 12+ caracteres, maiúscula, minúscula, número e símbolo.'); return; }
          if (!hasPassword) {
            const result = await setFirstPassword(newPassword);
            if (!result.ok) { setError(result.error ?? 'Não foi possível definir a senha.'); return; }
            setHasPassword(true);
          } else {
            const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
            if (result.error) throw result.error;
          }
          setCurrentPassword(''); setNewPassword(''); setMessage('Senha atualizada. Guarde-a em um gerenciador de senhas.');
          element.reset();
        });
      }}><FieldGroup>
        {passwordField('password-current')}
        <Field data-disabled={busy}><FieldLabel htmlFor="password-new">Nova senha</FieldLabel><Input id="password-new" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={12} maxLength={256} disabled={busy} /><PasswordStrengthMeter password={newPassword} /></Field>
        <Field data-disabled={busy}><FieldLabel htmlFor="password-confirm">Confirmar nova senha</FieldLabel><Input id="password-confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={256} disabled={busy} /></Field>
        <Button type="submit" disabled={busy}>{hasPassword ? 'Trocar senha' : 'Definir senha'}</Button>
      </FieldGroup></form></CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Aplicativo autenticador (2FA)</CardTitle><CardDescription>{enabled ? 'Ativo. Novos acessos exigem o segundo fator, inclusive por Google, GitHub, Magic Link e Passkey.' : 'Use Google Authenticator, 1Password ou outro aplicativo TOTP.'}</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!enabled && !qr && <form onSubmit={e => { e.preventDefault(); void guard(async () => {
          const result = await authClient.twoFactor.enable({ method: 'totp', issuer: 'NexOS', ...(hasPassword ? { password: currentPassword } : {}) });
          if (result.error) throw result.error;
          const data = result.data as { totpURI?: string; backupCodes?: string[] };
          if (!data.totpURI) throw new Error('Não foi possível gerar o autenticador.');
          const QRCode = await import('qrcode');
          setQr(await QRCode.toDataURL(data.totpURI, { width: 240, margin: 2 }));
          setManualKey(new URL(data.totpURI).searchParams.get('secret') ?? '');
          setBackupCodes(data.backupCodes ?? []); setCurrentPassword('');
        }); }}><FieldGroup>{passwordField('mfa-current')}<Button type="submit" disabled={busy}>Ativar autenticador</Button></FieldGroup></form>}
        {qr && <>
          <p>Escaneie o QR Code no aplicativo. Confirme um código para ativar a proteção.</p>
          <Image src={qr} alt="QR Code para cadastrar o aplicativo autenticador" width={240} height={240} unoptimized />
          <details><summary>Não consigo escanear: chave manual</summary><code className="break-all">{manualKey}</code></details>
          <form onSubmit={e => { e.preventDefault(); const code = String(new FormData(e.currentTarget).get('code') ?? ''); void guard(async () => {
            const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
            if (result.error) throw result.error;
            setEnabled(true); setQr(''); setManualKey(''); setMessage('Autenticador ativado. Guarde os códigos de recuperação abaixo.');
          }); }}><FieldGroup><Field><FieldLabel htmlFor="mfa-code">Código do aplicativo</FieldLabel><Input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} /></Field><Button type="submit" disabled={busy}>Confirmar autenticador</Button></FieldGroup></form>
        </>}
        {enabled && !isAdmin && <form onSubmit={e => { e.preventDefault(); void guard(async () => {
          const result = await authClient.twoFactor.disable(hasPassword ? { password: currentPassword } : {});
          if (result.error) throw result.error;
          setEnabled(false); setBackupCodes([]); setCurrentPassword(''); setMessage('Autenticador desativado.');
        }); }}><FieldGroup>{passwordField('mfa-disable-password')}<Button variant="secondary" type="submit" disabled={busy}>Desativar autenticador</Button></FieldGroup></form>}
        {enabled && <form onSubmit={e => { e.preventDefault(); void guard(async () => {
          const result = await authClient.twoFactor.generateBackupCodes(hasPassword ? { password: currentPassword } : {});
          if (result.error) throw result.error;
          setBackupCodes(result.data?.backupCodes ?? []); setCurrentPassword(''); setMessage('Novos códigos gerados. Os anteriores deixaram de funcionar.');
        }); }}><FieldGroup>{passwordField('backup-password')}<Button variant="secondary" type="submit" disabled={busy}>Gerar novos códigos de recuperação</Button></FieldGroup></form>}
        {enabled && backupCodes.length > 0 && <section aria-label="Códigos de recuperação" className="flex flex-col gap-3">
          <p>Salve estes códigos em local seguro. Cada código pode ser usado uma única vez.</p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm">{backupCodes.map(code => <li key={code}>{code}</li>)}</ul>
          <Button variant="secondary" disabled={busy} onClick={() => void guard(async () => { await navigator.clipboard.writeText(backupCodes.join('\n')); setMessage('Códigos copiados. Guarde-os em local seguro.'); })}>Copiar códigos</Button>
        </section>}
        {enabled && callbackUrl && <Link href={callbackUrl} className="text-sm underline underline-offset-4">Continuar para o destino solicitado</Link>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Chaves de acesso</CardTitle><CardDescription>Entre com Touch ID, Face ID, Windows Hello ou uma chave de segurança. O NexOS não recebe seus dados biométricos.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form onSubmit={e => { e.preventDefault(); const name = String(new FormData(e.currentTarget).get('name') ?? '').trim(); void guard(async () => {
          if (!window.isSecureContext || !window.PublicKeyCredential) throw new Error('Este navegador não suporta chaves de acesso neste endereço. Use HTTPS.');
          const result = await authClient.passkey.addPasskey({ name });
          if (result.error) throw result.error;
          await loadKeys(); setMessage('Chave de acesso cadastrada.');
        }); }}><FieldGroup><Field><FieldLabel htmlFor="passkey-name">Nome da chave de acesso</FieldLabel><Input id="passkey-name" name="name" placeholder="Meu computador" maxLength={80} required disabled={busy} /></Field><Button type="submit" disabled={busy}>Cadastrar chave de acesso</Button></FieldGroup></form>
        {keysLoading ? <p role="status">Carregando suas chaves…</p> : passkeys.length === 0 ? <p>Nenhuma chave de acesso cadastrada.</p> : <ul className="flex flex-col gap-4">{passkeys.map(key => <li key={key.id} className="flex flex-wrap items-center justify-between gap-3">
          <span>{key.name || 'Chave de acesso'}</span>
          {pendingDelete === key.id ? <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={busy} onClick={() => void guard(async () => {
            const result = await authClient.passkey.deletePasskey({ id: key.id });
            if (result.error) throw result.error;
            setPendingDelete(null); await loadKeys(); setMessage('Chave de acesso removida.');
          })}>Confirmar remoção</Button><Button size="sm" variant="ghost" onClick={() => setPendingDelete(null)}>Cancelar</Button></div>
            : <Button size="sm" variant="secondary" disabled={busy} onClick={() => setPendingDelete(key.id)}>Remover</Button>}
        </li>)}</ul>}
      </CardContent>
    </Card>
  </div>;
}
