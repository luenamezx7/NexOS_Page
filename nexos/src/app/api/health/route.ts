// Liveness público: não consulta provedores nem descreve configuração interna.
export async function GET() {
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
