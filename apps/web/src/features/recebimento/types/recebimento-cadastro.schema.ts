import { z } from 'zod';

export const itemPreRecebimentoSchema = z.object({
  produtoId: z.string().min(1, 'Selecione um produto válido'),
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

export const notaFiscalPreRecebimentoFormSchema = z.object({
  numeroNf: z.string().min(1, 'Informe o número da NF'),
  serie: z.string().optional(),
  chaveAcesso: z.string().optional(),
  numeroRemessa: z.string().optional(),
  fornecedorNome: z.string().optional(),
  fornecedorDocumento: z.string().optional(),
  pesoTotal: z.string().optional(),
  volumeTotal: z.string().optional(),
  observacao: z.string().optional(),
});

export type NotaFiscalPreRecebimentoFormValues = z.infer<
  typeof notaFiscalPreRecebimentoFormSchema
>;

export const recebimentoCadastroFormSchema = z.object({
  transportadoraNome: z.string().optional(),
  placa: z.string().optional(),
  numeroOcr: z.string().optional(),
  numeroTransporte: z.string().optional(),
  origemDados: z.enum(['manual', 'xlsx', 'xml', 'ocr']),
  horarioPrevisto: z.string().min(1, 'Informe o horário previsto'),
  observacao: z.string().optional(),
  quantidadePaletesEsperada: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === '') {
        return undefined;
      }

      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
    }),
  itens: z
    .array(itemPreRecebimentoSchema)
    .min(1, 'Adicione pelo menos 1 item'),
  notasFiscais: z.array(notaFiscalPreRecebimentoFormSchema).optional(),
});

export type RecebimentoCadastroFormInput = z.input<
  typeof recebimentoCadastroFormSchema
>;
export type RecebimentoCadastroFormValues = z.output<
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

export const EMPTY_NOTA_FISCAL_PRE_RECEBIMENTO: NotaFiscalPreRecebimentoFormValues =
  {
    numeroNf: '',
    serie: '',
    chaveAcesso: '',
    numeroRemessa: '',
    fornecedorNome: '',
    fornecedorDocumento: '',
    pesoTotal: undefined,
    volumeTotal: undefined,
    observacao: '',
  };
