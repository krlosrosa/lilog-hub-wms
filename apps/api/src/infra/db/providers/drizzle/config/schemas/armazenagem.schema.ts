import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema.js';
import {
  enderecos,
  produtos,
  unidades,
} from './master-data.schema.js';

export const armazenagemPgSchema = pgSchema('armazenagem');

export const unitizadorTipoEnum = pgEnum('unitizador_tipo', [
  'palete',
  'volume',
  'caixa',
]);

export const unitizadorOrigemEnum = pgEnum('unitizador_origem', [
  'palete_virgem',
  'gerado_sistema',
]);

export const unitizadorStatusEnum = pgEnum('unitizador_status', [
  'virgem',
  'em_recebimento',
  'aguardando_armazenagem',
  'armazenado',
  'cancelado',
]);

export const demandaArmazenagemStatusEnum = pgEnum('demanda_armazenagem_status', [
  'aguardando_inicio',
  'em_andamento',
  'concluida',
  'cancelada',
]);

export const itemArmazenagemStatusEnum = pgEnum('item_armazenagem_status', [
  'pendente',
  'em_andamento',
  'armazenado',
  'divergente',
]);

export const unitizadores = armazenagemPgSchema.table(
  'unitizadores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codigo: varchar('codigo', { length: 100 }).notNull(),
    tipo: unitizadorTipoEnum('tipo').notNull().default('palete'),
    origem: unitizadorOrigemEnum('origem').notNull(),
    status: unitizadorStatusEnum('status').notNull().default('virgem'),
    recebimentoId: uuid('recebimento_id'),
    enderecoAtualId: uuid('endereco_atual_id').references(() => enderecos.id, {
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
    unique('unitizadores_unidade_codigo_unique').on(
      table.unidadeId,
      table.codigo,
    ),
  ],
);

export const demandasArmazenagem = armazenagemPgSchema.table(
  'demandas_armazenagem',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    recebimentoId: uuid('recebimento_id').notNull().unique(),
    modoUnitizacao: varchar('modo_unitizacao', { length: 50 }).notNull(),
    status: demandaArmazenagemStatusEnum('status')
      .notNull()
      .default('aguardando_inicio'),
    responsavelId: integer('responsavel_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const politicaArmazenagem = armazenagemPgSchema.table(
  'politica_armazenagem',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'cascade' })
      .unique(),
    enderecoDivergente: varchar('endereco_divergente', { length: 30 })
      .notNull()
      .default('bloquear'),
    quantidadeParcial: varchar('quantidade_parcial', { length: 30 })
      .notNull()
      .default('permitir_com_motivo'),
    exigirBipagemProduto: boolean('exigir_bipagem_produto')
      .notNull()
      .default(true),
    exigirBipagemEndereco: boolean('exigir_bipagem_endereco')
      .notNull()
      .default(true),
    permitirOffline: boolean('permitir_offline').notNull().default(true),
    concluirAutomaticamente: boolean('concluir_automaticamente')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const itensArmazenagem = armazenagemPgSchema.table('itens_armazenagem', {
  id: uuid('id').defaultRandom().primaryKey(),
  demandaId: uuid('demanda_id')
    .notNull()
    .references(() => demandasArmazenagem.id, { onDelete: 'cascade' }),
  unitizadorId: uuid('unitizador_id').references(() => unitizadores.id, {
    onDelete: 'set null',
  }),
  produtoId: uuid('produto_id')
    .notNull()
    .references(() => produtos.id, { onDelete: 'restrict' }),
  quantidade: numeric('quantidade', { precision: 18, scale: 4 }).notNull(),
  unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
  lote: varchar('lote', { length: 100 }),
  validade: timestamp('validade', { withTimezone: true }),
  numeroSerie: varchar('numero_serie', { length: 100 }),
  enderecoSugeridoId: uuid('endereco_sugerido_id').references(
    () => enderecos.id,
    { onDelete: 'set null' },
  ),
  enderecoConfirmadoId: uuid('endereco_confirmado_id').references(
    () => enderecos.id,
    { onDelete: 'set null' },
  ),
  status: itemArmazenagemStatusEnum('status').notNull().default('pendente'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
