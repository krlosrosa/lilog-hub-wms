import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ModoUnitizacaoSchema } from '../../../domain/model/armazenagem/armazenagem.model.js';
import {
  GrauPrioridadePreRecebimentoSchema,
  OrigemDadosPreRecebimentoSchema,
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
  transportadoraNome: z.string().min(1).max(255).optional(),
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
  produtoId: z.string().min(1).max(50),
  quantidadeEsperada: z.number(),
  unidadeMedida: z.string(),
  unidadesPorCaixa: z.number(),
  loteEsperado: z.string().nullable(),
  pesoEsperado: z.number().nullable(),
  validadeEsperada: z.iso.datetime().nullable(),
});

export const NotaFiscalPreRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  numeroNf: z.string(),
  serie: z.string().nullable(),
  chaveAcesso: z.string().nullable(),
  numeroRemessa: z.string().nullable(),
  fornecedorNome: z.string().nullable(),
  fornecedorDocumento: z.string().nullable(),
  pesoTotal: z.number().nullable(),
  volumeTotal: z.number().nullable(),
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const PreRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  transportadoraNome: z.string().nullable(),
  placa: z.string().nullable(),
  motoristaNome: z.string().nullable(),
  motoristaTelefone: z.string().nullable(),
  grauPrioridade: GrauPrioridadePreRecebimentoSchema.nullable(),
  numeroOcr: z.string().nullable(),
  numeroTransporte: z.string().nullable(),
  origemDados: OrigemDadosPreRecebimentoSchema,
  origem: z.string().nullable(),
  horarioPrevisto: z.iso.datetime(),
  observacao: z.string().nullable(),
  quantidadePaletesEsperada: z.number().int().nonnegative().nullable(),
  numeroTermoPalete: z.string().nullable(),
  situacao: PreRecebimentoSituacaoSchema,
  dataChegada: z.iso.datetime().nullable(),
  docaId: z.uuid().nullable(),
  itens: z.array(ItemPreRecebimentoResponseSchema).optional(),
  notasFiscais: z.array(NotaFiscalPreRecebimentoResponseSchema).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class PreRecebimentoResponseDto extends createZodDto(
  PreRecebimentoResponseSchema,
) {}

export const ItemRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().min(1).max(50),
  quantidadeRecebida: z.number(),
  unidadeMedida: z.string(),
  loteRecebido: z.string().nullable(),
  pesoRecebido: z.number().nullable(),
  validade: z.iso.datetime().nullable(),
  numeroSerie: z.string().nullable(),
  unitizadorId: z.uuid().nullable().optional(),
  unitizadorCodigo: z.string().nullable().optional(),
});

export const DivergenciaResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().min(1).max(50).nullable(),
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
  quantidadePaletes: z.number().int().nonnegative().nullable(),
  modoUnitizacao: ModoUnitizacaoSchema.or(z.string()),
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
      transportadoraNome: z.string().nullable(),
      placa: z.string().nullable(),
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
  produtoId: z.string().min(1).max(50),
  quantidadeRecebida: z.number(),
  unidadeMedida: z.string(),
  pesoRecebido: z.number().nullable().optional(),
  etiquetaCodigo: z.string().nullable().optional(),
  pesagemId: z.uuid().nullable().optional(),
});

export class ConferirItemCegoResponseDto extends createZodDto(
  ConferirItemCegoResponseSchema,
) {}
