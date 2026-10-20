import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const svg = await readFile(join(process.cwd(), 'design-', 'img-ref', 'tigre_albino_capuz_fino.svg'), 'utf8');
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
}
