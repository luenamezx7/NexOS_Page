import { NextResponse } from 'next/server';
import { getTurnstileSiteKey, isTurnstileConfigured, isTurnstileEnforced } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    required: isTurnstileEnforced(),
    configured: isTurnstileConfigured(),
    // Only the public widget key; the verification secret never leaves the server.
    siteKey: getTurnstileSiteKey(),
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
