import { createZodDto } from 'nestjs-zod';

import { z } from 'zod';



import {

  PreRecebimentoSituacaoSchema,

  RecebimentoSituacaoSchema,

} from '../../../domain/model/recebimento/recebimento.model.js';



export const ProdutoConferenciaConfigSchema = z.object({

  controlaLote: z.boolean(),

  controlaValidade: z.boolean(),

  controlaPeso: z.boolean(),

  pesoVariavel: z.boolean(),

  controlaNumeroSerie: z.boolean(),

});



export const OperadorDemandaSchema = z.object({

  preRecebimentoId: z.uuid(),

  recebimentoId: z.uuid().nullable(),

  unidadeId: z.string(),

  placa: z.string(),

  transportadoraId: z.string(),

  situacao: PreRecebimentoSituacaoSchema,

  dock: z.string().nullable(),

  skuCount: z.number().int(),

  horarioPrevisto: z.iso.datetime(),

});



export class OperadorDemandaDto extends createZodDto(OperadorDemandaSchema) {}



export const ListOperadorDemandasResponseSchema = z.object({

  items: z.array(OperadorDemandaSchema),

});



export class ListOperadorDemandasResponseDto extends createZodDto(

  ListOperadorDemandasResponseSchema,

) {}



export const ConferenciaItemBlindSchema = z.object({

  produtoId: z.uuid(),

  sku: z.string(),

  descricao: z.string(),

  unidadeMedida: z.string(),

  unidadesPorCaixa: z.number().int().positive(),

  config: ProdutoConferenciaConfigSchema,

});



export const ConferenciaConferidoSchema = z.object({

  id: z.uuid(),

  produtoId: z.uuid(),

  quantidadeRecebida: z.number(),

  unidadeMedida: z.string(),

});



export const ConferenciaContextResponseSchema = z.object({
  preRecebimentoId: z.uuid(),
  recebimentoId: z.uuid().nullable(),
  unidadeId: z.string(),
  placa: z.string(),
  transportadoraId: z.string(),
  situacao: PreRecebimentoSituacaoSchema,
  recebimentoSituacao: RecebimentoSituacaoSchema.nullable(),
  dock: z.string().nullable(),
  checklistPreenchido: z.boolean(),
  itens: z.array(ConferenciaItemBlindSchema),
  conferidos: z.array(ConferenciaConferidoSchema),
});



export class ConferenciaContextResponseDto extends createZodDto(

  ConferenciaContextResponseSchema,

) {}


