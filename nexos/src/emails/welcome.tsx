import { Heading, Section, Text } from '@react-email/components';
import { EmailAction, EmailHeading, EmailLayout, EmailText, emailStyles } from './layout';

interface WelcomeEmailProps { name: string; dashboardUrl: string }
export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return <EmailLayout preheader="Boas-vindas à ezway! Sua conta foi criada com sucesso.">
    <EmailHeading>Bem-vindo, {name}!</EmailHeading>
    <EmailText>Sua conta na ezway foi criada com sucesso. Estamos animados em ter você por aqui.</EmailText>
    <EmailText>Acesse seu painel para começar a construir soluções digitais que escalam.</EmailText>
    <EmailAction href={dashboardUrl}>Acessar Painel</EmailAction>
    <Section style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #d5e2c7' }}>
      <Heading as="h2" style={{ ...emailStyles.heading, fontSize: '18px' }}>O que você pode fazer</Heading>
      <Text style={emailStyles.text}>Desenvolvimento sob medida com arquitetura moderna<br />Design system e interfaces que convertem<br />Placas inteligentes NFC + QR Code<br />CI/CD automatizado e observabilidade nativa</Text>
    </Section>
  </EmailLayout>;
}
