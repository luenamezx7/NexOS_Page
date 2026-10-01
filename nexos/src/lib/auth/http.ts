/**
 * Respostas JSON para APIs.
 *
 * Separado de `session.ts` de propósito: formatar resposta não é validar
 * sessão. `private, no-store` evita que uma resposta autenticada seja
 * compartilhada por cache de CDN ou do navegador.
 */
export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export function deniedJson(status: 401 | 403 | 503) {
  const error = status === 401 ? 'Autenticação necessária.' : status === 403 ? 'Acesso negado.' : 'Serviço indisponível.';
  return privateJson({ error }, status);
}

/** Traduz o estado de sessão em uma resposta HTTP de API. */
export function denySession(state: { status: 401 | 403 }): Response {
  return deniedJson(state.status);
}