import { z } from 'zod';

export const profilePatchSchema = z.object({
  fullName: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter até 100 caracteres').optional(),
  phone: z.string().trim().max(25, 'Telefone deve ter até 25 caracteres').refine(
    value => value === '' || (/^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 10),
    'Telefone inválido',
  ).optional(),
}).strict().refine(value => value.fullName !== undefined || value.phone !== undefined, 'Informe nome ou telefone');
