import { Link, Text } from '@react-email/components';
import { EmailAction, EmailHeading, EmailLayout, EmailText, emailStyles } from './layout';

export interface TransactionalEmailProps { heading: string; message: string; actionLabel: string; url: string }
export function TransactionalEmail({ heading, message, actionLabel, url }: TransactionalEmailProps) {
  return <EmailLayout preheader={heading}>
    <EmailHeading>{heading}</EmailHeading>
    <EmailText>{message}</EmailText>
    <EmailAction href={url}>{actionLabel}</EmailAction>
    <Text style={emailStyles.small}>Se o botão não abrir, use este endereço:</Text>
    <Link href={url} style={emailStyles.link}>{url}</Link>
    <Text style={emailStyles.small}>Se você não reconhece esta atividade, acesse a segurança da conta ou fale com nexosperformance@gmail.com.</Text>
  </EmailLayout>;
}
