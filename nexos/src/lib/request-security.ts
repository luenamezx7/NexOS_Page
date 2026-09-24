export class RequestError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

// Limit bytes while streaming, including requests without Content-Length.
export async function readJsonBody(request: Request, maxBytes = 8192): Promise<unknown> {
  const length = Number(request.headers.get('content-length'));
  if (length > maxBytes) throw new RequestError('Dados excessivos.', 413);
  const reader = request.body?.getReader();
  if (!reader) return {};
  let size = 0;
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError('Dados excessivos.', 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return text ? JSON.parse(text) : {}; }
  catch { throw new RequestError('JSON inválido.', 400); }
}

function allowedOrigins(site: string | undefined, fallbackUrl: string): Set<string> {
  const origins = new Set<string>();
  const base = new URL(site || fallbackUrl);
  origins.add(base.origin);
  const host = base.hostname;
  if (host.startsWith('www.')) origins.add(`${base.protocol}//${host.slice(4)}`);
  else origins.add(`${base.protocol}//www.${host}`);
  return origins;
}

export function isSameOrigin(request: Request): boolean {
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!site && process.env.NODE_ENV === 'production') return false;
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin === 'null') return false;
    return allowedOrigins(site, request.url).has(origin) &&
      request.headers.get('sec-fetch-site') !== 'cross-site';
  } catch { return false; }
}
