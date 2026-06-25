import { z } from 'zod';

import { inventarioTipoSchema } from '@/features/inventario/types/inventario-lista.schema';

export const inventarioCadastroFormSchema = z.object({
  nome: z.string().min(3, 'Informe um nome com pelo menos 3 caracteres'),
  dataProgramada: z.string().min(1, 'Selecione a data'),
  tipo: inventarioTipoSchema,
  centroId: z.string().uuid('Selecione o centro'),
  responsavelGestorId: z.string().optional(),
});

export type InventarioCadastroFormValues = z.infer<
  typeof inventarioCadastroFormSchema
>;

export const responsavelGestorOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export type ResponsavelGestorOption = z.infer<
  typeof responsavelGestorOptionSchema
>;
