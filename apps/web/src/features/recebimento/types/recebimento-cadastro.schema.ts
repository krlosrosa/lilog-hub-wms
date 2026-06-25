import { z } from 'zod';

export const itemPreRecebimentoSchema = z.object({
  produtoId: z.string().uuid('Selecione um produto válido'),
  produtoLabel: z.string().min(1, 'Selecione um produto'),
  quantidadeEsperada: z
    .number({ error: 'Informe a quantidade' })
    .positive('Informe a quantidade'),
  unidadeMedida: z.string().min(1, 'Informe a unidade'),
  loteEsperado: z.string().optional(),
  pesoEsperado: z.string().optional(),
  validadeEsperada: z.string().optional(),
});

export type ItemPreRecebimentoFormValues = z.infer<
  typeof itemPreRecebimentoSchema
>;

export const recebimentoCadastroFormSchema = z.object({
  transportadoraId: z.string().min(1, 'Informe a transportadora'),
  placa: z.string().min(1, 'Informe a placa do veículo'),
  horarioPrevisto: z.string().min(1, 'Informe o horário previsto'),
  observacao: z.string().optional(),
  itens: z
    .array(itemPreRecebimentoSchema)
    .min(1, 'Adicione pelo menos 1 item'),
});

export type RecebimentoCadastroFormValues = z.infer<
  typeof recebimentoCadastroFormSchema
>;

export const EMPTY_ITEM_PRE_RECEBIMENTO: ItemPreRecebimentoFormValues = {
  produtoId: '',
  produtoLabel: '',
  quantidadeEsperada: 1,
  unidadeMedida: 'UN',
  loteEsperado: '',
  pesoEsperado: undefined,
  validadeEsperada: '',
};
