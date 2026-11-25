import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthTransition, type AuthPhase } from './AuthTransition';
import { BrandMark } from '../BrandMark';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { ClientPortalSurface } from './ClientPortalSurface';
import styles from './LoginForm.module.css';

/** Recovery uses the same centered Silk/glass composition as customer sign-in. */
export function CustomerAuthPanel({ title, titleId, description, children, phase, onConfirmed }: {
  title: string; titleId: string; description: string; children: ReactNode; phase?: AuthPhase; onConfirmed?: () => void;
}) {
  return <ClientPortalSurface>
    <main className={`${styles.customer} ${styles.premiumRoot}`} data-auth-surface="recovery">
      <div className={styles.content} id="main-content">
        <section className={styles.panelWrap} aria-labelledby={titleId}>
          <Card className={styles.panel} data-auth-card tabIndex={-1}>
            <AuthTransition phase={phase} onComplete={onConfirmed} pendingLabel="Salvando nova senha. Aguarde." successLabel="Senha atualizada.">
            <CardHeader className={styles.panelHeader}>
              <Link href="/" aria-label="ezway — página inicial" className={styles.loginBrand}><BrandMark registered /></Link>
              <h1 id={titleId} className={styles.heading}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </CardHeader>
            <CardContent className={styles.panelContent}>{children}</CardContent>
            <CardFooter className={styles.panelFooter}>
              <p className={styles.mfaDescription}>Precisa de ajuda? <a href="mailto:nexosperformance@gmail.com" className="underline underline-offset-4">Fale com a ezway</a></p>
              <Link href="/portal/acesso" className={styles.loginBack}>Voltar ao login</Link>
            </CardFooter>
            </AuthTransition>
          </Card>
        </section>
      </div>
    </main>
  </ClientPortalSurface>;
}
