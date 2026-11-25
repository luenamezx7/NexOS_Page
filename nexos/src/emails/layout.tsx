import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';

export interface EmailBanner { src: string; alt: string; width: number; height: number }
/** Add the approved, publicly hosted brand banner here once the artwork is ready. */
export const EMAIL_BRAND: { banner: EmailBanner | null } = { banner: null };
export const emailStyles = {
  heading: { margin: '0 0 20px', color: '#14200e', fontSize: '24px', fontWeight: 700, lineHeight: '1.3' },
  text: { margin: '0 0 20px', color: '#35452d', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line' },
  button: { padding: '14px 24px', border: '1px solid #183b12', borderRadius: '12px', backgroundColor: '#204717', color: '#f5ffe9', fontSize: '14px', fontWeight: 600, textDecoration: 'none', textAlign: 'center' },
  small: { margin: '20px 0 0', color: '#35452d', fontSize: '12px', lineHeight: '1.6' },
  link: { color: '#204717', fontSize: '12px', lineHeight: '1.6', wordBreak: 'break-all', textDecoration: 'underline' },
} satisfies Record<string, CSSProperties>;

interface Props { children?: ReactNode; preheader?: string; banner?: EmailBanner | null }
export function EmailLayout({ children, preheader = '', banner = EMAIL_BRAND.banner }: Props) {
  return <Html lang="pt-BR"><Head>
    <meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" />
  </Head><Preview>{preheader}</Preview>
    <Body style={{ margin: 0, padding: '24px 12px', backgroundColor: '#eef0e9', fontFamily: 'Arial, Helvetica, sans-serif', color: '#14200e' }}>
      <Container style={{ width: '100%', maxWidth: '480px', margin: '0 auto', backgroundColor: '#f4faec', border: '1px solid #d5e2c7', borderRadius: '20px', overflow: 'hidden' }} data-email-layout="ezway-code">
        <Section style={{ padding: '28px 28px 0' }}>
          {banner ? <Img src={banner.src} alt={banner.alt} width={banner.width} height={banner.height} style={{ display: 'block', width: '100%', maxWidth: '424px', height: 'auto', borderRadius: '12px', margin: '0 0 24px' }} /> : null}
          <Text style={{ margin: '0 0 28px', fontSize: '22px', fontWeight: 700, letterSpacing: '-.5px', color: '#14200e' }}>ezway</Text>
        </Section>
        <Section style={{ padding: '0 28px 28px' }}>{children}</Section>
        <Section style={{ padding: '20px 28px', borderTop: '1px solid #d5e2c7' }}>
          <Text style={{ ...emailStyles.small, margin: '0 0 10px' }}>ezway · Sua conta e seu acesso.</Text>
          <Text style={{ ...emailStyles.small, margin: 0 }}><Link href="https://nexoslab.online/privacidade" style={emailStyles.link}>Privacidade</Link>{' · '}<Link href="https://nexoslab.online/termos" style={emailStyles.link}>Termos</Link></Text>
        </Section>
      </Container>
    </Body></Html>;
}

export function EmailHeading({ children }: { children: ReactNode }) { return <Heading as="h1" style={emailStyles.heading}>{children}</Heading>; }
export function EmailText({ children }: { children: ReactNode }) { return <Text style={emailStyles.text}>{children}</Text>; }
export function EmailAction({ href, children }: { href: string; children: ReactNode }) { return <Button href={href} style={emailStyles.button}>{children}</Button>; }
