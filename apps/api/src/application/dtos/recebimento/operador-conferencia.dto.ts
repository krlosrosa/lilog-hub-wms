import { createZodDto } from 'nestjs-zod';

import { z } from 'zod';



import { ModoUnitizacaoSchema } from '../../../domain/model/recebimento/recebimento.model.js';
import {

  PreRecebimentoSituacaoSchema,

  RecebimentoSituacaoSchema,

} from '../../../domain/model/recebimento/recebimento.model.js';



export const ProdutoConferenciaConfigSchema = z.object({

  controlaLote: z.boolean(),

  controlaValidade: z.boolean(),

  controlaPeso: z.boolean(),

  pesoVariavel: z.boolean(),

  exigirEtiquetaPesoVariavel: z.boolean(),

  controlaNumeroSerie: z.boolean(),

});



export const OperadorDemandaSchema = z.object({

  preRecebimentoId: z.uuid(),

  recebimentoId: z.uuid().nullable(),

  unidadeId: z.string(),

  placa: z.string().nullable(),
  transportadoraNome: z.string().nullable(),

  situacao: PreRecebimentoSituacaoSchema,

  dock: z.string().nullable(),

  skuCount: z.number().int(),

  horarioPrevisto: z.iso.datetime(),

  conferenteId: z.number().int().nullable().optional(),

  conferente: z.string().nullable().optional(),

  conferenteMatricula: z.string().nullable().optional(),

  atribuidoAMim: z.boolean().optional(),

  alocacaoFuncionarioId: z.number().int().nullable().optional(),

});



export class OperadorDemandaDto extends createZodDto(OperadorDemandaSchema) {}



export const ListOperadorDemandasResponseSchema = z.object({

  items: z.array(OperadorDemandaSchema),

});



export class ListOperadorDemandasResponseDto extends createZodDto(

  ListOperadorDemandasResponseSchema,

) {}



export const ConferenciaItemBlindSchema = z.object({

  produtoId: z.string().min(1).max(50),

  sku: z.string(),

  descricao: z.string(),

  unidadeMedida: z.string(),

  unidadesPorCaixa: z.number().int().positive(),

  quantidadeEsperada: z.number(),

  config: ProdutoConferenciaConfigSchema,

});



export const ConferenciaConferidoSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().min(1).max(50),
  sku: z.string(),
  descricao: z.string(),
  unidadesPorCaixa: z.number().int().positive(),
  config: ProdutoConferenciaConfigSchema,
  quantidadeRecebida: z.number(),
  unidadeMedida: z.string(),
  loteRecebido: z.string().nullable(),
  validade: z.iso.datetime().nullable(),
  pesoRecebido: z.number().nullable(),
  etiquetaCodigo: z.string().nullable(),
  pesagemId: z.uuid().nullable(),
  recebimentoItemId: z.uuid(),
  unitizadorCodigo: z.string().nullable(),
  unitizadorId: z.uuid().nullable(),
});

export const ResumoConferidoProdutoSchema = z.object({
  produtoId: z.string().min(1).max(50),
  qtdContabil: z.number(),
  qtdFisica: z.number(),
  pesoTotal: z.number().nullable(),
  hasDivergencia: z.boolean(),
});

export const ConferenciaContextResponseSchema = z.object({
  preRecebimentoId: z.uuid(),
  recebimentoId: z.uuid().nullable(),
  unidadeId: z.string(),
  placa: z.string().nullable(),
  transportadoraNome: z.string().nullable(),
  situacao: PreRecebimentoSituacaoSchema,
  recebimentoSituacao: RecebimentoSituacaoSchema.nullable(),
  dock: z.string().nullable(),
  checklistPreenchido: z.boolean(),
  conferenteId: z.number().int().nullable().optional(),
  conferente: z.string().nullable().optional(),
  conferenteMatricula: z.string().nullable().optional(),
  modoUnitizacao: ModoUnitizacaoSchema.or(z.string()),
  exigePaleteConferencia: z.boolean(),
  itens: z.array(ConferenciaItemBlindSchema),
  conferidos: z.array(ConferenciaConferidoSchema),
  resumoConferido: z.array(ResumoConferidoProdutoSchema),
});



export class ConferenciaContextResponseDto extends createZodDto(

  ConferenciaContextResponseSchema,

) {}


