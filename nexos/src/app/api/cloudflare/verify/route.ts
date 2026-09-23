import { NextResponse } from "next/server";
import { isCloudflareConfigured, verifyToken, listZones } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isCloudflareConfigured()) {
    return NextResponse.json({ success: false, error: "CLOUDFLARE_API_TOKEN não configurado no .env.local" }, { status: 500 });
  }
  try {
    const verify = await verifyToken();
    let zones: unknown = null;
    try {
      zones = await listZones();
    } catch (e) {
      zones = { error: e instanceof Error ? e.message : String(e) };
    }
    return NextResponse.json({ success: true, verify: verify.result, zones });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 401 });
  }
}
