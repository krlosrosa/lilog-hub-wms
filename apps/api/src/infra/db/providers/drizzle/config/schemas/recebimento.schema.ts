import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { funcionarios, users } from './auth.schema.js';
import { produtos, unidades } from './master-data.schema.js';
import { unitizadores } from './armazenagem.schema.js';
import { docas } from './doca.schema.js';

export const recebimentoPgSchema = pgSchema('recebimento');

export const preRecebimentoSituacaoEnum = pgEnum(
  'pre_recebimento_situacao_type',
  [
    'agendado',
    'veiculo_chegou',
    'em_recebimento',
    'aguardando_aprovacao',
    'aprovado',
    'finalizado',
    'cancelado',
  ],
);

export const recebimentoSituacaoEnum = pgEnum('recebimento_situacao_type', [
  'em_recebimento',
  'aguardando_aprovacao',
  'aprovado',
  'finalizado',
  'cancelado',
]);

export const tipoDivergenciaEnum = pgEnum('tipo_divergencia_type', [
  'quantidade_maior',
  'quantidade_menor',
  'produto_nao_esperado',
  'produto_ausente',
  'divergencia_lote',
  'divergencia_peso',
  'divergencia_validade',
]);

export const preRecebimentos = recebimentoPgSchema.table('pre_recebimentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  unidadeId: varchar('unidade_id', { length: 50 })
    .notNull()
    .references(() => unidades.id, { onDelete: 'restrict' }),
  transportadoraId: varchar('transportadora_id', { length: 50 }).notNull(),
  placa: varchar('placa', { length: 20 }).notNull(),
  horarioPrevisto: timestamp('horario_previsto', {
    withTimezone: true,
  }).notNull(),
  observacao: text('observacao'),
  situacao: preRecebimentoSituacaoEnum('situacao')
    .notNull()
    .default('agendado'),
  dataChegada: timestamp('data_chegada', { withTimezone: true }),
  userId: integer('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const itensPreRecebimento = recebimentoPgSchema.table(
  'itens_pre_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    preRecebimentoId: uuid('pre_recebimento_id')
      .notNull()
      .references(() => preRecebimentos.id, { onDelete: 'cascade' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'restrict' }),
    quantidadeEsperada: numeric('quantidade_esperada', {
      precision: 12,
      scale: 3,
    }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    loteEsperado: varchar('lote_esperado', { length: 100 }),
    pesoEsperado: numeric('peso_esperado', { precision: 12, scale: 3 }),
    validadeEsperada: timestamp('validade_esperada', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const recebimentos = recebimentoPgSchema.table('recebimentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  preRecebimentoId: uuid('pre_recebimento_id')
    .notNull()
    .references(() => preRecebimentos.id, { onDelete: 'restrict' }),
  docaId: uuid('doca_id').references(() => docas.id, { onDelete: 'set null' }),
  responsavelId: integer('responsavel_id')
    .notNull()
    .references(() => funcionarios.id, { onDelete: 'restrict' }),
  dataInicio: timestamp('data_inicio', { withTimezone: true }).notNull(),
  dataFim: timestamp('data_fim', { withTimezone: true }),
  situacao: recebimentoSituacaoEnum('situacao')
    .notNull()
    .default('em_recebimento'),
  modoUnitizacao: varchar('modo_unitizacao', { length: 50 })
    .notNull()
    .default('gerar_etiqueta_na_armazenagem'),
  userId: integer('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const itensRecebimento = recebimentoPgSchema.table('itens_recebimento', {
  id: uuid('id').defaultRandom().primaryKey(),
  recebimentoId: uuid('recebimento_id')
    .notNull()
    .references(() => recebimentos.id, { onDelete: 'cascade' }),
  produtoId: uuid('produto_id')
    .notNull()
    .references(() => produtos.id, { onDelete: 'restrict' }),
  quantidadeRecebida: numeric('quantidade_recebida', {
    precision: 12,
    scale: 3,
  }).notNull(),
  unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
  loteRecebido: varchar('lote_recebido', { length: 100 }),
  pesoRecebido: numeric('peso_recebido', { precision: 12, scale: 3 }),
  validade: timestamp('validade', { withTimezone: true }),
  numeroSerie: varchar('numero_serie', { length: 100 }),
  unitizadorId: uuid('unitizador_id').references(() => unitizadores.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const recebimentoAvarias = recebimentoPgSchema.table('recebimento_avarias', {
  id: uuid('id').defaultRandom().primaryKey(),
  recebimentoId: uuid('recebimento_id')
    .notNull()
    .references(() => recebimentos.id, { onDelete: 'cascade' }),
  produtoId: uuid('produto_id').references(() => produtos.id, {
    onDelete: 'set null',
  }),
  tipo: varchar('tipo', { length: 50 }).notNull(),
  natureza: varchar('natureza', { length: 50 }).notNull(),
  causa: varchar('causa', { length: 50 }).notNull(),
  quantidadeCaixas: integer('quantidade_caixas').notNull().default(0),
  quantidadeUnidades: integer('quantidade_unidades').notNull().default(0),
  photoCount: integer('photo_count').notNull().default(0),
  replicado: boolean('replicado').notNull().default(false),
  operatorId: integer('operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const checklistRecebimento = recebimentoPgSchema.table(
  'checklist_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoId: uuid('recebimento_id')
      .notNull()
      .unique()
      .references(() => recebimentos.id, { onDelete: 'cascade' }),
    lacre: varchar('lacre', { length: 100 }),
    tempBau: numeric('temp_bau', { precision: 5, scale: 1 }),
    tempProduto: numeric('temp_produto', { precision: 5, scale: 1 }),
    condicaoLimpeza: boolean('condicao_limpeza').notNull().default(false),
    condicaoOdor: boolean('condicao_odor').notNull().default(false),
    condicaoEstrutura: boolean('condicao_estrutura').notNull().default(false),
    condicaoVedacao: boolean('condicao_vedacao').notNull().default(false),
    observacoes: text('observacoes'),
    photoCount: integer('photo_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const divergenciasRecebimento = recebimentoPgSchema.table(
  'divergencias_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoId: uuid('recebimento_id')
      .notNull()
      .references(() => recebimentos.id, { onDelete: 'cascade' }),
    produtoId: uuid('produto_id').references(() => produtos.id, {
      onDelete: 'set null',
    }),
    tipoDivergencia: tipoDivergenciaEnum('tipo_divergencia').notNull(),
    quantidadeEsperada: numeric('quantidade_esperada', {
      precision: 12,
      scale: 3,
    }),
    quantidadeRecebida: numeric('quantidade_recebida', {
      precision: 12,
      scale: 3,
    }),
    descricao: text('descricao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);
