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

/**
 * Server action to add a new delivery address for the authenticated user.
 * If `isDefault` is true, removes the default flag from all other addresses first.
 *
 * @param formData - Must contain: street, number, neighborhood, city, state, cep.
 *                   Optional: type (home|work|other), complement, isDefault.
 * @returns `{ success: true }` on success, or `{ error: string }` on failure
 */
export async function addAddressAction(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const street = String(formData.get('street') ?? '').trim();
  const number = String(formData.get('number') ?? '').trim();
  const complement = String(formData.get('complement') ?? '').trim();
  const neighborhood = String(formData.get('neighborhood') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const cep = String(formData.get('cep') ?? '').trim();
  const type = String(formData.get('type') ?? 'home');
  const isDefault = formData.get('isDefault') === 'on';

  if (!street || !number || !neighborhood || !city || !state || !cep) {
    return { error: 'Preencha todos os campos obrigatórios' };
  }

  try {
    const scope = await getUserScope();
    if (!scope) return { error: 'Não autenticado' };

    if (isDefault) {
      await scope.client.from('addresses').update({ is_default: false }).eq('user_id', scope.userId);
    }

    const { error } = await scope.client.from('addresses').insert({
      user_id: scope.userId,
      type,
      street,
      number,
      complement: complement || null,
      neighborhood,
      city,
      state,
      cep,
      is_default: isDefault,
    });

    if (error) {
      return { error: 'Erro ao adicionar endereço' };
    }

    revalidatePath('/conta');
    return { success: true };
  } catch {
    return { error: 'Erro interno' };
  }
}

/**
 * Server action to delete a delivery address.
 * O `id` vem do cliente: o `.eq('user_id', scope.userId)` é o que impede que
 * outro usuário apague o endereço trocando o id na chamada.
 *
 * @param id - UUID do endereço a remover
 * @returns `{ success: true }` on success, or `{ error: string }` on failure
 */
export async function deleteAddressAction(id: string) {
  try {
    const scope = await getUserScope();
    if (!scope) return { error: 'Não autenticado' };

    const { data, error } = await scope.client
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', scope.userId)
      .select('id')
      .maybeSingle();

    if (error) return { error: 'Erro ao remover endereço' };
    // Nenhuma linha afetada = o endereço não é do usuário.
    if (!data) return { error: 'Endereço não encontrado' };

    revalidatePath('/conta');
    return { success: true };
  } catch {
    return { error: 'Erro interno' };
  }
}
