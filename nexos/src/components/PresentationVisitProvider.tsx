'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const VisitContext = createContext({ eligible: false, consume: () => {} });

/** Lifetime is one browser document. Internal App Router navigation retains it;
 * reopening/F5 creates a fresh instance without consulting persistent storage. */
export function PresentationVisitProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [eligible, setEligible] = useState(pathname === '/');
  const consume = useCallback(() => setEligible(false), []);
  const value = useMemo(() => ({ eligible, consume }), [eligible, consume]);
  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function usePresentationVisit() { return useContext(VisitContext); }
