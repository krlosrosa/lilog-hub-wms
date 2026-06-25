import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CorteStatusSchema } from '../../../domain/model/corte-operacional/corte-operacional.model.js';

export const CorteItemResponseSchema = z.object({
  id: z.uuid(),
  mapaGrupoItemId: z.uuid(),
  sku: z.string(),
  descricao: z.string().nullable(),
  remessa: z.string(),
  cliente: z.string(),
  lote: z.string().nullable(),
  quantidadeMapa: z.number(),
  quantidadeCorte: z.number(),
  unidadeMedida: z.string(),
  pesoKg: z.number().nullable(),
});

export class CorteItemResponseDto extends createZodDto(CorteItemResponseSchema) {}

export const CorteResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  codigo: z.string(),
  mapaGrupoId: z.uuid(),
  mapaGrupoMicroUuid: z.string(),
  mapaGrupoTitulo: z.string(),
  transporteId: z.uuid(),
  rota: z.string(),
  doca: z.string().nullable(),
  status: CorteStatusSchema,
  motivo: z.string().nullable(),
  observacao: z.string().nullable(),
  totalVolumes: z.number().int().nullable(),
  pesoTotalKg: z.number().nullable(),
  solicitadoPor: z.number().int(),
  solicitadoPorNome: z.string().nullable(),
  solicitadoEm: z.iso.datetime(),
  realizadoPor: z.number().int().nullable(),
  realizadoPorNome: z.string().nullable(),
  realizadoEm: z.iso.datetime().nullable(),
  canceladoPor: z.number().int().nullable(),
  canceladoPorNome: z.string().nullable(),
  canceladoEm: z.iso.datetime().nullable(),
  motivoCancelamento: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class CorteResponseDto extends createZodDto(CorteResponseSchema) {}

export const CorteDetalheResponseSchema = CorteResponseSchema.extend({
  itens: z.array(CorteItemResponseSchema),
});

export class CorteDetalheResponseDto extends createZodDto(
  CorteDetalheResponseSchema,
) {}

export const ListCortesQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: CorteStatusSchema.optional(),
  search: z.string().max(120).optional(),
});

export class ListCortesQueryDto extends createZodDto(ListCortesQuerySchema) {}

export const ListCortesResponseSchema = z.object({
  items: z.array(CorteResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListCortesResponseDto extends createZodDto(ListCortesResponseSchema) {}

export const MapaGrupoItemCorteResponseSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  descricao: z.string().nullable(),
  remessa: z.string(),
  cliente: z.string(),
  lote: z.string().nullable(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  peso: z.number().nullable(),
});

export const MapaGrupoCorteResponseSchema = z.object({
  id: z.uuid(),
  microUuid: z.string(),
  titulo: z.string(),
  subtitulo: z.string().nullable(),
  transporteId: z.uuid(),
  transporteRota: z.string(),
  totalItens: z.number().int(),
  pesoTotalKg: z.number(),
  itens: z.array(MapaGrupoItemCorteResponseSchema),
});

export class MapaGrupoCorteResponseDto extends createZodDto(
  MapaGrupoCorteResponseSchema,
) {}

export const CorteIdParamSchema = z.object({
  id: z.uuid(),
});

export class CorteIdParamDto extends createZodDto(CorteIdParamSchema) {}

export const MapaGrupoCodigoParamSchema = z.object({
  codigo: z.string().min(1).max(120),
});

export class MapaGrupoCodigoParamDto extends createZodDto(
  MapaGrupoCodigoParamSchema,
) {}

export const MapaGrupoCodigoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class MapaGrupoCodigoQueryDto extends createZodDto(
  MapaGrupoCodigoQuerySchema,
) {}
