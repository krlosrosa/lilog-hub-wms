import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import type { CncOpcoesImpressao } from '../../../../../../domain/model/cnc/cnc.model.js';
import { funcionarios, users } from './auth.schema.js';
import { unidades } from './master-data.schema.js';

export const cncPgSchema = pgSchema('cnc');

export const cncOrigemEnum = pgEnum('cnc_origem_type', ['recebimento']);

export const cncResponsavelEnum = pgEnum('cnc_responsavel_type', [
  'transportadora',
  'fornecedor',
  'fabrica',
  'operacao',
  'indeterminado',
]);

export const cncSituacaoEnum = pgEnum('cnc_situacao_type', [
  'pendente',
  'em_analise',
  'encerrada',
  'cancelada',
]);

export const cncItemTipoEnum = pgEnum('cnc_item_tipo_type', [
  'divergencia',
  'avaria',
]);

export const cncSubtipoOcorrenciaEnum = pgEnum('cnc_subtipo_ocorrencia_type', [
  'falta',
  'sobra',
  'avaria',
  'lote_divergente',
  'peso_divergente',
  'validade_divergente',
  'produto_nao_previsto',
]);

export const naoConformidades = cncPgSchema.table('nao_conformidades', {
  id: uuid('id').defaultRandom().primaryKey(),
  numero: varchar('numero', { length: 30 }).notNull().unique(),
  origem: cncOrigemEnum('origem').notNull(),
  origemId: uuid('origem_id').notNull(),
  unidadeId: varchar('unidade_id', { length: 50 })
    .notNull()
    .references(() => unidades.id, { onDelete: 'restrict' }),
  responsavel: cncResponsavelEnum('responsavel')
    .notNull()
    .default('indeterminado'),
  responsavelId: varchar('responsavel_id', { length: 50 }),
  descricao: text('descricao'),
  observacao: text('observacao'),
  situacao: cncSituacaoEnum('situacao').notNull().default('pendente'),
  solicitanteId: integer('solicitante_id')
    .notNull()
    .references(() => funcionarios.id, { onDelete: 'restrict' }),
  analistaId: integer('analista_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  iniciadoEm: timestamp('iniciado_em', { withTimezone: true }),
  encerradoEm: timestamp('encerrado_em', { withTimezone: true }),
  encerradoPorUserId: integer('encerrado_por_user_id').references(
    () => users.id,
    { onDelete: 'set null' },
  ),
  valorDebito: numeric('valor_debito', { precision: 12, scale: 2 }),
  opcoesImpressao: jsonb('opcoes_impressao').$type<CncOpcoesImpressao>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cncItens = cncPgSchema.table('cnc_itens', {
  id: uuid('id').defaultRandom().primaryKey(),
  cncId: uuid('cnc_id')
    .notNull()
    .references(() => naoConformidades.id, { onDelete: 'cascade' }),
  tipo: cncItemTipoEnum('tipo').notNull(),
  referenciaId: uuid('referencia_id').notNull(),
  produtoId: varchar('produto_id', { length: 50 }),
  sku: varchar('sku', { length: 100 }),
  descricaoProduto: text('descricao_produto'),
  subtipoOcorrencia: cncSubtipoOcorrenciaEnum('subtipo_ocorrencia'),
  quantidadeEsperada: numeric('quantidade_esperada', {
    precision: 12,
    scale: 3,
  }),
  quantidadeRecebida: numeric('quantidade_recebida', {
    precision: 12,
    scale: 3,
  }),
  quantidadeDivergente: numeric('quantidade_divergente', {
    precision: 12,
    scale: 3,
  }),
  quantidadeCaixas: integer('quantidade_caixas'),
  quantidadeUnidades: integer('quantidade_unidades'),
  unidadeMedida: varchar('unidade_medida', { length: 20 }),
  loteEsperado: varchar('lote_esperado', { length: 100 }),
  loteRecebido: varchar('lote_recebido', { length: 100 }),
  validadeEsperada: timestamp('validade_esperada', { withTimezone: true }),
  validadeRecebida: timestamp('validade_recebida', { withTimezone: true }),
  pesoEsperado: numeric('peso_esperado', { precision: 12, scale: 3 }),
  pesoRecebido: numeric('peso_recebido', { precision: 12, scale: 3 }),
  naturezaAvaria: varchar('natureza_avaria', { length: 50 }),
  causaAvaria: varchar('causa_avaria', { length: 50 }),
  tipoAvaria: varchar('tipo_avaria', { length: 50 }),
  shelfLifeDias: integer('shelf_life_dias'),
  descricaoDetalhe: text('descricao_detalhe'),
  responsavelSugerido: cncResponsavelEnum('responsavel_sugerido'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cncEventos = cncPgSchema.table(
  'cnc_eventos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cncId: uuid('cnc_id')
      .notNull()
      .references(() => naoConformidades.id, { onDelete: 'cascade' }),
    tipoEvento: varchar('tipo_evento', { length: 80 }).notNull(),
    situacaoAnterior: varchar('situacao_anterior', { length: 50 }),
    situacaoNova: varchar('situacao_nova', { length: 50 }),
    descricao: text('descricao'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('cnc_eventos_cnc_id_idx').on(table.cncId)],
);

export const cncTratativas = cncPgSchema.table(
  'cnc_tratativas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cncId: uuid('cnc_id')
      .notNull()
      .references(() => naoConformidades.id, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 50 }).notNull(),
    descricao: text('descricao').notNull(),
    responsavelTipo: varchar('responsavel_tipo', { length: 50 }).notNull(),
    prazo: timestamp('prazo', { withTimezone: true }),
    concluidaEm: timestamp('concluida_em', { withTimezone: true }),
    concluidaPorUserId: integer('concluida_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    status: varchar('status', { length: 30 }).notNull().default('pendente'),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('cnc_tratativas_cnc_id_idx').on(table.cncId)],
);
