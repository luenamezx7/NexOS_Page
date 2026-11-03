'use server';

import { revalidatePath } from 'next/cache';
import { getUserScope } from '@/lib/db/user-scope';

/**
 * Server action to update the authenticated user's profile.
 * Upserts into the `profiles` table (1:1 com o usuário Better Auth).
 *
 * @param formData - Must contain `fullName` (required) and `phone` (optional)
 * @returns `{ success: true }` on success, or `{ error: string }` on failure
 */
export async function updateProfileAction(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();

  if (!fullName) {
    return { error: 'Nome é obrigatório' };
  }

  try {
    const scope = await getUserScope();
    if (!scope) return { error: 'Não autenticado' };

    const { error } = await scope.client
      .from('profiles')
      .upsert({
        id: scope.userId,
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { error: 'Erro ao atualizar perfil' };
    }

    revalidatePath('/conta');
    return { success: true };
  } catch {
    return { error: 'Erro interno' };
  }
}
