import { z } from 'zod';

export const transportadoraStatusSchema = z.enum(['ativa', 'inativa']);

export type TransportadoraStatus = z.infer<typeof transportadoraStatusSchema>;

export const filtroTransportadoraStatusSchema = z.enum([
  'todos',
  'ativa',
  'inativa',
]);

export type FiltroTransportadoraStatus = z.infer<
  typeof filtroTransportadoraStatusSchema
>;

export const transportadoraListaItemSchema = z.object({
  id: z.string(),
  nome: z.string(),
  idRavexTransportadora: z.number().int().positive(),
  cnpj: z.string(),
  status: transportadoraStatusSchema,
  quantidadeVeiculos: z.number().int().nonnegative(),
  emails: z.array(z.string()).default([]),
});

export type TransportadoraListaItem = z.infer<
  typeof transportadoraListaItemSchema
>;

const cnpjDigitsRegex = /^\d{14}$/;

function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCnpj(value: string): string {
  const digits = normalizeCnpj(value);

  if (digits.length !== 14) {
    return value;
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

export const transportadoraFormSchema = z.object({
  nome: z.string().min(2, 'Informe o nome da transportadora'),
  idRavexTransportadora: z
    .number({ message: 'Informe o ID Ravex' })
    .int('ID Ravex deve ser um número inteiro')
    .positive('ID Ravex deve ser maior que zero'),
  cnpj: z
    .string()
    .min(1, 'Informe o CNPJ')
    .refine((value) => cnpjDigitsRegex.test(normalizeCnpj(value)), {
      message: 'CNPJ deve conter 14 dígitos',
    }),
  status: transportadoraStatusSchema,
});

export type TransportadoraFormValues = z.infer<typeof transportadoraFormSchema>;

export const TRANSPORTADORA_STATUS_LABELS: Record<TransportadoraStatus, string> =
  {
    ativa: 'Ativa',
    inativa: 'Inativa',
  };

export const FILTRO_TRANSPORTADORA_STATUS_LABELS: Record<
  FiltroTransportadoraStatus,
  string
> = {
  todos: 'Todas',
  ativa: 'Ativas',
  inativa: 'Inativas',
};

export const FILTROS_TRANSPORTADORA_STATUS = [
  'todos',
  'ativa',
  'inativa',
] as const satisfies readonly FiltroTransportadoraStatus[];

export const TRANSPORTADORAS_PAGE_SIZE = 10;

export const DEFAULT_TRANSPORTADORA_FORM: TransportadoraFormValues = {
  nome: '',
  idRavexTransportadora: 0,
  cnpj: '',
  status: 'ativa',
};
