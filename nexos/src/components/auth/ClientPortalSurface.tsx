import type { ReactNode } from 'react';
import { PortalGlassOptics } from './PortalGlassOptics';
import { SilkBackground } from './SilkBackground';
import styles from './ClientPortalSurface.module.css';

/** Decorative boundary only: authentication and page semantics stay with callers. */
export function ClientPortalSurface({ children, theme = 'dark' }: { children: ReactNode; theme?: 'light' | 'dark' }) {
  return <div className={styles.page} data-client-portal data-portal-theme={theme}>
    <div className={styles.frame} data-silk-frame>
      <SilkBackground />
      <PortalGlassOptics />
      <div className={styles.foreground}>{children}</div>
    </div>
  </div>;
}
