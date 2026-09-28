import { Html } from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  preheader?: string;
}

export function EmailLayout({ children, preheader }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <head />
      <body style={styles.body}>
        <div style={styles.preheader}>{preheader}</div>
        <table role="presentation" style={styles.wrapper}>
          <tr>
            <td style={styles.container}>
              <header style={styles.header}>
                <div style={styles.logo}>NX</div>
              </header>
              <main style={styles.main}>{children}</main>
              <footer style={styles.footer}>
                <p style={styles.footerText}>
                  NexOS — Serviços Digitais de Escala
                </p>
                <p style={styles.footerLinks}>
                  <a href="https://nexoslab.online/privacidade" style={styles.link}>Política de Privacidade</a>
                  {' | '}
                  <a href="https://nexoslab.online/termos" style={styles.link}>Termos de Uso</a>
                </p>
                <p style={styles.unsubscribe}>
                  Se você não solicitou este e-mail, pode ignorá-lo com segurança.
                </p>
              </footer>
            </td>
          </tr>
        </table>
      </body>
    </Html>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: '#0a0a0a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#ffffff',
    lineHeight: 1.6,
  },
  preheader: {
    display: 'none',
    maxHeight: 0,
    overflow: 'hidden',
    fontSize: '1px',
    color: '#0a0a0a',
    lineHeight: '1px',
  },
  wrapper: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  container: {
    backgroundColor: '#111111',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    overflow: 'hidden',
  },
  header: {
    padding: '32px 32px 16px',
    textAlign: 'center' as const,
  },
  logo: {
    display: 'inline-block',
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #00d4aa 0%, #0066ff 100%)',
    borderRadius: '12px',
    fontSize: '20px',
    fontWeight: 700,
    color: '#0a0a0a',
    lineHeight: '48px',
    letterSpacing: '-0.5px',
  },
  main: {
    padding: '0 32px 32px',
  },
  footer: {
    padding: '24px 32px',
    borderTop: '1px solid #2a2a2a',
    textAlign: 'center' as const,
  },
  footerText: {
    margin: '0 0 12px',
    fontSize: '13px',
    color: '#6b6b6b',
  },
  footerLinks: {
    margin: '0 0 16px',
    fontSize: '12px',
  },
  link: {
    color: '#00d4aa',
    textDecoration: 'none',
  },
  unsubscribe: {
    margin: 0,
    fontSize: '11px',
    color: '#4a4a4a',
  },
};