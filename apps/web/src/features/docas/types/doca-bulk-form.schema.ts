import { z } from 'zod';

import { docaTipoSchema } from '@/features/docas/types/docas.schema';

export const docaBulkFormSchema = z
  .object({
    unidadeId: z.string().min(1, 'Selecione a unidade'),
    numeroInicial: z
      .number()
      .int('Deve ser um número inteiro')
      .positive('Deve ser maior que zero'),
    numeroFinal: z
      .number()
      .int('Deve ser um número inteiro')
      .positive('Deve ser maior que zero'),
    codigoPrefixo: z.string().min(1, 'Informe o prefixo do código').max(20),
    nomePrefixo: z.string().min(1, 'Informe o prefixo do nome').max(50),
    tipo: docaTipoSchema,
    capacidadeVeiculos: z
      .number()
      .int('Deve ser um número inteiro')
      .positive('Deve ser maior que zero')
      .optional(),
    observacao: z.string().optional(),
  })
  .refine((data) => data.numeroInicial <= data.numeroFinal, {
    message: 'Número inicial deve ser menor ou igual ao final',
    path: ['numeroFinal'],
  })
  .refine((data) => data.numeroFinal - data.numeroInicial + 1 <= 100, {
    message: 'Intervalo máximo de 100 docas por operação',
    path: ['numeroFinal'],
  });

export type DocaBulkFormValues = z.infer<typeof docaBulkFormSchema>;

export const DOCA_BULK_FORM_DEFAULT_VALUES: DocaBulkFormValues = {
  unidadeId: '',
  numeroInicial: 1,
  numeroFinal: 10,
  codigoPrefixo: 'D',
  nomePrefixo: 'Doca ',
  tipo: 'recebimento',
  capacidadeVeiculos: undefined,
  observacao: '',
};

export function formatDocaNumero(numero: number, numeroFinal: number): string {
  const padLength = Math.max(2, String(numeroFinal).length);
  return String(numero).padStart(padLength, '0');
}

export function buildDocaCodigoPreview(
  prefixo: string,
  numero: number,
  numeroFinal: number,
): string {
  return `${prefixo}${formatDocaNumero(numero, numeroFinal)}`;
}

export function buildDocaNomePreview(
  prefixo: string,
  numero: number,
  numeroFinal: number,
): string {
  return `${prefixo}${formatDocaNumero(numero, numeroFinal)}`;
}
