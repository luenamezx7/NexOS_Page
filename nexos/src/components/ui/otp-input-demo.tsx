'use client';
import { useEffect, useRef, useState } from 'react';
import { OtpInput, type OtpInputHandle, type OtpStatus } from './otp-input';

/** Standalone visual example only; this code never authenticates a user. */
export default function OtpInputDemo() {
  const field = useRef<OtpInputHandle>(null);
  const [status, setStatus] = useState<OtpStatus>('idle');
  useEffect(() => { if (status === 'idle') return; const timer = setTimeout(() => { field.current?.clear(); setStatus('idle'); }, 1600); return () => clearTimeout(timer); }, [status]);
  return <div className="flex justify-center p-8"><OtpInput ref={field} status={status} onComplete={value => setStatus(value === '204815' ? 'success' : 'error')} hint="Demonstração: experimente 204815." successMessage="Código aceito na demonstração." errorMessage="Código incorreto." /></div>;
}
