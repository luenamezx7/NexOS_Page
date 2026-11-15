'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { motionDebugEnabled } from '@/lib/motion-diagnostics';

const Panel = dynamic(() => import('./MotionDiagnostics'), { ssr: false });

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

const serverSnapshot = () => false;

export function MotionDiagnosticsLoader() {
  const enabled = useSyncExternalStore(subscribe, motionDebugEnabled, serverSnapshot);
  return enabled ? <Panel /> : null;
}
