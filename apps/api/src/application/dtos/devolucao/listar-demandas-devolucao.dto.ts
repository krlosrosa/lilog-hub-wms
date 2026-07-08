import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DemandaDevolucaoStatusSchema = z.enum([
  'rascunho',
  'aberta',
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
  'cancelada',
]);

export const DevolucaoNotaFiscalTipoSchema = z.enum([
  'reentrega',
  'devolucao_parcial',
  'devolucao_total',
]);

export const ListarDemandasDevolucaoQuerySchema = z.object({
  unidadeId: z.string().min(1),
  status: DemandaDevolucaoStatusSchema.optional(),
  semGrupo: z.coerce.boolean().optional(),
});

export class ListarDemandasDevolucaoQueryDto extends createZodDto(
  ListarDemandasDevolucaoQuerySchema,
) {}

export const DemandaDevolucaoListItemSchema = z.object({
  id: z.uuid(),
  codigoDemanda: z.string(),
  status: DemandaDevolucaoStatusSchema,
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  concluidaAt: z.iso.datetime().nullable(),
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
  transporteId: z.string().nullable(),
  placa: z.string().nullable(),
  cliente: z.string().nullable(),
  tiposNf: z.array(DevolucaoNotaFiscalTipoSchema),
  doca: z.string().nullable(),
  cargaSegregada: z.boolean(),
  paletesEsperados: z.number().int().nonnegative().nullable(),
  grupoDescargaId: z.uuid().nullable(),
  codigoGrupo: z.string().nullable(),
});

export const DevolucaoGestaoStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  rascunho: z.number().int().nonnegative(),
  aberta: z.number().int().nonnegative(),
  emAnalise: z.number().int().nonnegative(),
  emExecucao: z.number().int().nonnegative(),
  conferida: z.number().int().nonnegative(),
  concluida: z.number().int().nonnegative(),
  cancelada: z.number().int().nonnegative(),
});

export const ListarDemandasDevolucaoResponseSchema = z.object({
  demandas: z.array(DemandaDevolucaoListItemSchema),
  stats: DevolucaoGestaoStatsSchema,
});

export class ListarDemandasDevolucaoResponseDto extends createZodDto(
  ListarDemandasDevolucaoResponseSchema,
) {}

export const AtualizarStatusDemandaDevolucaoQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class AtualizarStatusDemandaDevolucaoQueryDto extends createZodDto(
  AtualizarStatusDemandaDevolucaoQuerySchema,
) {}

export const AtualizarStatusDemandaDevolucaoResponseSchema = z.object({
  id: z.uuid(),
  codigoDemanda: z.string(),
  status: DemandaDevolucaoStatusSchema,
  statusAnterior: DemandaDevolucaoStatusSchema,
  updatedAt: z.iso.datetime(),
  concluidaAt: z.iso.datetime().nullable(),
});

export class AtualizarStatusDemandaDevolucaoResponseDto extends createZodDto(
  AtualizarStatusDemandaDevolucaoResponseSchema,
) {}
