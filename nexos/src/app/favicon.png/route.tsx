import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export async function GET() {
  // Rasterize the static Nexbot mark at build time, without cropping or stretching.
  // Google Search needs a square raster favicon at a stable, crawlable URL.
  const svg = (await readFile(join(process.cwd(), 'design-', 'rebrand-nexos', 'nexbotlogostatic.svg'), 'utf8'))
    .replaceAll('fill="#000000"', 'fill="#fefefe"')
    .replaceAll('fill="#ffffff"', 'fill="#000000"');
  const imageWidth = 176;
  const imageHeight = imageWidth;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#000000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders the embedded SVG server-side. */}
        <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`} width={imageWidth} height={imageHeight} alt="" />
      </div>
    ),
    { width: 192, height: 192, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
