import { Heading, Text, Button, Section, Hr } from '@react-email/components';
import { EmailLayout } from './layout';

interface NotificationEmailProps {
  name: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  actionVariant?: 'primary' | 'secondary' | 'warning';
}

export function NotificationEmail({ 
  name, 
  title, 
  message, 
  actionUrl, 
  actionLabel,
  actionVariant = 'primary'
}: NotificationEmailProps) {
  const buttonStyle = {
    ...styles.button,
    background: actionVariant === 'warning' 
      ? 'linear-gradient(135deg, #ff6b4a 0%, #ff3366 100%)'
      : actionVariant === 'secondary'
      ? '#2a2a2a'
      : 'linear-gradient(135deg, #00d4aa 0%, #0066ff 100%)',
    color: actionVariant === 'secondary' ? '#ffffff' : '#0a0a0a',
  };

  return (
    <EmailLayout preheader={title}>
      <Section style={styles.section}>
        <Heading style={styles.heading}>{title}</Heading>
        <Text style={styles.greeting}>Olá, {name}!</Text>
        <Text style={styles.text}>{message}</Text>
        
        {actionUrl && actionLabel && (
          <Button href={actionUrl} style={buttonStyle}>
            {actionLabel}
          </Button>
        )}
      </Section>
    </EmailLayout>
  );
}

const styles = {
  section: {
    padding: '24px 0',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 8px',
    textAlign: 'center' as const,
  },
  greeting: {
    fontSize: '16px',
    color: '#b3b3b3',
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  text: {
    fontSize: '16px',
    color: '#b3b3b3',
    margin: '0 0 24px',
    textAlign: 'center' as const,
  },
  button: {
    display: 'block',
    width: 'fit-content',
    margin: '16px auto 0',
    fontWeight: 600,
    padding: '14px 32px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '16px',
  },
};