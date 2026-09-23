import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { z } from 'zod';
import { isTurnstileEnforced, verifyTurnstileToken } from '@/lib/turnstile';

const contactSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório').max(100),
  email: z.string().email('E-mail inválido').max(200),
  company: z.string().max(100).optional().default(''),
  service: z.string().max(100).optional().default(''),
  message: z.string().min(5, 'Mensagem é obrigatória').max(5000),
  turnstileToken: z.string().optional(),
});

type ContactPayload = z.infer<typeof contactSchema>;

function getNotionClient(): Client | null {
  const token = process.env.NOTION_TOKEN;
  if (!token) return null;
  return new Client({ auth: token });
}

function getServiceLabel(serviceId: string): string {
  // maps internal service id to display label, fallback to id itself
  const map: Record<string, string> = {
    dev: 'Desenvolvimento Full-Stack',
    design: 'Product Design & Branding',
    strategy: 'Estratégia & Discovery',
  };
  if (!serviceId) return 'Não informado';
  return map[serviceId] ?? serviceId;
}

export async function GET() {
  const hasToken = !!process.env.NOTION_TOKEN;
  const rawId = process.env.NOTION_DATABASE_ID ?? '';
  // diagnostico sem vazar token completo
  const tokenPreview = process.env.NOTION_TOKEN ? `${process.env.NOTION_TOKEN.slice(0, 6)}...${process.env.NOTION_TOKEN.slice(-4)}` : null;

  if (!hasToken || !rawId) {
    return NextResponse.json(
      { ok: false, hasToken, hasDatabaseId: !!rawId, tokenPreview, error: 'NOTION_TOKEN ou NOTION_DATABASE_ID faltando no Vercel' },
      { status: 500 }
    );
  }

  try {
    const notion = getNotionClient()!;
    const dbId = rawId.trim();
    // tenta via database_id
    try {
      const db = await notion.databases.retrieve({ database_id: dbId }) as unknown as { title: unknown; data_sources?: { id: string }[] };
      const dsId: string | undefined = db.data_sources?.[0]?.id;
      return NextResponse.json({ ok: true, hasToken, hasDatabaseId: true, tokenPreview, databaseId: dbId, dataSourceId: dsId ?? null, title: db.title });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const body = (e as unknown as { body?: unknown })?.body;
      return NextResponse.json({ ok: false, hasToken, hasDatabaseId: true, tokenPreview, databaseId: dbId, error: msg, body }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: ContactPayload = parsed.data;

    // ── Turnstile (Cloudflare) ──
    if (isTurnstileEnforced()) {
      const token = (data as unknown as { turnstileToken?: string }).turnstileToken;
      if (!token) {
        return NextResponse.json({ error: 'Verificação de segurança obrigatória. Atualize a página e tente novamente.' }, { status: 400 });
      }
      const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
      const result = await verifyTurnstileToken(token, ip ?? undefined);
      if (!result.success) {
        return NextResponse.json({ error: 'Falha na verificação anti-bot. Tente novamente.', details: result['error-codes']?.join(', ') }, { status: 403 });
      }
    }

    const token = process.env.NOTION_TOKEN?.trim();
    const rawDatabaseId = process.env.NOTION_DATABASE_ID?.trim();

    if (!token || !rawDatabaseId) {
      console.error('[api/contact] NOTION_TOKEN ou NOTION_DATABASE_ID não configurados', { hasToken: !!token, hasDatabaseId: !!rawDatabaseId });
      return NextResponse.json(
        { error: 'Integração Notion não configurada no servidor. Configure NOTION_TOKEN e NOTION_DATABASE_ID no Vercel → Settings → Environment Variables e faça Redeploy.' },
        { status: 500 }
      );
    }

    const notion = getNotionClient();
    if (!notion) {
      return NextResponse.json({ error: 'Falha ao inicializar Notion' }, { status: 500 });
    }

    const serviceLabel = getServiceLabel(data.service);
    const databaseId = rawDatabaseId.replace(/-/g, '').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

    const properties = {
      Nome: { title: [{ text: { content: data.name } }] },
      Email: { email: data.email },
      Companhia: { rich_text: [{ text: { content: data.company || '-' } }] },
      Serviço: { rich_text: [{ text: { content: serviceLabel } }] },
      Mensagem: { rich_text: [{ text: { content: data.message } }] },
    } as unknown as Record<string, never>;

    // tenta database_id primeiro, fallback para data_source_id (novo modelo Notion)
    const tryCreate = async (parent: { database_id: string } | { data_source_id: string }) => {
      return (notion.pages.create as unknown as (args: { parent: typeof parent; properties: typeof properties }) => Promise<unknown>)({ parent, properties });
    };

    try {
      await tryCreate({ database_id: databaseId });
    } catch (firstError: unknown) {
      const firstMsg = firstError instanceof Error ? firstError.message : String(firstError);
      const firstBody = (firstError as unknown as { body?: unknown })?.body ?? (firstError as unknown as { code?: string })?.code;
      console.error('[api/contact] Notion create via database_id failed:', firstMsg, firstBody);

      // tenta via data_source_id se o database usa novo modelo
      try {
        const db = await notion.databases.retrieve({ database_id: databaseId }) as unknown as { data_sources?: { id: string }[] };
        const dsId: string | undefined = db.data_sources?.[0]?.id;
        if (dsId) {
          console.log('[api/contact] retry via data_source_id', dsId);
          await tryCreate({ data_source_id: dsId });
        } else {
          throw firstError;
        }
      } catch (secondError: unknown) {
        const msg = secondError instanceof Error ? secondError.message : String(secondError);
        const body = (secondError as unknown as { body?: unknown })?.body ?? msg;
        console.error('[api/contact] Notion retry failed:', msg, body);
        return NextResponse.json(
          {
            error: 'Erro ao salvar no Notion',
            details: typeof body === 'string' ? body : JSON.stringify(body),
            hint: 'Verifique se a Integration tem acesso ao database (Connections) e se as colunas são: Nome (title), Email (email), Companhia (rich_text), Serviço (rich_text), Mensagem (rich_text).',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[api/contact] unexpected', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Erro interno', details: msg }, { status: 500 });
  }
}
