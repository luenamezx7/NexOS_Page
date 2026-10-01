import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';

export interface TransactionalEmailProps {
  heading: string;
  message: string;
  actionLabel: string;
  url: string;
}

export function TransactionalEmail({ heading, message, actionLabel, url }: TransactionalEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{heading}</Preview>
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif', color: '#171717', padding: '24px' }}>
        <Container style={{ maxWidth: '560px', backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px' }}>
          <Text style={{ fontWeight: 700 }}>NexOS</Text>
          <Heading as="h1" style={{ fontSize: '24px' }}>{heading}</Heading>
          <Text style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>{message}</Text>
          <Button href={url} style={{ backgroundColor: '#171717', color: '#ffffff', padding: '14px 24px', borderRadius: '8px' }}>{actionLabel}</Button>
          <Text style={{ fontSize: '12px', color: '#525252' }}>Se o botão não abrir, use este endereço:</Text>
          <Link href={url} style={{ fontSize: '12px', wordBreak: 'break-all' }}>{url}</Link>
          <Text style={{ fontSize: '12px', color: '#525252' }}>Se você não reconhece esta atividade, acesse a segurança da conta ou fale com nexosperformance@gmail.com.</Text>
        </Container>
      </Body>
    </Html>
  );
}
