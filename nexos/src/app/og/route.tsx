import { ImageResponse } from 'next/og';
import { SITE_PALETTE } from '@/lib/brand-palette';
import { config } from '@/config';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '64px 72px', background: SITE_PALETTE.background, color: SITE_PALETTE.ink }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28 }}>
          <span style={{ fontSize: 58, fontWeight: 700 }}>EZway</span>
          <span style={{ color: SITE_PALETTE.highlight }}>Performance e Escala</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 80, fontWeight: 700, lineHeight: 1.1 }}>
          <span>Seu negócio,</span>
          <span style={{ color: SITE_PALETTE.highlight }}>mais perto do cliente.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, borderTop: `1px solid ${SITE_PALETTE.border}`, paddingTop: 24, fontSize: 24 }}>
          <span>Sites · Landing pages · Cardápios digitais · NFC + QR Code</span>
          <span style={{ fontSize: 20, color: SITE_PALETTE.muted }}>{config.brand.tagline}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
