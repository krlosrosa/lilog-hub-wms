import { z } from 'zod';

import {
  demandaDevolucaoStatusSchema,
  devolucaoNotaFiscalTipoSchema,
} from '@/features/devolucao/types/devolucao-gestao.schema';

export const devolucaoItemCondicaoSchema = z.enum([
  'integro',
  'avariado',
  'vencido',
  'violado',
  'nao_identificado',
]);

export type DevolucaoItemCondicao = z.infer<typeof devolucaoItemCondicaoSchema>;

export const devolucaoItemDetalheSchema = z.object({
  id: z.string().uuid(),
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
  pesoVariavel: z.boolean(),
  motivoItem: z.string().nullable(),
  condicao: devolucaoItemCondicaoSchema,
  observacao: z.string().nullable(),
  createdAt: z.string(),
});

export type DevolucaoItemDetalhe = z.infer<typeof devolucaoItemDetalheSchema>;

export const devolucaoNotaFiscalDetalheSchema = z.object({
  id: z.string().uuid(),
  numeroNf: z.string(),
  chaveAcesso: z.string().nullable(),
  tipo: devolucaoNotaFiscalTipoSchema,
  motivo: z.string(),
  cliente: z.string().nullable(),
  codCliente: z.string().nullable(),
  transporteId: z.string().nullable(),
  observacao: z.string().nullable(),
  createdAt: z.string(),
  itens: z.array(devolucaoItemDetalheSchema),
});

export type DevolucaoNotaFiscalDetalhe = z.infer<
  typeof devolucaoNotaFiscalDetalheSchema
>;

export const devolucaoEventoDetalheSchema = z.object({
  id: z.string().uuid(),
  statusAnterior: demandaDevolucaoStatusSchema.nullable(),
  statusNovo: demandaDevolucaoStatusSchema,
  descricao: z.string().nullable(),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.string(),
});

export type DevolucaoEventoDetalhe = z.infer<typeof devolucaoEventoDetalheSchema>;

export const devolucaoChecklistDetalheSchema = z.object({
  id: z.string().uuid(),
  dock: z.string(),
  paletesRecebidos: z.number().int().nonnegative(),
  tempBau: z.number().nullable(),
  tempProduto: z.number().nullable(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().nullable(),
  photoCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DevolucaoChecklistDetalhe = z.infer<
  typeof devolucaoChecklistDetalheSchema
>;

export const buscarDemandaDevolucaoResponseSchema = z.object({
  id: z.string().uuid(),
  codigoDemanda: z.string(),
  status: demandaDevolucaoStatusSchema,
  observacao: z.string().nullable(),
  placa: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  concluidaAt: z.string().nullable(),
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
  transporteId: z.string().nullable(),
  cliente: z.string().nullable(),
  tiposNf: z.array(devolucaoNotaFiscalTipoSchema),
  notasFiscais: z.array(devolucaoNotaFiscalDetalheSchema),
  eventos: z.array(devolucaoEventoDetalheSchema),
  checklist: devolucaoChecklistDetalheSchema.nullable(),
});

export type BuscarDemandaDevolucaoResponse = z.infer<
  typeof buscarDemandaDevolucaoResponseSchema
>;

export type DeletarDemandaDevolucaoResponse = {
  id: string;
  codigoDemanda: string;
};

export const devolucaoAvariaDetalheSchema = z.object({
  id: z.string().uuid(),
  demandaId: z.string().uuid(),
  itemId: z.string().uuid().nullable(),
  itemSku: z.string().nullable(),
  tipo: z.string(),
  natureza: z.string().nullable(),
  causa: z.string().nullable(),
  quantidadeCaixa: z.number().int().nonnegative(),
  quantidadeUnidade: z.number().int().nonnegative(),
  skusAfetados: z.array(z.string()).nullable(),
  observacao: z.string().nullable(),
  photoUrls: z.array(z.string()),
  createdAt: z.string(),
});

export type DevolucaoAvariaDetalhe = z.infer<typeof devolucaoAvariaDetalheSchema>;

export type ListarAvariasDevolucaoResponse = {
  avarias: DevolucaoAvariaDetalhe[];
};
