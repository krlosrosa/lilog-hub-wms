import { z } from 'zod';

/** Campo opcional: vazio permite; quando preenchido, inteiro > 0. */
function optionalPositiveIntegerString(fieldLabel: string) {
  return z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      const v = typeof val === 'string' ? val.trim() : '';
      if (!v) {
        return;
      }

      if (!/^\d+$/.test(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldLabel}: use apenas dígitos`,
        });

        return;
      }

      if (parseInt(v, 10) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldLabel}: deve ser maior que zero`,
        });
      }
    });
}

export const EMPRESA_OPTIONS = [
  { value: 'ITB', label: 'ITB - Itambé' },
  { value: 'DPA', label: 'DPA - DPA' },
  { value: 'LDB', label: 'LDB - Lactalis' },
] as const;

export const CATEGORIA_OPTIONS = [
  { value: 'seco', label: 'Seco' },
  { value: 'refrigerado', label: 'Refrigerado' },
  { value: 'queijo', label: 'Queijo' },
] as const;

export const TIPO_PRODUTO_VALUES = ['PVAR', 'PPAR', 'PPAD'] as const;

export type TipoProduto = (typeof TIPO_PRODUTO_VALUES)[number];

export const produtoFormSchema = z.object({
  produtoId: z.string().min(1, 'Informe o ID do produto'),
  sku: z.string().min(1, 'Informe o SKU'),
  descricao: z.string().min(1, 'Informe o nome ou descrição do produto'),
  empresa: z.string().min(1, 'Selecione a unidade'),
  categoria: z.string().min(1, 'Selecione a categoria'),
  shelfLife: optionalPositiveIntegerString('Shelf Life (dias)'),
  ean: z.string().optional(),
  dum: z.string().optional(),
  tipo: z.enum(TIPO_PRODUTO_VALUES),
  pesoBrutoUnidade: z.string().optional(),
  pesoBrutoCaixa: z.string().optional(),
  pesoBrutoPalete: z.string().optional(),
  unidadesPorCaixa: optionalPositiveIntegerString('Unidades por Caixa'),
  caixasPorPalete: optionalPositiveIntegerString('Caixas por Palete'),
});

export type ProdutoFormValues = z.infer<typeof produtoFormSchema>;
