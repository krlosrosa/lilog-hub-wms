import {
  char,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const masterDataPgSchema = pgSchema('master_data');

export const clusterEnum = pgEnum('cluster_type', [
  'Cross',
  'CD-Fabrica',
  'Distribuicao',
]);

export const empresaEnum = pgEnum('empresa_type', ['LDB', 'ITB', 'DPA']);

export const unidades = masterDataPgSchema.table('unidades', {
  id: varchar('id', { length: 50 }).primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  cluster: clusterEnum('cluster').notNull(),
  nomeFilial: varchar('nome_filial', { length: 255 }).notNull(),
  modoUnitizacaoRecebimento: varchar('modo_unitizacao_recebimento', {
    length: 50,
  })
    .notNull()
    .default('gerar_etiqueta_na_armazenagem'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const centros = masterDataPgSchema.table('centros', {
  id: uuid('id').defaultRandom().primaryKey(),
  unidadeId: varchar('unidade_id', { length: 50 })
    .notNull()
    .references(() => unidades.id, { onDelete: 'cascade' }),
  centro: char('centro', { length: 4 }).notNull(),
  empresa: empresaEnum('empresa').notNull(),
  nome: varchar('nome', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const centrosOrigem = masterDataPgSchema.table('centros_origem', {
  centro: varchar('centro', { length: 50 }).primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
});

export const produtos = masterDataPgSchema.table('produtos', {
  produtoId: varchar('produto_id', { length: 50 }).primaryKey(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  descricao: text('descricao').notNull(),
  empresa: varchar('empresa', { length: 30 }).notNull(),
  categoria: varchar('categoria', { length: 30 }).notNull(),
  grupo: varchar('grupo', { length: 100 }),
  tipo: varchar('tipo', { length: 10 }).notNull(),
  ean: varchar('ean', { length: 20 }),
  dum: varchar('dum', { length: 20 }),
  shelfLife: integer('shelf_life'),
  pesoBrutoUnidade: numeric('peso_bruto_unidade', { precision: 10, scale: 3 }),
  pesoBrutoCaixa: numeric('peso_bruto_caixa', { precision: 10, scale: 3 }),
  pesoBrutoPalete: numeric('peso_bruto_palete', { precision: 10, scale: 3 }),
  pesoLiquidoUnidade: numeric('peso_liquido_unidade', {
    precision: 10,
    scale: 3,
  }),
  pesoLiquidoCaixa: numeric('peso_liquido_caixa', { precision: 10, scale: 3 }),
  pesoLiquidoPalete: numeric('peso_liquido_palete', {
    precision: 10,
    scale: 3,
  }),
  unidadesPorCaixa: integer('unidades_por_caixa'),
  caixasPorPalete: integer('caixas_por_palete'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
