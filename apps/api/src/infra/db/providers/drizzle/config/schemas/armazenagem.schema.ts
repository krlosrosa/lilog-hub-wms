import {
  boolean,
  foreignKey,
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
import { enderecos, statusSaldoEnderecoEnum } from './estoque.schema.js';
import { produtos, unidades } from './master-data.schema.js';
import { recebimentos } from './recebimento.schema.js';

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
  'aguardando_validacao',
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

export const tarefaArmazenagemStatusEnum = pgEnum('tarefa_armazenagem_status', [
  'pendente',
  'em_andamento',
  'armazenada',
  'divergente',
  'cancelada',
]);

export const regraEnderecamentoCriterioTipoEnum = pgEnum(
  'regra_enderecamento_criterio_tipo',
  ['grupo', 'categoria', 'produto'],
);

export const regraEnderecamentoDestinoTipoEnum = pgEnum(
  'regra_enderecamento_destino_tipo',
  ['zona', 'endereco'],
);

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
    recebimentoId: uuid('recebimento_id').references(() => recebimentos.id, {
      onDelete: 'set null',
    }),
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
    validadoPor: integer('validado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    validadoEm: timestamp('validado_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recebimentoId],
      foreignColumns: [recebimentos.id],
      name: 'demandas_armazenagem_recebimento_id_recebimentos_id_fk',
    }).onDelete('cascade'),
  ],
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

export const regrasEnderecamento = armazenagemPgSchema.table(
  'regras_enderecamento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'cascade' }),
    nome: varchar('nome', { length: 100 }).notNull(),
    criterioTipo: regraEnderecamentoCriterioTipoEnum('criterio_tipo').notNull(),
    criterioValor: varchar('criterio_valor', { length: 100 }).notNull(),
    prioridade: integer('prioridade').notNull().default(10),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('regras_enderecamento_unidade_criterio_unique').on(
      table.unidadeId,
      table.criterioTipo,
      table.criterioValor,
    ),
  ],
);

export const regrasEnderecamentoDestinos = armazenagemPgSchema.table(
  'regras_enderecamento_destinos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    regraId: uuid('regra_id')
      .notNull()
      .references(() => regrasEnderecamento.id, { onDelete: 'cascade' }),
    prioridade: integer('prioridade').notNull(),
    tipo: regraEnderecamentoDestinoTipoEnum('tipo').notNull(),
    zona: varchar('zona', { length: 100 }),
    rua: varchar('rua', { length: 10 }),
    enderecoId: uuid('endereco_id').references(() => enderecos.id, {
      onDelete: 'set null',
    }),
    ativo: boolean('ativo').notNull().default(true),
  },
  (table) => [
    unique('regras_enderecamento_destinos_regra_prioridade_unique').on(
      table.regraId,
      table.prioridade,
    ),
  ],
);

export const tarefasArmazenagem = armazenagemPgSchema.table(
  'tarefas_armazenagem',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasArmazenagem.id, { onDelete: 'cascade' }),
    unitizadorId: uuid('unitizador_id').references(() => unitizadores.id, {
      onDelete: 'set null',
    }),
    sequencia: integer('sequencia').notNull(),
    status: tarefaArmazenagemStatusEnum('status').notNull().default('pendente'),
    enderecoSugeridoId: uuid('endereco_sugerido_id').references(
      () => enderecos.id,
      { onDelete: 'set null' },
    ),
    enderecoConfirmadoId: uuid('endereco_confirmado_id').references(
      () => enderecos.id,
      { onDelete: 'set null' },
    ),
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
  (table) => [
    unique('tarefas_armazenagem_demanda_sequencia_unique').on(
      table.demandaId,
      table.sequencia,
    ),
  ],
);

export const itensArmazenagem = armazenagemPgSchema.table('itens_armazenagem', {
  id: uuid('id').defaultRandom().primaryKey(),
  demandaId: uuid('demanda_id')
    .notNull()
    .references(() => demandasArmazenagem.id, { onDelete: 'cascade' }),
  tarefaId: uuid('tarefa_id').references(() => tarefasArmazenagem.id, {
    onDelete: 'cascade',
  }),
  unitizadorId: uuid('unitizador_id').references(() => unitizadores.id, {
    onDelete: 'set null',
  }),
  produtoId: varchar('produto_id', { length: 50 })
    .notNull()
    .references(() => produtos.produtoId, { onDelete: 'restrict' }),
  quantidade: numeric('quantidade', { precision: 18, scale: 4 }).notNull(),
  unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
  lote: varchar('lote', { length: 100 }),
  validade: timestamp('validade', { withTimezone: true }),
  numeroSerie: varchar('numero_serie', { length: 100 }),
  statusSaldo: statusSaldoEnderecoEnum('status_saldo')
    .notNull()
    .default('liberado'),
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
