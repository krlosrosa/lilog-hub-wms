import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DevolucaoItemCondicaoSchema } from './buscar-demanda-devolucao.dto.js';
import { DemandaDevolucaoStatusSchema } from './listar-demandas-devolucao.dto.js';

export const ConferenciaDemandaStatusSchema = z.enum([
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
]);

export const RegistrarConferenciaItemBodySchema = z.object({
  itemId: z.uuid(),
  condicao: DevolucaoItemCondicaoSchema.optional(),
  qtdConferida: z.number().nonnegative(),
  lote: z.string().max(100).nullable().optional(),
  dataFabricacao: z.string().date().nullable().optional(),
  observacao: z.string().max(2000).nullable().optional(),
});

export const RegistrarConferenciaItensBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  status: ConferenciaDemandaStatusSchema.optional(),
  itens: z.array(RegistrarConferenciaItemBodySchema).optional(),
});

export class RegistrarConferenciaItensBodyDto extends createZodDto(
  RegistrarConferenciaItensBodySchema,
) {}

export const RegistrarConferenciaItensResponseSchema = z.object({
  demandaId: z.uuid(),
  itensAtualizados: z.number().int().nonnegative(),
  status: DemandaDevolucaoStatusSchema.optional(),
});

export class RegistrarConferenciaItensResponseDto extends createZodDto(
  RegistrarConferenciaItensResponseSchema,
) {}

export const RegistrarAvariaDevolucaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  itemId: z.uuid().nullable().optional(),
  tipo: z.string().min(1).max(50),
  natureza: z.string().max(50).nullable().optional(),
  causa: z.string().max(50).nullable().optional(),
  quantidadeCaixa: z.number().int().nonnegative().nullable().optional(),
  quantidadeUnidade: z.number().int().nonnegative().nullable().optional(),
  observacao: z.string().max(2000).nullable().optional(),
  photoUrls: z.array(z.string()).optional(),
  replicarSkus: z.array(z.string().max(50)).optional(),
});

export class RegistrarAvariaDevolucaoBodyDto extends createZodDto(
  RegistrarAvariaDevolucaoBodySchema,
) {}

export const RegistrarAvariaDevolucaoResponseSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  itemId: z.uuid().nullable(),
  itensAfetados: z.number().int().nonnegative(),
});

export class RegistrarAvariaDevolucaoResponseDto extends createZodDto(
  RegistrarAvariaDevolucaoResponseSchema,
) {}
