import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { frameMascotSvg } from '@/lib/mascot-svg';
import { SITE_PALETTE } from '@/lib/brand-palette';

export const dynamic = 'force-static';

export async function GET() {
  // Rasterize the ghost's first frame at build time for a square favicon.
  // Google Search needs a square raster favicon at a stable, crawlable URL.
  const svg = frameMascotSvg(await readFile(join(process.cwd(), 'design-', 'rebrand-nexos', 'ezwayghostblack1animated.svg'), 'utf8'))
    .replace(/fill="(#000|#fff)"/g, (_, color: string) => `fill="${color === '#000' ? SITE_PALETTE.action : SITE_PALETTE.surface}"`);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: SITE_PALETTE.surface }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders the embedded SVG server-side. */}
        <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`} width={192} height={192} alt="" />
      </div>
    ),
    { width: 192, height: 192, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
