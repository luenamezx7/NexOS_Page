import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { z } from 'zod';
import { isTurnstileEnforced, verifyTurnstileToken } from '@/lib/turnstile';
import { getAdminAccess, deniedJson, privateJson } from '@/lib/auth/admin';
import { notionHealth } from '@/lib/admin-health';
import { isSameOrigin, readJsonBody, RequestError } from '@/lib/request-security';

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
  const access = await getAdminAccess();
  if (!access.ok) return deniedJson(access.status);
  return privateJson(await notionHealth());
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return privateJson({ error: 'Origem inválida.' }, 403);
  try {
    const body = await readJsonBody(req, 32768);
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
        { error: 'Contato temporariamente indisponível. Tente novamente mais tarde.' },
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
      Mensagem: { rich_text: (data.message.match(/[\s\S]{1,2000}/g) ?? []).map(content => ({ text: { content } })) },
    } as unknown as Record<string, never>;

    // tenta database_id primeiro, fallback para data_source_id (novo modelo Notion)
    const tryCreate = async (parent: { database_id: string } | { data_source_id: string }) => {
      return (notion.pages.create as unknown as (args: { parent: typeof parent; properties: typeof properties }) => Promise<unknown>)({ parent, properties });
    };

    try {
      await tryCreate({ database_id: databaseId });
    } catch (firstError: unknown) {

      // tenta via data_source_id se o database usa novo modelo
      try {
        const db = await notion.databases.retrieve({ database_id: databaseId }) as unknown as { data_sources?: { id: string }[] };
        const dsId: string | undefined = db.data_sources?.[0]?.id;
        if (dsId) {
          await tryCreate({ data_source_id: dsId });
        } else {
          throw firstError;
        }
      } catch {
        console.error('[api/contact] provider_failure');
        return NextResponse.json(
          {
            error: 'Não foi possível enviar a mensagem. Tente novamente mais tarde.',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof RequestError) return privateJson({ error: error.message }, error.status);
    console.error('[api/contact] request_failure');
    return NextResponse.json({ error: 'Não foi possível processar a solicitação.' }, { status: 500 });
  }
}
