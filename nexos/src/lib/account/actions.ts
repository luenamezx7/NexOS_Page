'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateProfileAction(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();

  if (!fullName) {
    return { error: 'Nome é obrigatório' };
  }

  try {
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return { error: 'Não autenticado' };
    }

    const { error } = await client
      .from('profiles')
      .upsert({
        id: user.id,
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
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return { error: 'Não autenticado' };
    }

    if (isDefault) {
      await client.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    }

    const { error } = await client.from('addresses').insert({
      user_id: user.id,
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

export async function deleteAddressAction(id: string) {
  try {
    const client = await createClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return { error: 'Não autenticado' };
    }

    const { error } = await client
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return { error: 'Erro ao remover endereço' };
    }

    revalidatePath('/conta');
    return { success: true };
  } catch {
    return { error: 'Erro interno' };
  }
}
