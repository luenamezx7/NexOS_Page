import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth/instance';

/**
 * Handler HTTP do Better Auth.
 *
 * Substitui o roteador manual de ações (`[action]/route.ts`) e cobre todos os
 * endpoints de autenticação sob `/api/auth/*`.
 *
 * `/api/auth/session` NÃO é do Better Auth: é uma rota estática
 * (`src/app/api/auth/session/route.ts`) que o Next resolve antes do catch-all,
 * e continua existindo para o front consultar o estado de acesso.
 *
 * Os handlers são montados sob demanda porque `toNextJsHandler` recebe a
 * instância, e a instância só pode ser criada no request — o import deste
 * módulo acontece durante o build, sem os segredos de runtime.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Handlers = ReturnType<typeof toNextJsHandler>;

let handlers: Handlers | null = null;
const getHandlers = (): Handlers => (handlers ??= toNextJsHandler(getAuth()));

type Args<T extends keyof Handlers> = Parameters<Handlers[T]>;

export const GET = (...args: Args<'GET'>) => getHandlers().GET(...args);
export const POST = (...args: Args<'POST'>) => getHandlers().POST(...args);
export const PATCH = (...args: Args<'PATCH'>) => getHandlers().PATCH(...args);
export const PUT = (...args: Args<'PUT'>) => getHandlers().PUT(...args);
export const DELETE = (...args: Args<'DELETE'>) => getHandlers().DELETE(...args);
