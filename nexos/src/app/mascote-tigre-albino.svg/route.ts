import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const svg = await readFile(join(process.cwd(), 'design-', 'rebrand-nexos', 'nexbotlogostatic.svg'), 'utf8');
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
}
