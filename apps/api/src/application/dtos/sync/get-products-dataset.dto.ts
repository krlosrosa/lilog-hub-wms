import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetProductsDatasetQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export class GetProductsDatasetQueryDto extends createZodDto(
  GetProductsDatasetQuerySchema,
) {}

export const ProductDatasetItemSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  empresa: z.string(),
  categoria: z.string(),
  tipo: z.string(),
  ean: z.string().nullable(),
  dum: z.string().nullable(),
  shelfLife: z.number().int().nullable(),
  pesoBrutoUnidade: z.string().nullable(),
  pesoBrutoCaixa: z.string().nullable(),
  pesoBrutoPalete: z.string().nullable(),
  pesoLiquidoUnidade: z.string().nullable(),
  pesoLiquidoCaixa: z.string().nullable(),
  pesoLiquidoPalete: z.string().nullable(),
  unidadesPorCaixa: z.number().int().nullable(),
  caixasPorPalete: z.number().int().nullable(),
  updatedAt: z.string(),
  tombstone: z.boolean().default(false),
});

export const GetProductsDatasetResponseSchema = z.object({
  items: z.array(ProductDatasetItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  totalCount: z.number().int().nonnegative().optional(),
});

export class GetProductsDatasetResponseDto extends createZodDto(
  GetProductsDatasetResponseSchema,
) {}
