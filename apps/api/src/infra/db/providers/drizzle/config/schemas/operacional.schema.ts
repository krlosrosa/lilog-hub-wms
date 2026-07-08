import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema.js';
import { unidades } from './master-data.schema.js';

export const operacionalPgSchema = pgSchema('operacional');

export const configuracoesOperacionais = operacionalPgSchema.table(
  'configuracoes_operacionais',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    dominio: varchar('dominio', { length: 50 }).notNull(),
    categoria: varchar('categoria', { length: 50 }).notNull(),
    subtipo: varchar('subtipo', { length: 50 }).notNull(),
    nome: varchar('nome', { length: 120 }).notNull(),
    descricao: text('descricao'),
    parametros: jsonb('parametros').notNull(),
    versaoSchema: smallint('versao_schema').notNull().default(1),
    isPadrao: boolean('is_padrao').notNull().default(false),
    ativo: boolean('ativo').notNull().default(true),
    criadoPor: integer('criado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('config_operacionais_unidade_dominio_categoria_subtipo_nome_unique').on(
      table.unidadeId,
      table.dominio,
      table.categoria,
      table.subtipo,
      table.nome,
    ),
    uniqueIndex('config_operacionais_padrao_unique_idx')
      .on(table.unidadeId, table.dominio, table.categoria, table.subtipo)
      .where(sql`${table.isPadrao} = true`),
  ],
);

export const regrasProcesso = operacionalPgSchema.table(
  'regras_processo',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'cascade' }),
    nome: varchar('nome', { length: 100 }).notNull(),
    descricao: text('descricao'),
    gatilho: varchar('gatilho', { length: 50 }).notNull(),
    prioridade: integer('prioridade').notNull().default(10),
    modoAvaliacao: varchar('modo_avaliacao', { length: 50 })
      .notNull()
      .default('parar_no_primeiro_match'),
    arvoreCondicoes: jsonb('arvore_condicoes').notNull(),
    acoes: jsonb('acoes').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('regras_processo_unidade_gatilho_nome_unique').on(
      table.unidadeId,
      table.gatilho,
      table.nome,
    ),
  ],
);
