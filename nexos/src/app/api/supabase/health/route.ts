import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !hasKey) {
    return NextResponse.json({ ok: false, error: 'NEXT_PUBLIC_SUPABASE_URL ou PUBLISHABLE_KEY faltando' }, { status: 500 });
  }
  try {
    const supabase = await createClient();
    // Testa Auth (não precisa de tabela) + lista tabelas se possível
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    // Tenta listar buckets (requere anon perm) como teste de conectividade
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();

    return NextResponse.json({
      ok: true,
      url,
      hasKey,
      auth: { user: userData?.user ?? null, error: userErr?.message ?? null },
      storage: { buckets: buckets?.map((b) => b.name) ?? null, error: bucketErr?.message ?? null },
      // Cloudflare status em segundo plano
      cloudflare: { pending: 'nexoslab.online ainda Pending — nameservers em propagação' },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
