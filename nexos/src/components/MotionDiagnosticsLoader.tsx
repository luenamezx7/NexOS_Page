'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motionDebugEnabled } from '@/lib/motion-diagnostics';

const Panel = dynamic(() => import('./MotionDiagnostics'), { ssr: false });

export function MotionDiagnosticsLoader() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(motionDebugEnabled()); }, []);
  return enabled ? <Panel /> : null;
}
