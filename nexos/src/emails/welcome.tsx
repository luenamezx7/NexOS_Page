import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './layout';

interface WelcomeEmailProps {
  name: string;
  dashboardUrl: string;
}

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preheader="Bem-vindo ao NexOS! Sua conta foi criada com sucesso.">
      <Section style={styles.section}>
        <Heading style={styles.heading}>Bem-vindo, {name}!</Heading>
        <Text style={styles.text}>
          Sua conta no <strong>NexOS</strong> foi criada com sucesso. Estamos animados em ter você por aqui.
        </Text>
        <Text style={styles.text}>
          Acesse seu painel para começar a construir soluções digitais que escalam.
        </Text>
        <Button href={dashboardUrl} style={styles.button}>
          Acessar Painel
        </Button>
      </Section>
      <Section style={styles.featuresSection}>
        <Heading style={styles.featuresHeading}>O que você pode fazer</Heading>
        <ul style={styles.featuresList}>
          <li style={styles.featureItem}>🚀 Desenvolvimento sob medida com arquitetura moderna</li>
          <li style={styles.featureItem}>🎨 Design system e interfaces que convertem</li>
          <li style={styles.featureItem}>📱 Placas inteligentes NFC + QR Code</li>
          <li style={styles.featureItem}>⚡ CI/CD automatizado e observabilidade nativa</li>
        </ul>
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
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  text: {
    fontSize: '16px',
    color: '#b3b3b3',
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  button: {
    display: 'block',
    width: 'fit-content',
    margin: '24px auto 0',
    background: 'linear-gradient(135deg, #00d4aa 0%, #0066ff 100%)',
    color: '#0a0a0a',
    fontWeight: 600,
    padding: '14px 32px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '16px',
  },
  featuresSection: {
    padding: '16px 0 8px',
    borderTop: '1px solid #2a2a2a',
  },
  featuresHeading: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  featuresList: {
    margin: 0,
    padding: '0 0 0 20px',
    fontSize: '14px',
    color: '#b3b3b3',
  },
  featureItem: {
    margin: '8px 0',
    listStyle: 'none',
    paddingLeft: '8px',
  },
};