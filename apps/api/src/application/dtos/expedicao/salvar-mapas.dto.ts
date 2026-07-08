import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  GerarMapasConfigSchema,
  GerarMapasResponseSchema,
  TransporteCodigoSchema,
} from './gerar-mapas.dto.js';

export const MapaLoteResumoGrupoSchema = z.object({
  microUuid: z.string(),
  titulo: z.string(),
  totalItens: z.number().int(),
  pesoTotalKg: z.number(),
});

export const MapaLoteResumoTransporteSchema = z.object({
  transporteId: TransporteCodigoSchema,
  rota: z.string(),
  placa: z.string().nullable(),
  mapaGeradoEmAnterior: z.iso.datetime().nullable().optional(),
  totalGrupos: z.number().int(),
  totalItens: z.number().int(),
  pesoTotalKg: z.number(),
  grupos: z.array(MapaLoteResumoGrupoSchema),
});

export const MapaLoteResumoConfigSchema = z.object({
  tipoDadosBasicos: z.enum(['transporte', 'cliente']),
  segregarPaleteFull: z.boolean(),
  segregarUnidade: z.boolean(),
  quebraPaleteAtivo: z.boolean(),
});

export const MapaLoteResumoSchema = z.object({
  totalTransportes: z.number().int(),
  totalGrupos: z.number().int(),
  totalItens: z.number().int(),
  pesoTotalKg: z.number(),
  transportes: z.array(MapaLoteResumoTransporteSchema),
  configResumo: MapaLoteResumoConfigSchema,
});

export const SalvarMapasBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transporteIds: z.array(TransporteCodigoSchema).min(1),
  config: GerarMapasConfigSchema,
  configuracaoImpressaoId: z.string().uuid().optional(),
});

export class SalvarMapasBodyDto extends createZodDto(SalvarMapasBodySchema) {}

export const SalvarMapasResponseSchema = GerarMapasResponseSchema.extend({
  mapaLoteId: z.string().uuid(),
  resumo: MapaLoteResumoSchema,
});

export class SalvarMapasResponseDto extends createZodDto(
  SalvarMapasResponseSchema,
) {}

export const ListarMapasLotesQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transporteIds: z
    .union([TransporteCodigoSchema, z.array(TransporteCodigoSchema)])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .pipe(z.array(TransporteCodigoSchema).min(1)),
});

export class ListarMapasLotesQueryDto extends createZodDto(
  ListarMapasLotesQuerySchema,
) {}

export const MapaLoteListItemSchema = z.object({
  id: z.string().uuid(),
  unidadeId: z.string(),
  resumo: MapaLoteResumoSchema,
  configuracaoImpressaoId: z.string().uuid().nullable(),
  criadoPor: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  transporteIds: z.array(TransporteCodigoSchema),
});

export const ListarMapasLotesResponseSchema = z.object({
  lotes: z.array(MapaLoteListItemSchema),
});

export class ListarMapasLotesResponseDto extends createZodDto(
  ListarMapasLotesResponseSchema,
) {}

export const MapaLoteDetalheSchema = z.object({
  id: z.string().uuid(),
  unidadeId: z.string(),
  config: GerarMapasConfigSchema,
  payload: GerarMapasResponseSchema,
  resumo: MapaLoteResumoSchema,
  configuracaoImpressaoId: z.string().uuid().nullable(),
  templatesHtml: z.unknown().nullable(),
  criadoPor: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
});

export class MapaLoteDetalheDto extends createZodDto(MapaLoteDetalheSchema) {}

export type MapaLoteResumo = z.infer<typeof MapaLoteResumoSchema>;
export type SalvarMapasBodyInput = z.infer<typeof SalvarMapasBodySchema>;
export type SalvarMapasResponse = z.infer<typeof SalvarMapasResponseSchema>;
