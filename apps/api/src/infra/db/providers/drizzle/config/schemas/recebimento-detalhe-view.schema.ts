import {
  boolean,
  integer,
  jsonb,
  numeric,
  timestamp,
  uuid,
  varchar,
  text,
} from 'drizzle-orm/pg-core';

import {
  preRecebimentoSituacaoEnum,
  recebimentoPgSchema,
  recebimentoSituacaoEnum,
} from './recebimento.schema.js';

export type VwPreRecebimentoDetalheItemEsperado = {
  id: string;
  produtoId: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  loteEsperado: string | null;
  pesoEsperado: number | null;
  validadeEsperada: string | null;
  unidadesPorCaixa: number;
};

export type VwPreRecebimentoDetalheItemRecebido = {
  id: string;
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
  loteRecebido: string | null;
  pesoRecebido: number | null;
  validade: string | null;
  numeroSerie: string | null;
  unitizadorId: string | null;
  unitizadorCodigo: string | null;
};

export type VwPreRecebimentoDetalheDivergencia = {
  id: string;
  produtoId: string | null;
  tipoDivergencia: string;
  quantidadeEsperada: number | null;
  quantidadeRecebida: number | null;
  descricao: string | null;
};

export type VwPreRecebimentoDetalheAvaria = {
  id: string;
  recebimentoId: string;
  produtoId: string | null;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  lote: string | null;
  photoCount: number;
  replicado: boolean;
  createdAt: string;
};

export type VwPreRecebimentoDetalheProduto = {
  produtoId: string;
  sku: string;
  descricao: string;
  ean: string | null;
  unidadesPorCaixa: number;
};

export const vwPreRecebimentoDetalhe = recebimentoPgSchema
  .view('vw_pre_recebimento_detalhe', {
    preRecebimentoId: uuid('pre_recebimento_id').notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    transportadoraNome: varchar('transportadora_nome', { length: 255 }),
    placa: varchar('placa', { length: 20 }),
    motoristaNome: varchar('motorista_nome', { length: 255 }),
    motoristaTelefone: varchar('motorista_telefone', { length: 20 }),
    grauPrioridade: varchar('grau_prioridade', { length: 20 }),
    numeroOcr: varchar('numero_ocr', { length: 100 }),
    numeroTransporte: varchar('numero_transporte', { length: 100 }),
    origemDados: varchar('origem_dados', { length: 30 }).notNull(),
    horarioPrevisto: timestamp('horario_previsto', {
      withTimezone: true,
    }).notNull(),
    observacao: text('observacao'),
    preRecebimentoSituacao: preRecebimentoSituacaoEnum(
      'pre_recebimento_situacao',
    ).notNull(),
    dataChegada: timestamp('data_chegada', { withTimezone: true }),
    preRecebimentoDocaId: uuid('pre_recebimento_doca_id'),
    preRecebimentoCreatedAt: timestamp('pre_recebimento_created_at', {
      withTimezone: true,
    }).notNull(),
    preRecebimentoUpdatedAt: timestamp('pre_recebimento_updated_at', {
      withTimezone: true,
    }).notNull(),

    recebimentoId: uuid('recebimento_id'),
    recebimentoSituacao: recebimentoSituacaoEnum('recebimento_situacao'),
    modoUnitizacao: varchar('modo_unitizacao', { length: 50 }),
    recebimentoDataInicio: timestamp('recebimento_data_inicio', {
      withTimezone: true,
    }),
    dataFim: timestamp('data_fim', { withTimezone: true }),
    responsavelId: integer('responsavel_id'),
    recebimentoDocaId: uuid('recebimento_doca_id'),
    recebimentoCreatedAt: timestamp('recebimento_created_at', {
      withTimezone: true,
    }),
    recebimentoUpdatedAt: timestamp('recebimento_updated_at', {
      withTimezone: true,
    }),

    checklistId: uuid('checklist_id'),
    lacre: varchar('lacre', { length: 100 }),
    tempBau: numeric('temp_bau', { precision: 5, scale: 1 }),
    tempProduto: numeric('temp_produto', { precision: 5, scale: 1 }),
    condicaoLimpeza: boolean('condicao_limpeza'),
    condicaoOdor: boolean('condicao_odor'),
    condicaoEstrutura: boolean('condicao_estrutura'),
    condicaoVedacao: boolean('condicao_vedacao'),
    conditions: jsonb('conditions').$type<Record<string, boolean>>(),
    checklistObservacoes: text('checklist_observacoes'),
    checklistPhotoCount: integer('checklist_photo_count'),
    checklistCreatedAt: timestamp('checklist_created_at', {
      withTimezone: true,
    }),

    itensEsperados: jsonb('itens_esperados')
      .$type<VwPreRecebimentoDetalheItemEsperado[]>()
      .notNull(),
    itensRecebidos: jsonb('itens_recebidos')
      .$type<VwPreRecebimentoDetalheItemRecebido[]>()
      .notNull(),
    divergencias: jsonb('divergencias')
      .$type<VwPreRecebimentoDetalheDivergencia[]>()
      .notNull(),
    numDivergencias: integer('num_divergencias').notNull(),
    avarias: jsonb('avarias')
      .$type<VwPreRecebimentoDetalheAvaria[]>()
      .notNull(),
    produtos: jsonb('produtos')
      .$type<VwPreRecebimentoDetalheProduto[]>()
      .notNull(),
  })
  .existing();

export type VwPreRecebimentoDetalheRow =
  typeof vwPreRecebimentoDetalhe.$inferSelect;
