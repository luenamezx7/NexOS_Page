import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { frameMascotSvg } from '@/lib/mascot-svg';

export const dynamic = 'force-static';

export async function GET() {
  const svg = frameMascotSvg(await readFile(join(process.cwd(), 'design-', 'rebrand-nexos', 'ezwayghostblack1animated.svg'), 'utf8'));
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
}
