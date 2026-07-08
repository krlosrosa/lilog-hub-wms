import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DemandaDevolucaoStatusSchema,
  DevolucaoNotaFiscalTipoSchema,
} from './listar-demandas-devolucao.dto.js';

export const BuscarDemandaDevolucaoQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class BuscarDemandaDevolucaoQueryDto extends createZodDto(
  BuscarDemandaDevolucaoQuerySchema,
) {}

export const DevolucaoItemCondicaoSchema = z.enum([
  'integro',
  'avariado',
  'vencido',
  'violado',
  'nao_identificado',
]);

export const DevolucaoItemDetalheSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().nullable(),
  sku: z.string(),
  descricaoProduto: z.string().nullable(),
  lote: z.string().nullable(),
  dataFabricacao: z.string().nullable(),
  quantidade: z.number(),
  qtdConferida: z.number().nullable(),
  unidadeMedida: z.string(),
  quantidadeNormalizadaUnidades: z.number(),
  pesoDevolvido: z.number().nullable(),
  motivoItem: z.string().nullable(),
  condicao: DevolucaoItemCondicaoSchema,
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  pesoVariavel: z.boolean(),
});

export const DevolucaoNotaFiscalDetalheSchema = z.object({
  id: z.uuid(),
  numeroNf: z.string(),
  chaveAcesso: z.string().nullable(),
  tipo: DevolucaoNotaFiscalTipoSchema,
  motivo: z.string(),
  cliente: z.string().nullable(),
  codCliente: z.string().nullable(),
  transporteId: z.string().nullable(),
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  itens: z.array(DevolucaoItemDetalheSchema),
});

export const DevolucaoEventoDetalheSchema = z.object({
  id: z.uuid(),
  statusAnterior: DemandaDevolucaoStatusSchema.nullable(),
  statusNovo: DemandaDevolucaoStatusSchema,
  descricao: z.string().nullable(),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
});

export const DevolucaoChecklistDetalheSchema = z.object({
  id: z.uuid(),
  dock: z.string(),
  paletesRecebidos: z.number().int().nonnegative(),
  tempBau: z.number().nullable(),
  tempProduto: z.number().nullable(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().nullable(),
  photoCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const BuscarDemandaDevolucaoResponseSchema = z.object({
  id: z.uuid(),
  codigoDemanda: z.string(),
  status: DemandaDevolucaoStatusSchema,
  observacao: z.string().nullable(),
  placa: z.string().nullable(),
  doca: z.string().nullable(),
  cargaSegregada: z.boolean(),
  paletesEsperados: z.number().int().nonnegative().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  concluidaAt: z.iso.datetime().nullable(),
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
  transporteId: z.string().nullable(),
  cliente: z.string().nullable(),
  tiposNf: z.array(DevolucaoNotaFiscalTipoSchema),
  notasFiscais: z.array(DevolucaoNotaFiscalDetalheSchema),
  eventos: z.array(DevolucaoEventoDetalheSchema),
  checklist: DevolucaoChecklistDetalheSchema.nullable(),
});

export class BuscarDemandaDevolucaoResponseDto extends createZodDto(
  BuscarDemandaDevolucaoResponseSchema,
) {}

export const DeletarDemandaDevolucaoQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class DeletarDemandaDevolucaoQueryDto extends createZodDto(
  DeletarDemandaDevolucaoQuerySchema,
) {}

export const DeletarDemandaDevolucaoResponseSchema = z.object({
  id: z.uuid(),
  codigoDemanda: z.string(),
});

export class DeletarDemandaDevolucaoResponseDto extends createZodDto(
  DeletarDemandaDevolucaoResponseSchema,
) {}

export const ListarAvariasDemandaQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class ListarAvariasDemandaQueryDto extends createZodDto(
  ListarAvariasDemandaQuerySchema,
) {}

export const DevolucaoAvariaDetalheSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  itemId: z.uuid().nullable(),
  itemSku: z.string().nullable(),
  tipo: z.string(),
  natureza: z.string().nullable(),
  causa: z.string().nullable(),
  quantidadeCaixa: z.number().int().nonnegative(),
  quantidadeUnidade: z.number().int().nonnegative(),
  skusAfetados: z.array(z.string()).nullable(),
  observacao: z.string().nullable(),
  photoUrls: z.array(z.string()),
  createdAt: z.iso.datetime(),
});

export const ListarAvariasDetalheResponseSchema = z.object({
  avarias: z.array(DevolucaoAvariaDetalheSchema),
});

export class ListarAvariasDetalheResponseDto extends createZodDto(
  ListarAvariasDetalheResponseSchema,
) {}
