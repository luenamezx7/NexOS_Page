import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '64px 72px', background: '#131316', color: '#f3ead9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28 }}>
          <span style={{ fontSize: 58, fontWeight: 700 }}>NexOS</span>
          <span style={{ color: '#dca4ba' }}>Design + código + estratégia</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 80, fontWeight: 700, lineHeight: 1.1 }}>
          <span>Sites para</span>
          <span style={{ color: '#dca4ba' }}>seu negócio.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, borderTop: '1px solid #494047', paddingTop: 24, fontSize: 24 }}>
          <span>Sites · Landing pages · Cardápios digitais · NFC + QR Code</span>
          <span style={{ fontSize: 20, color: '#b5afb2' }}>nexoslab.online</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
