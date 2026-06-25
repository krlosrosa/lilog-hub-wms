import {
  boolean,
  char,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const masterDataPgSchema = pgSchema('master_data');

export const clusterEnum = pgEnum('cluster_type', [
  'Cross',
  'CD-Fabrica',
  'Distribuicao',
]);

export const empresaEnum = pgEnum('empresa_type', ['LDB', 'ITB', 'DPA']);

export const enderecoTipoEnum = pgEnum('endereco_tipo_type', [
  'picking',
  'pulmao',
  'recebimento',
  'expedicao',
  'avaria',
  'inventario',
  'cross_docking',
  'doca',
]);

export const enderecoStatusEnum = pgEnum('endereco_status_type', [
  'disponivel',
  'ocupado',
  'bloqueado',
  'inventario',
  'inativo',
]);

export const enderecoTipoEstruturaEnum = pgEnum('endereco_tipo_estrutura_type', [
  'porta-palete',
  'drive-in',
  'estante-dinamica',
  'flow-rack',
]);

export const curvaAbcEnum = pgEnum('curva_abc_type', ['A', 'B', 'C']);

export const produtoEnderecoPapelEnum = pgEnum('produto_endereco_papel_type', [
  'picking_primario',
  'picking_secundario',
  'pulmao',
]);

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

export const produtos = masterDataPgSchema.table('produtos', {
  id: uuid('id').defaultRandom().primaryKey(),
  produtoId: varchar('produto_id', { length: 50 }).notNull().unique(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  descricao: text('descricao').notNull(),
  empresa: varchar('empresa', { length: 30 }).notNull(),
  categoria: varchar('categoria', { length: 30 }).notNull(),
  tipo: varchar('tipo', { length: 10 }).notNull(),
  ean: varchar('ean', { length: 20 }),
  dum: varchar('dum', { length: 20 }),
  shelfLife: integer('shelf_life'),
  pesoBrutoUnidade: numeric('peso_bruto_unidade', { precision: 10, scale: 3 }),
  pesoBrutoCaixa: numeric('peso_bruto_caixa', { precision: 10, scale: 3 }),
  pesoBrutoPalete: numeric('peso_bruto_palete', { precision: 10, scale: 3 }),
  pesoLiquidoUnidade: numeric('peso_liquido_unidade', { precision: 10, scale: 3 }),
  pesoLiquidoCaixa: numeric('peso_liquido_caixa', { precision: 10, scale: 3 }),
  pesoLiquidoPalete: numeric('peso_liquido_palete', { precision: 10, scale: 3 }),
  unidadesPorCaixa: integer('unidades_por_caixa'),
  caixasPorPalete: integer('caixas_por_palete'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const enderecos = masterDataPgSchema.table(
  'enderecos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    enderecoMascarado: varchar('endereco_mascarado', { length: 100 }).notNull(),
    centroId: uuid('centro_id')
      .notNull()
      .references(() => centros.id, { onDelete: 'restrict' }),
    zona: varchar('zona', { length: 100 }).notNull(),
    rua: varchar('rua', { length: 10 }).notNull().default('0000'),
    posicao: varchar('posicao', { length: 10 }).notNull().default('000'),
    nivel: varchar('nivel', { length: 10 }).notNull().default('00'),
    tipo: enderecoTipoEnum('tipo').notNull(),
    status: enderecoStatusEnum('status').notNull().default('disponivel'),
    tipoEstrutura: enderecoTipoEstruturaEnum('tipo_estrutura').notNull(),
    larguraMm: integer('largura_mm').notNull(),
    alturaMm: integer('altura_mm').notNull(),
    profundidadeMm: integer('profundidade_mm').notNull(),
    cargaMaxKg: numeric('carga_max_kg', { precision: 10, scale: 2 }).notNull(),
    capacidadeVolume: numeric('capacidade_volume', { precision: 10, scale: 2 }),
    prioridadePicking: integer('prioridade_picking'),
    coordenadaX: numeric('coordenada_x', { precision: 10, scale: 2 }),
    coordenadaY: numeric('coordenada_y', { precision: 10, scale: 2 }),
    coordenadaZ: numeric('coordenada_z', { precision: 10, scale: 2 }),
    observacao: text('observacao'),
    vinculoSkuFixo: boolean('vinculo_sku_fixo').notNull().default(false),
    regraLoteUnico: boolean('regra_lote_unico').notNull().default(false),
    permiteMisturaValidade: boolean('permite_mistura_validade')
      .notNull()
      .default(false),
    permiteFracionado: boolean('permite_fracionado').notNull().default(false),
    curvaAbc: curvaAbcEnum('curva_abc').notNull().default('B'),
    ocupacaoPercent: numeric('ocupacao_percent', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('enderecos_centro_endereco_mascarado_unique').on(
      table.centroId,
      table.enderecoMascarado,
    ),
  ],
);

export const produtoEnderecos = masterDataPgSchema.table(
  'produto_enderecos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    centroId: uuid('centro_id')
      .notNull()
      .references(() => centros.id, { onDelete: 'restrict' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'restrict' }),
    enderecoId: uuid('endereco_id')
      .notNull()
      .references(() => enderecos.id, { onDelete: 'restrict' }),
    papel: produtoEnderecoPapelEnum('papel').notNull(),
    ordem: smallint('ordem').notNull().default(1),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('produto_enderecos_produto_endereco_unique').on(
      table.produtoId,
      table.enderecoId,
    ),
    unique('produto_enderecos_centro_produto_ordem_unique').on(
      table.centroId,
      table.produtoId,
      table.ordem,
    ),
    uniqueIndex('produto_enderecos_centro_produto_picking_primario_unique')
      .on(table.centroId, table.produtoId)
      .where(sql`${table.papel} = 'picking_primario'`),
  ],
);
