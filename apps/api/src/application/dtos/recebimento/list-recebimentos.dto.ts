import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  PreRecebimentoSituacaoSchema,
  RecebimentoSituacaoSchema,
  TipoDivergenciaSchema,
} from '../../../domain/model/recebimento/recebimento.model.js';

export const ListRecebimentosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
  situacao: z
    .union([RecebimentoSituacaoSchema, PreRecebimentoSituacaoSchema])
    .optional(),
  transportadoraId: z.string().min(1).max(50).optional(),
  responsavelId: z.coerce.number().int().positive().optional(),
  docaId: z.uuid().optional(),
  dataInicio: z.iso.datetime().optional(),
  dataFim: z.iso.datetime().optional(),
});

export class ListRecebimentosQueryDto extends createZodDto(
  ListRecebimentosQuerySchema,
) {}

export const ItemPreRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.uuid(),
  quantidadeEsperada: z.number(),
  unidadeMedida: z.string(),
  unidadesPorCaixa: z.number(),
  loteEsperado: z.string().nullable(),
  pesoEsperado: z.number().nullable(),
  validadeEsperada: z.iso.datetime().nullable(),
});

export const PreRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  transportadoraId: z.string(),
  placa: z.string(),
  horarioPrevisto: z.iso.datetime(),
  observacao: z.string().nullable(),
  situacao: PreRecebimentoSituacaoSchema,
  dataChegada: z.iso.datetime().nullable(),
  itens: z.array(ItemPreRecebimentoResponseSchema).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class PreRecebimentoResponseDto extends createZodDto(
  PreRecebimentoResponseSchema,
) {}

export const ItemRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.uuid(),
  quantidadeRecebida: z.number(),
  unidadeMedida: z.string(),
  loteRecebido: z.string().nullable(),
  pesoRecebido: z.number().nullable(),
  validade: z.iso.datetime().nullable(),
  numeroSerie: z.string().nullable(),
});

export const DivergenciaResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.uuid().nullable(),
  tipoDivergencia: TipoDivergenciaSchema,
  quantidadeEsperada: z.number().nullable(),
  quantidadeRecebida: z.number().nullable(),
  descricao: z.string().nullable(),
});

export const RecebimentoResponseSchema = z.object({
  id: z.uuid(),
  preRecebimentoId: z.uuid(),
  docaId: z.uuid().nullable(),
  responsavelId: z.number().int(),
  dataInicio: z.iso.datetime(),
  dataFim: z.iso.datetime().nullable(),
  situacao: RecebimentoSituacaoSchema,
  itens: z.array(ItemRecebimentoResponseSchema).optional(),
  divergencias: z.array(DivergenciaResponseSchema).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class RecebimentoResponseDto extends createZodDto(
  RecebimentoResponseSchema,
) {}

export const ListRecebimentosResponseSchema = z.object({
  items: z.array(
    RecebimentoResponseSchema.extend({
      unidadeId: z.string(),
      transportadoraId: z.string(),
      placa: z.string(),
      preRecebimentoSituacao: PreRecebimentoSituacaoSchema,
    }),
  ),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListRecebimentosResponseDto extends createZodDto(
  ListRecebimentosResponseSchema,
) {}

export const ConferirItemCegoResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.uuid(),
  quantidadeRecebida: z.number(),
  unidadeMedida: z.string(),
});

export class ConferirItemCegoResponseDto extends createZodDto(
  ConferirItemCegoResponseSchema,
) {}
