import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export async function GET() {
  // Rasterize the owner's original SVG at build time, without cropping or stretching.
  // Google Search needs a square raster favicon at a stable, crawlable URL.
  const svg = await readFile(join(process.cwd(), 'public', 'icon.svg'));
  const imageWidth = 176;
  const imageHeight = imageWidth * 257 / 307;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#000000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders the embedded SVG server-side. */}
        <img src={`data:image/svg+xml;base64,${svg.toString('base64')}`} width={imageWidth} height={imageHeight} alt="" />
      </div>
    ),
    { width: 192, height: 192, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
