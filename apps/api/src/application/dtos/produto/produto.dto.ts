import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  CategoriaProdutoSchema,
  EmpresaProdutoSchema,
  TipoProdutoSchema,
} from '../../../domain/model/produto/produto.model.js';

export const ListProdutosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoria: CategoriaProdutoSchema.optional(),
  search: z.string().optional(),
  empresa: EmpresaProdutoSchema.optional(),
  tipo: TipoProdutoSchema.optional(),
  ean: z.enum(['com', 'sem']).optional(),
  dum: z.enum(['com', 'sem']).optional(),
});

export class ListProdutosQueryDto extends createZodDto(ListProdutosQuerySchema) {}

export const ProdutoResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  empresa: EmpresaProdutoSchema,
  categoria: CategoriaProdutoSchema,
  tipo: TipoProdutoSchema,
  ean: z.string().nullable().optional(),
  dum: z.string().nullable().optional(),
  shelfLife: z.number().int().nullable().optional(),
  pesoBrutoUnidade: z.string().nullable().optional(),
  pesoBrutoCaixa: z.string().nullable().optional(),
  pesoBrutoPalete: z.string().nullable().optional(),
  pesoLiquidoUnidade: z.string().nullable().optional(),
  pesoLiquidoCaixa: z.string().nullable().optional(),
  pesoLiquidoPalete: z.string().nullable().optional(),
  unidadesPorCaixa: z.number().int().nullable().optional(),
  caixasPorPalete: z.number().int().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class ProdutoResponseDto extends createZodDto(ProdutoResponseSchema) {}

export const ListProdutosResponseSchema = z.object({
  items: z.array(ProdutoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListProdutosResponseDto extends createZodDto(
  ListProdutosResponseSchema,
) {}
