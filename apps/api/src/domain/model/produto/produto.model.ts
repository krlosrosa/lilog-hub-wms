import { z } from 'zod';

import { EmpresaSchema } from '../unidade/unidade.model.js';

export const CategoriaProdutoSchema = z.enum(['seco', 'refrigerado', 'queijo']);

export type CategoriaProduto = z.infer<typeof CategoriaProdutoSchema>;

export const TipoProdutoSchema = z.enum(['PVAR', 'PPAR', 'PPAD']);
export type TipoProduto = z.infer<typeof TipoProdutoSchema>;

export const EmpresaProdutoSchema = EmpresaSchema;
export type EmpresaProduto = z.infer<typeof EmpresaProdutoSchema>;

export const ProdutoSchema = z.object({
  produtoId: z.string().min(1).max(50),
  sku: z.string().min(1).max(50),
  descricao: z.string().min(1),
  empresa: EmpresaProdutoSchema,
  categoria: CategoriaProdutoSchema,
  grupo: z.string().nullable().optional(),
  tipo: TipoProdutoSchema,
  ean: z.string().nullable().optional(),
  dum: z.string().nullable().optional(),
  shelfLife: z.number().int().positive().nullable().optional(),
  pesoBrutoUnidade: z.string().nullable().optional(),
  pesoBrutoCaixa: z.string().nullable().optional(),
  pesoBrutoPalete: z.string().nullable().optional(),
  pesoLiquidoUnidade: z.string().nullable().optional(),
  pesoLiquidoCaixa: z.string().nullable().optional(),
  pesoLiquidoPalete: z.string().nullable().optional(),
  unidadesPorCaixa: z.number().int().positive().nullable().optional(),
  caixasPorPalete: z.number().int().positive().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Produto = z.infer<typeof ProdutoSchema>;

export const CreateProdutoInputSchema = ProdutoSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type CreateProdutoInput = z.infer<typeof CreateProdutoInputSchema>;

export const UpdateProdutoInputSchema = CreateProdutoInputSchema.partial();

export type UpdateProdutoInput = z.infer<typeof UpdateProdutoInputSchema>;
