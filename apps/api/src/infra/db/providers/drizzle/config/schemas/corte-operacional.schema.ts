import {
  index,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema.js';
import { mapaGrupoItens, mapaGrupos, transportes } from './expedicao.schema.js';
import { unidades } from './master-data.schema.js';

export const corteOperacionalPgSchema = pgSchema('corte_operacional');

export const corteStatusEnum = pgEnum('corte_status_type', [
  'solicitado',
  'em_andamento',
  'concluido',
  'cancelado',
]);

export const cortes = corteOperacionalPgSchema.table(
  'cortes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codigo: varchar('codigo', { length: 30 }).notNull(),
    mapaGrupoId: uuid('mapa_grupo_id')
      .notNull()
      .references(() => mapaGrupos.id, { onDelete: 'restrict' }),
    transporteId: varchar('transporte_id', { length: 100 })
      .notNull()
      .references(() => transportes.numeroTransporte, { onDelete: 'cascade' }),
    mapaGrupoMicroUuid: varchar('mapa_grupo_micro_uuid', { length: 120 }).notNull(),
    rota: varchar('rota', { length: 100 }).notNull(),
    doca: varchar('doca', { length: 50 }),
    status: corteStatusEnum('status').notNull().default('solicitado'),
    motivo: text('motivo'),
    observacao: text('observacao'),
    totalVolumes: integer('total_volumes'),
    pesoTotalKg: numeric('peso_total_kg', { precision: 12, scale: 3 }),
    solicitadoPor: integer('solicitado_por')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    solicitadoEm: timestamp('solicitado_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    realizadoPor: integer('realizado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    realizadoEm: timestamp('realizado_em', { withTimezone: true }),
    canceladoPor: integer('cancelado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    canceladoEm: timestamp('cancelado_em', { withTimezone: true }),
    motivoCancelamento: text('motivo_cancelamento'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('cortes_unidade_codigo_unique').on(table.unidadeId, table.codigo),
    index('cortes_unidade_status_idx').on(table.unidadeId, table.status),
    index('cortes_mapa_grupo_id_idx').on(table.mapaGrupoId),
  ],
);

export const corteItens = corteOperacionalPgSchema.table('corte_itens', {
  id: uuid('id').defaultRandom().primaryKey(),
  corteId: uuid('corte_id')
    .notNull()
    .references(() => cortes.id, { onDelete: 'cascade' }),
  mapaGrupoItemId: uuid('mapa_grupo_item_id')
    .notNull()
    .references(() => mapaGrupoItens.id, { onDelete: 'restrict' }),
  sku: varchar('sku', { length: 50 }).notNull(),
  descricao: varchar('descricao', { length: 500 }),
  remessa: varchar('remessa', { length: 100 }).notNull(),
  cliente: varchar('cliente', { length: 255 }).notNull(),
  lote: varchar('lote', { length: 100 }),
  quantidadeMapa: numeric('quantidade_mapa', {
    precision: 14,
    scale: 3,
  }).notNull(),
  quantidadeCorte: numeric('quantidade_corte', {
    precision: 14,
    scale: 3,
  }).notNull(),
  unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
  pesoKg: numeric('peso_kg', { precision: 10, scale: 3 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
