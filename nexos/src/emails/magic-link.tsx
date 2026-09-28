import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './layout';

interface MagicLinkEmailProps {
  name: string;
  magicLink: string;
  expiresInMinutes: number;
  isOtp?: boolean;
  otpCode?: string;
}

export function MagicLinkEmail({ name, magicLink, expiresInMinutes, isOtp = false, otpCode }: MagicLinkEmailProps) {
  return (
    <EmailLayout preheader={isOtp ? `Seu código de acesso: ${otpCode}` : 'Acesse sua conta no NexOS com um clique'}>
      <Section style={styles.section}>
        <Heading style={styles.heading}>{isOtp ? 'Seu código de acesso' : 'Acesse sua conta'}</Heading>
        <Text style={styles.greeting}>Olá, {name || 'lá'}!</Text>
        
        {isOtp ? (
          <>
            <Text style={styles.text}>
              Use o código abaixo para entrar na sua conta NexOS:
            </Text>
            <div style={styles.otpContainer}>
              <span style={styles.otpCode}>{otpCode}</span>
            </div>
            <Text style={styles.textSmall}>
              Este código expira em <strong>{expiresInMinutes} minutos</strong>.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.text}>
              Clique no botão abaixo para entrar na sua conta instantaneamente — sem precisar de senha.
            </Text>
            <Button href={magicLink} style={styles.button}>
              Entrar na Minha Conta
            </Button>
            <Text style={styles.textSmall}>
              Este link expira em <strong>{expiresInMinutes} minutos</strong> e pode ser usado apenas uma vez.
            </Text>
          </>
        )}
        
        <Text style={styles.securityText}>
          Se você não solicitou este acesso, pode ignorar este e-mail com segurança.
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
  otpContainer: {
    textAlign: 'center' as const,
    margin: '24px 0',
  },
  otpCode: {
    display: 'inline-block',
    backgroundColor: '#1a1a1a',
    border: '2px solid #00d4aa',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '32px',
    fontWeight: 700,
    color: '#00d4aa',
    letterSpacing: '8px',
    fontFamily: 'monospace',
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
  securityText: {
    margin: '32px 0 0',
    fontSize: '13px',
    color: '#6b6b6b',
    textAlign: 'center' as const,
  },
};