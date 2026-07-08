import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DevolucaoItemCondicaoSchema } from './buscar-demanda-devolucao.dto.js';

export const DevolucaoGrupoDescargaStatusSchema = z.enum([
  'rascunho',
  'aguardando_conferencia',
  'em_conferencia',
  'conferida',
  'concluida',
  'cancelada',
]);

export const DevolucaoItemNaoContabilStatusSchema = z.enum([
  'pendente',
  'conciliado',
  'descartado',
  'gerou_ocorrencia',
]);

export const ListarGruposDescargaQuerySchema = z.object({
  unidadeId: z.string().min(1),
  status: DevolucaoGrupoDescargaStatusSchema.optional(),
});

export class ListarGruposDescargaQueryDto extends createZodDto(
  ListarGruposDescargaQuerySchema,
) {}

export const GrupoDescargaListItemSchema = z.object({
  id: z.uuid(),
  codigoGrupo: z.string(),
  placaDescarga: z.string(),
  doca: z.string().nullable(),
  cargaSegregada: z.boolean(),
  paletesEsperados: z.number().int().nonnegative().nullable(),
  observacao: z.string().nullable(),
  status: DevolucaoGrupoDescargaStatusSchema,
  totalDemandas: z.number().int().nonnegative(),
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
});

export const ListarGruposDescargaResponseSchema = z.object({
  grupos: z.array(GrupoDescargaListItemSchema),
});

export class ListarGruposDescargaResponseDto extends createZodDto(
  ListarGruposDescargaResponseSchema,
) {}

export const BuscarGrupoDescargaQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class BuscarGrupoDescargaQueryDto extends createZodDto(
  BuscarGrupoDescargaQuerySchema,
) {}

export const GrupoDescargaDemandaResumoSchema = z.object({
  id: z.uuid(),
  codigoDemanda: z.string(),
  placa: z.string().nullable(),
  status: z.string(),
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
});

export const GrupoDescargaItemEsperadoSchema = z.object({
  itemId: z.uuid(),
  demandaId: z.uuid(),
  codigoDemanda: z.string(),
  notaFiscalId: z.uuid(),
  numeroNf: z.string(),
  sku: z.string(),
  descricaoProduto: z.string().nullable(),
  quantidade: z.number(),
  qtdConferida: z.number().nullable(),
  unidadeMedida: z.string(),
  condicao: DevolucaoItemCondicaoSchema,
  pesoVariavel: z.boolean(),
});

export const GrupoDescargaItemNaoContabilSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  descricaoProduto: z.string().nullable(),
  quantidadeConferida: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  dataFabricacao: z.string().nullable(),
  condicao: DevolucaoItemCondicaoSchema,
  observacao: z.string().nullable(),
  status: DevolucaoItemNaoContabilStatusSchema,
  demandaId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});

export const BuscarGrupoDescargaResponseSchema = z.object({
  id: z.uuid(),
  codigoGrupo: z.string(),
  placaDescarga: z.string(),
  doca: z.string().nullable(),
  cargaSegregada: z.boolean(),
  paletesEsperados: z.number().int().nonnegative().nullable(),
  observacao: z.string().nullable(),
  status: DevolucaoGrupoDescargaStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
  demandas: z.array(GrupoDescargaDemandaResumoSchema),
  itensEsperados: z.array(GrupoDescargaItemEsperadoSchema),
  itensNaoContabeis: z.array(GrupoDescargaItemNaoContabilSchema),
});

export class BuscarGrupoDescargaResponseDto extends createZodDto(
  BuscarGrupoDescargaResponseSchema,
) {}

export const CriarGrupoDescargaResponseSchema = z.object({
  id: z.uuid(),
  codigoGrupo: z.string(),
  status: DevolucaoGrupoDescargaStatusSchema,
  totalDemandas: z.number().int().nonnegative(),
});

export class CriarGrupoDescargaResponseDto extends createZodDto(
  CriarGrupoDescargaResponseSchema,
) {}

export const AtualizarStatusGrupoDescargaResponseSchema = z.object({
  id: z.uuid(),
  codigoGrupo: z.string(),
  status: DevolucaoGrupoDescargaStatusSchema,
  statusAnterior: DevolucaoGrupoDescargaStatusSchema,
  updatedAt: z.iso.datetime(),
});

export class AtualizarStatusGrupoDescargaResponseDto extends createZodDto(
  AtualizarStatusGrupoDescargaResponseSchema,
) {}

export const RegistrarConferenciaGrupoResponseSchema = z.object({
  grupoId: z.uuid(),
  itensAtualizados: z.number().int().nonnegative(),
  itensNaoContabeisRegistrados: z.number().int().nonnegative(),
  status: DevolucaoGrupoDescargaStatusSchema.optional(),
  demandasAtualizadas: z.array(z.uuid()),
});

export class RegistrarConferenciaGrupoResponseDto extends createZodDto(
  RegistrarConferenciaGrupoResponseSchema,
) {}
