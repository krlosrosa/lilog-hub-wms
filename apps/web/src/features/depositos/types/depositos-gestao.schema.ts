import { z } from 'zod';

import type { DepositoFinalidade } from '@/features/depositos/types/deposito.api';

export const DEPOSITO_FINALIDADE_OPTIONS: {
  value: DepositoFinalidade;
  label: string;
}[] = [
  { value: 'transferencia', label: 'Transferência' },
  { value: 'aguardando_armazenagem', label: 'Aguardando Armazenagem' },
  { value: 'geral', label: 'Geral' },
  { value: 'quarentena', label: 'Quarentena' },
  { value: 'debito_transportadora', label: 'Débito Transportadora' },
  { value: 'acerto_transferencia', label: 'Acerto Transferência' },
  { value: 'reserva', label: 'Reserva' },
  { value: 'avaria', label: 'Avaria' },
  { value: 'bloqueado', label: 'Bloqueado' },
];

export const DEPOSITO_FINALIDADE_LABELS = Object.fromEntries(
  DEPOSITO_FINALIDADE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DepositoFinalidade, string>;

export const depositoFormSchema = z.object({
  codigo: z
    .string()
    .min(1, 'Informe o código')
    .max(30, 'Máximo de 30 caracteres')
    .regex(/^[A-Za-z0-9_]+$/, 'Use apenas letras, números e underscore'),
  nome: z.string().min(1, 'Informe o nome').max(100, 'Máximo de 100 caracteres'),
  finalidade: z.enum([
    'transferencia',
    'aguardando_armazenagem',
    'geral',
    'quarentena',
    'debito_transportadora',
    'acerto_transferencia',
    'reserva',
    'avaria',
    'bloqueado',
  ]),
  permiteVenda: z.boolean(),
  permitePicking: z.boolean(),
  exigeEndereco: z.boolean(),
  contaDisponivel: z.boolean(),
});

export type DepositoFormValues = z.infer<typeof depositoFormSchema>;

export type DepositoListaItem = {
  id: string;
  codigo: string;
  nome: string;
  finalidade: DepositoFinalidade;
  permiteVenda: boolean;
  permitePicking: boolean;
  exigeEndereco: boolean;
  contaDisponivel: boolean;
  sistema: boolean;
  ativo: boolean;
};

export const DEFAULT_DEPOSITO_FORM_VALUES: DepositoFormValues = {
  codigo: '',
  nome: '',
  finalidade: 'geral',
  permiteVenda: false,
  permitePicking: false,
  exigeEndereco: false,
  contaDisponivel: false,
};
