import {
  integer,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { unidades } from './master-data.schema.js';

export const docaPgSchema = pgSchema('doca');

export const docaTipoEnum = pgEnum('doca_tipo_type', [
  'recebimento',
  'expedicao',
  'compartilhada',
]);

export const docaSituacaoEnum = pgEnum('doca_situacao_type', [
  'disponivel',
  'ocupada',
  'reservada',
  'bloqueada',
  'manutencao',
]);

export const operacaoDocaTipoEnum = pgEnum('operacao_doca_tipo_type', [
  'recebimento',
  'expedicao',
  'transferencia',
  'cross_docking',
  'devolucao',
]);

export const operacaoDocaSituacaoEnum = pgEnum('operacao_doca_situacao_type', [
  'agendada',
  'aguardando_veiculo',
  'em_execucao',
  'finalizada',
  'cancelada',
]);

export const operacaoDocaPrioridadeEnum = pgEnum('operacao_doca_prioridade_type', [
  'urgente',
  'prioritaria',
  'normal',
  'baixa',
]);

export const docas = docaPgSchema.table(
  'docas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codigo: varchar('codigo', { length: 50 }).notNull(),
    nome: varchar('nome', { length: 255 }).notNull(),
    tipo: docaTipoEnum('tipo').notNull(),
    situacao: docaSituacaoEnum('situacao').notNull().default('disponivel'),
    capacidadeVeiculos: integer('capacidade_veiculos'),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('docas_unidade_codigo_unique').on(table.unidadeId, table.codigo),
  ],
);

export const operacoesDoca = docaPgSchema.table('operacoes_doca', {
  id: uuid('id').defaultRandom().primaryKey(),
  docaId: uuid('doca_id')
    .notNull()
    .references(() => docas.id, { onDelete: 'restrict' }),
  tipoOperacao: operacaoDocaTipoEnum('tipo_operacao').notNull(),
  veiculoId: uuid('veiculo_id').notNull(),
  transportadoraId: uuid('transportadora_id').notNull(),
  motorista: text('motorista'),
  dataPrevista: timestamp('data_prevista', { withTimezone: true }),
  dataInicio: timestamp('data_inicio', { withTimezone: true }),
  dataFim: timestamp('data_fim', { withTimezone: true }),
  situacao: operacaoDocaSituacaoEnum('situacao').notNull().default('agendada'),
  prioridade: operacaoDocaPrioridadeEnum('prioridade')
    .notNull()
    .default('normal'),
  observacao: text('observacao'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
