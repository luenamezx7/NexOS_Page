import 'server-only';
import { enqueueNotification } from './notifications';

export async function sendWelcomeIfNeeded(userId: string): Promise<void> {
  await enqueueNotification(userId, `welcome/${userId}`, {
    kind: 'welcome', detail: 'Sua conta foi confirmada. Você já pode acessar seus pedidos e configurar chaves de acesso e autenticação em duas etapas.',
  });
}
