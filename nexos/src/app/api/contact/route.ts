import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório').max(100),
  email: z.string().email('E-mail inválido').max(200),
  company: z.string().max(100).optional().default(''),
  service: z.string().max(100).optional().default(''),
  message: z.string().min(5, 'Mensagem é obrigatória').max(5000),
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

    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!token || !databaseId) {
      console.error('[api/contact] NOTION_TOKEN ou NOTION_DATABASE_ID não configurados');
      return NextResponse.json(
        { error: 'Integração Notion não configurada no servidor. Configure NOTION_TOKEN e NOTION_DATABASE_ID.' },
        { status: 500 }
      );
    }

    const notion = getNotionClient();
    if (!notion) {
      return NextResponse.json({ error: 'Falha ao inicializar Notion' }, { status: 500 });
    }

    const serviceLabel = getServiceLabel(data.service);

    // Mapeamento para o seu database "Contatos de Clientes"
    // Propriedades detectadas: Nome (title), Email (email), Companhia (rich_text), Serviço (rich_text), Mensagem (rich_text)
    try {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Nome: {
            title: [{ text: { content: data.name } }],
          },
          Email: {
            email: data.email,
          },
          Companhia: {
            rich_text: [{ text: { content: data.company || '-' } }],
          },
          Serviço: {
            rich_text: [{ text: { content: serviceLabel } }],
          },
          Mensagem: {
            rich_text: [{ text: { content: data.message } }],
          },
        },
      });
    } catch (notionError: unknown) {
      const msg = notionError instanceof Error ? notionError.message : String(notionError);
      console.error('[api/contact] Notion error:', msg);

      // Mensagem amigável para erro comum de propriedade não encontrada
      if (msg.includes('property') || msg.includes('validation_error')) {
        return NextResponse.json(
          {
            error:
              'Erro de propriedades no Notion. Verifique se o database tem as colunas: Nome (title), Email (email), Companhia (rich_text), Serviço (rich_text), Mensagem (rich_text).',
            details: msg,
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: 'Erro ao salvar no Notion', details: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[api/contact] unexpected', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
