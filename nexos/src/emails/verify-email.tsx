import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './layout';

interface VerifyEmailProps {
  name: string;
  verifyLink: string;
  expiresInMinutes: number;
}

export function VerifyEmail({ name, verifyLink, expiresInMinutes }: VerifyEmailProps) {
  return (
    <EmailLayout preheader="Confirme seu e-mail para ativar sua conta NexOS">
      <Section style={styles.section}>
        <Heading style={styles.heading}>Confirme seu E-mail</Heading>
        <Text style={styles.greeting}>Olá, {name}!</Text>
        <Text style={styles.text}>
          Obrigado por criar sua conta no <strong>NexOS</strong>. Para ativá-la, precisamos confirmar seu e-mail.
        </Text>
        <Button href={verifyLink} style={styles.button}>
          Confirmar Meu E-mail
        </Button>
        <Text style={styles.textSmall}>
          Este link expira em <strong>{expiresInMinutes} minutos</strong>.
        </Text>
        <div style={styles.divider} />
        <Text style={styles.securityText}>
          Se você não criou esta conta, pode ignorar este e-mail com segurança.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const styles = {
  section: {
    padding: '24px 0',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 8px',
    textAlign: 'center' as const,
  },
  greeting: {
    fontSize: '16px',
    color: '#b3b3b3',
    margin: '0 0 24px',
    textAlign: 'center' as const,
  },
  text: {
    fontSize: '16px',
    color: '#b3b3b3',
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  textSmall: {
    fontSize: '14px',
    color: '#888888',
    margin: '16px 0 0',
    textAlign: 'center' as const,
  },
  button: {
    display: 'block',
    width: 'fit-content',
    margin: '24px auto 0',
    background: 'linear-gradient(135deg, #00d4aa 0%, #0066ff 100%)',
    color: '#0a0a0a',
    fontWeight: 600,
    padding: '16px 40px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '16px',
  },
  divider: {
    borderTop: '1px solid #2a2a2a',
    margin: '24px 0',
  },
  securityText: {
    margin: '8px 0',
    fontSize: '13px',
    color: '#6b6b6b',
    textAlign: 'center' as const,
  },
};