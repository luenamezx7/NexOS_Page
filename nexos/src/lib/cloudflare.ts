// ============================================================
// NexOS — Cloudflare API v4 — helper server-side
// Docs: https://developers.cloudflare.com/api/
// Token: CLOUDFLARE_API_TOKEN (Bearer)
//       CLOUDFLARE_ACCOUNT_ID (opcional, para filtros)
// ============================================================

const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const FETCH_TIMEOUT_MS = 15_000;

function getToken(): string | null {
  const t = (process.env.CLOUDFLARE_API_TOKEN ?? "").trim();
  return t.length > 0 ? t : null;
}

function getAccountId(): string | null {
  const id = (process.env.CLOUDFLARE_ACCOUNT_ID ?? "").trim();
  return id.length > 0 ? id : null;
}

export function isCloudflareConfigured(): boolean {
  return getToken() !== null;
}

function cfHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN não configurado");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface CfApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

async function cfFetch<T>(path: string, init: RequestInit = {}): Promise<CfApiResponse<T>> {
  const url = `${CF_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...cfHeaders(), ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as CfApiResponse<T>;
  if (!res.ok || !body.success) {
    const msg = body.errors?.[0]?.message ?? `Cloudflare ${res.status} em ${path}`;
    throw new Error(msg);
  }
  return body;
}

// ── Verify ──────────────────────────────────────────────────

export interface TokenVerifyResult {
  id: string;
  status: string;
}

export async function verifyToken(): Promise<CfApiResponse<TokenVerifyResult>> {
  return cfFetch<TokenVerifyResult>("/user/tokens/verify", { method: "GET" });
}

// ── Zones ───────────────────────────────────────────────────

export interface CfZone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
}

export async function listZones(): Promise<CfZone[]> {
  const accountId = getAccountId();
  const qs = accountId ? `?account.id=${accountId}` : "";
  const data = await cfFetch<CfZone[]>(`/zones${qs}`, { method: "GET" });
  return data.result;
}

// ── DNS ─────────────────────────────────────────────────────

export interface CfDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
}

export async function listDnsRecords(zoneId: string): Promise<CfDnsRecord[]> {
  const data = await cfFetch<CfDnsRecord[]>(`/zones/${zoneId}/dns_records`, { method: "GET" });
  return data.result;
}

// ── Cache Purge ─────────────────────────────────────────────

export async function purgeCache(zoneId: string, opts: { purge_everything?: boolean; files?: string[] } = { purge_everything: true }) {
  return cfFetch(`/zones/${zoneId}/purge_cache`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
}

// Generic helper for any endpoint
export async function cloudflareFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const data = await cfFetch<T>(path, init);
  return data.result;
}
