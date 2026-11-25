import { Text } from '@react-email/components';
import { EmailHeading, EmailLayout, EmailText, emailStyles } from './layout';

export function LoginCodeEmail({ code }: { code: string }) {
  return <EmailLayout preheader="Seu código de acesso à ezway">
    <EmailHeading>Confirme seu acesso</EmailHeading>
    <EmailText>Digite este código no painel de login. Ele expira em 10 minutos e pode ser usado uma única vez.</EmailText>
    <Text style={{ margin: '24px 0', color: '#14200e', fontSize: '32px', fontFamily: 'monospace', letterSpacing: '6px', fontWeight: 700 }}>{code}</Text>
    <Text style={emailStyles.small}>Não compartilhe este código. Se você não solicitou o acesso, ignore este e-mail.</Text>
  </EmailLayout>;
}
