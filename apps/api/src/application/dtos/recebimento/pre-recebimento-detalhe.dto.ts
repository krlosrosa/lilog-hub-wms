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

const ItemEsperadoDetalheSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().min(1).max(50),
  quantidadeEsperada: z.number(),
  unidadeMedida: z.string(),
  loteEsperado: z.string().nullable(),
  pesoEsperado: z.number().nullable(),
  validadeEsperada: z.iso.datetime().nullable().or(z.string().nullable()),
  unidadesPorCaixa: z.number(),
});

const ItemRecebidoDetalheSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().min(1).max(50),
  quantidadeRecebida: z.number(),
  unidadeMedida: z.string(),
  loteRecebido: z.string().nullable(),
  pesoRecebido: z.number().nullable(),
  validade: z.iso.datetime().nullable().or(z.string().nullable()),
  numeroSerie: z.string().nullable(),
  unitizadorId: z.uuid().nullable(),
  unitizadorCodigo: z.string().nullable(),
});

const DivergenciaDetalheSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().min(1).max(50).nullable(),
  tipoDivergencia: TipoDivergenciaSchema.or(z.string()),
  quantidadeEsperada: z.number().nullable(),
  quantidadeRecebida: z.number().nullable(),
  descricao: z.string().nullable(),
});

const AvariaDetalheSchema = z.object({
  id: z.uuid(),
  recebimentoId: z.uuid(),
  produtoId: z.string().min(1).max(50).nullable(),
  tipo: z.string(),
  natureza: z.string(),
  causa: z.string(),
  quantidadeCaixas: z.number().int(),
  quantidadeUnidades: z.number().int(),
  lote: z.string().nullable(),
  photoCount: z.number().int(),
  replicado: z.boolean(),
  createdAt: z.iso.datetime().or(z.string()),
});

const ProdutoDetalheSchema = z.object({
  produtoId: z.string().min(1).max(50),
  sku: z.string(),
  descricao: z.string(),
  ean: z.string().nullable(),
  unidadesPorCaixa: z.number(),
});

export const PreRecebimentoDetalheResponseSchema = z.object({
  preRecebimento: z.object({
    id: z.uuid(),
    unidadeId: z.string(),
    transportadoraNome: z.string().nullable(),
    placa: z.string().nullable(),
    motoristaNome: z.string().nullable(),
    motoristaTelefone: z.string().nullable(),
    grauPrioridade: GrauPrioridadePreRecebimentoSchema.nullable().or(
      z.string().nullable(),
    ),
    numeroOcr: z.string().nullable(),
    numeroTransporte: z.string().nullable(),
    origemDados: OrigemDadosPreRecebimentoSchema.or(z.string()),
    horarioPrevisto: z.iso.datetime(),
    observacao: z.string().nullable(),
    situacao: PreRecebimentoSituacaoSchema,
    dataChegada: z.iso.datetime().nullable(),
    docaId: z.uuid().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    itens: z.array(ItemEsperadoDetalheSchema),
  }),
  recebimento: z
    .object({
      id: z.uuid(),
      preRecebimentoId: z.uuid(),
      docaId: z.uuid().nullable(),
      responsavelId: z.number().int(),
      dataInicio: z.iso.datetime(),
      dataFim: z.iso.datetime().nullable(),
      situacao: RecebimentoSituacaoSchema,
      modoUnitizacao: ModoUnitizacaoSchema.or(z.string()),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
      itens: z.array(ItemRecebidoDetalheSchema),
      divergencias: z.array(DivergenciaDetalheSchema),
    })
    .nullable(),
  checklist: z
    .object({
      id: z.uuid(),
      recebimentoId: z.uuid(),
      lacre: z.string().nullable(),
      tempBau: z.number().nullable(),
      tempProduto: z.number().nullable(),
      conditions: z.object({
        limpeza: z.boolean(),
        odor: z.boolean(),
        estrutura: z.boolean(),
        vedacao: z.boolean(),
      }),
      observacoes: z.string().nullable(),
      photoCount: z.number().int(),
      createdAt: z.iso.datetime(),
    })
    .nullable(),
  avarias: z.array(AvariaDetalheSchema),
  produtos: z.array(ProdutoDetalheSchema),
  numDivergencias: z.number().int(),
});

export class PreRecebimentoDetalheResponseDto extends createZodDto(
  PreRecebimentoDetalheResponseSchema,
) {}
