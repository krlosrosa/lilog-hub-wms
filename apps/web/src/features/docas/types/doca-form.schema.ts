import { z } from 'zod';

import { docaTipoSchema } from '@/features/docas/types/docas.schema';

export const docaFormSchema = z.object({
  unidadeId: z.string().min(1, 'Selecione a unidade'),
  codigo: z.string().min(1, 'Informe o código').max(50),
  nome: z.string().min(1, 'Informe o nome').max(255),
  tipo: docaTipoSchema,
  capacidadeVeiculos: z
    .number()
    .int('Deve ser um número inteiro')
    .positive('Deve ser maior que zero')
    .optional(),
  observacao: z.string().optional(),
});

export type DocaFormValues = z.infer<typeof docaFormSchema>;

export const DOCA_FORM_TIPO_LABELS = {
  recebimento: 'Recebimento',
  expedicao: 'Expedição',
  compartilhada: 'Compartilhada',
} as const;

export const DOCA_FORM_TIPO_OPTIONS = [
  'recebimento',
  'expedicao',
  'compartilhada',
] as const;

export const DOCA_FORM_DEFAULT_VALUES: DocaFormValues = {
  unidadeId: '',
  codigo: '',
  nome: '',
  tipo: 'recebimento',
  capacidadeVeiculos: undefined,
  observacao: '',
};
