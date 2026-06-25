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

import { funcionarios } from './auth.schema.js';
import { unidades } from './master-data.schema.js';

export const cncPgSchema = pgSchema('cnc');

export const cncOrigemEnum = pgEnum('cnc_origem_type', ['recebimento']);

export const cncResponsavelEnum = pgEnum('cnc_responsavel_type', [
  'transportadora',
  'fornecedor',
  'operacao',
  'indeterminado',
]);

export const cncSituacaoEnum = pgEnum('cnc_situacao_type', [
  'pendente',
  'em_analise',
  'aprovado',
  'rejeitado',
  'encerrado',
]);

export const cncItemTipoEnum = pgEnum('cnc_item_tipo_type', [
  'divergencia',
  'avaria',
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
  acaoImediata: text('acao_imediata'),
  acaoCorretiva: text('acao_corretiva'),
  situacao: cncSituacaoEnum('situacao').notNull().default('pendente'),
  solicitanteId: integer('solicitante_id')
    .notNull()
    .references(() => funcionarios.id, { onDelete: 'restrict' }),
  aprovadorId: integer('aprovador_id').references(() => funcionarios.id, {
    onDelete: 'set null',
  }),
  dataAprovacao: timestamp('data_aprovacao', { withTimezone: true }),
  observacaoAprovador: text('observacao_aprovador'),
  valorDebito: numeric('valor_debito', { precision: 12, scale: 2 }),
  debitoConfirmado: boolean('debito_confirmado').notNull().default(false),
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
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
