import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { BreakdownQuantidadeSchema } from './gerar-mapas.dto.js';

const StatusTransporteResponseSchema = z.enum([
  'PENDENTE',
  'ALOCADO',
  'PARCIAL',
  'EM_SEPARACAO',
  'SEPARADO',
  'EM_CONFERENCIA',
  'CONFERIDO',
  'EM_CARREGAMENTO',
  'CARREGADO',
  'EM_VIAGEM',
  'VIAGEM_FINALIZADA',
]);

const TipoVeiculoResponseSchema = z.enum([
  'VUC',
  'Toco',
  'Truck_3_4',
  'Carreta',
  'Bitrem',
]);

export const RemessaLinhaItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  descricao: z.string().nullable(),
  produtoId: z.string().uuid().nullable(),
  empresa: z.string(),
  categoria: z.string(),
  lote: z.string().nullable(),
  dataFabricacao: z.string().nullable(),
  faixa: z.string().nullable(),
  peso: z.number().nullable(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  quantidadeNormalizadaUnidades: z.number(),
  breakdown: BreakdownQuantidadeSchema,
  unidadesPorCaixa: z.number().int().nullable(),
  caixasPorPalete: z.number().int().nullable(),
  pesoBrutoUnidade: z.string().nullable(),
  pesoBrutoCaixa: z.string().nullable(),
  pesoBrutoPalete: z.string().nullable(),
  pesoLiquidoUnidade: z.string().nullable(),
  pesoLiquidoCaixa: z.string().nullable(),
  pesoLiquidoPalete: z.string().nullable(),
});

export const RemessaTransporteItemSchema = z.object({
  id: z.string().uuid(),
  remessa: z.string(),
  empresa: z.string(),
  codCliente: z.string(),
  cliente: z.string(),
  cidade: z.string(),
  peso: z.number(),
  volume: z.number(),
  origem: z.enum(['upload', 'reentrega']).optional(),
  motivoReentrega: z.string().nullable().optional(),
  itens: z.array(RemessaLinhaItemSchema),
});

export const TransporteItemSchema = z.object({
  id: z.string().uuid(),
  uploadLoteId: z.string().uuid(),
  rota: z.string(),
  regiao: z.string(),
  cidade: z.string(),
  bairro: z.string().nullable(),
  dataTransporte: z.string(),
  horarioExpectativaSaida: z.iso.datetime().nullable(),
  pesoTotal: z.number(),
  volumeTotal: z.number(),
  distanciaKm: z.number().nullable(),
  itinerario: z.string().nullable(),
  perfilEsperado: TipoVeiculoResponseSchema.nullable(),
  status: StatusTransporteResponseSchema,
  placa: z.string().nullable(),
  motorista: z.string().nullable(),
  transportadora: z.string().nullable(),
  perfilPagamentoId: z.uuid().nullable().optional(),
  perfilPagamentoNome: z.string().nullable().optional(),
  custoPrevisto: z.number().nullable(),
  freteSemCusto: z.boolean(),
  reentregaExclusiva: z.boolean(),
  isPrioridade: z.boolean(),
  nivelPrioridade: z
    .enum(['urgente', 'prioritaria', 'normal', 'baixa'])
    .nullable(),
  mapaGeradoEm: z.iso.datetime().nullable(),
  ultimoMapaLoteId: z.uuid().nullable(),
  quantidadeRemessas: z.number().int(),
  remessas: z.array(RemessaTransporteItemSchema),
});

export const ListarTransportesQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class ListarTransportesQueryDto extends createZodDto(
  ListarTransportesQuerySchema,
) {}

export const ListarTransportesResponseSchema = z.object({
  transportes: z.array(TransporteItemSchema),
});

export class ListarTransportesResponseDto extends createZodDto(
  ListarTransportesResponseSchema,
) {}
