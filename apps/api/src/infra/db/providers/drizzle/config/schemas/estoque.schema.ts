import {
  boolean,
  integer,
  jsonb,
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
import { centros, enderecos, produtos, unidades } from './master-data.schema.js';

export const estoquePgSchema = pgSchema('estoque');

export const movementTypeEnum = pgEnum('movement_type', [
  'ENTRADA',
  'SAIDA',
  'TRANSFERENCIA',
  'AJUSTE',
  'DEVOLUCAO',
]);

export const inventarioTipoEnum = pgEnum('inventario_tipo', ['ciclo', 'geral']);

export const inventarioStatusEnum = pgEnum('inventario_status', [
  'agendado',
  'em_progresso',
  'pausado',
  'concluido',
]);

export const demandaContagemTipoEnum = pgEnum('demanda_contagem_tipo', [
  'cega',
  'validacao',
]);

export const demandaContagemPrioridadeEnum = pgEnum(
  'demanda_contagem_prioridade',
  ['baixa', 'media', 'alta', 'critica'],
);

export const demandaContagemStatusEnum = pgEnum('demanda_contagem_status', [
  'aguardando_inicio',
  'em_andamento',
  'concluida',
  'cancelada',
]);

export const demandaEnderecoStatusEnum = pgEnum('demanda_endereco_status', [
  'pendente',
  'em_andamento',
  'conferido',
]);

export const contagemTipoEnum = pgEnum('contagem_tipo', ['cega', 'validacao']);

export const depositoFinalidadeEnum = pgEnum('deposito_finalidade_type', [
  'transferencia',
  'aguardando_armazenagem',
  'geral',
  'quarentena',
  'debito_transportadora',
  'acerto_transferencia',
  'reserva',
  'avaria',
  'bloqueado',
]);

export const tipoMovimentoEstoqueEnum = pgEnum('tipo_movimento_estoque_type', [
  'ENTRADA',
  'SAIDA',
  'TRANSFERENCIA_DEPOSITO',
  'AJUSTE',
  'ESTORNO',
]);

export const naturezaSaldoEnum = pgEnum('natureza_saldo_type', [
  'fisico',
  'debito',
]);

export type DemandaFiltrosJson = {
  enderecoIds: string[];
  zonas: string[];
  rackInicio?: string;
  rackFim?: string;
  categorias: string[];
  skuBusca?: string;
};

export const movementRecords = estoquePgSchema.table('movement_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: varchar('item_id', { length: 100 }).notNull(),
  lotNumber: varchar('lot_number', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  fromLocation: varchar('from_location', { length: 100 }),
  toLocation: varchar('to_location', { length: 100 }),
  movementType: movementTypeEnum('movement_type').notNull(),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  operatorId: uuid('operator_id').notNull(),
  documentRef: varchar('document_ref', { length: 255 }),
  notes: text('notes'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const inventarios = estoquePgSchema.table('inventarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  nome: varchar('nome', { length: 255 }).notNull(),
  tipo: inventarioTipoEnum('tipo').notNull(),
  status: inventarioStatusEnum('status').notNull().default('agendado'),
  dataProgramada: timestamp('data_programada', {
    withTimezone: true,
  }).notNull(),
  centroId: uuid('centro_id')
    .notNull()
    .references(() => centros.id, { onDelete: 'restrict' }),
  responsavelGestorId: integer('responsavel_gestor_id').references(
    () => users.id,
    { onDelete: 'set null' },
  ),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const demandasContagem = estoquePgSchema.table('demandas_contagem', {
  id: uuid('id').defaultRandom().primaryKey(),
  inventarioId: uuid('inventario_id')
    .notNull()
    .references(() => inventarios.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 255 }).notNull(),
  tipo: demandaContagemTipoEnum('tipo').notNull(),
  prioridade: demandaContagemPrioridadeEnum('prioridade')
    .notNull()
    .default('media'),
  status: demandaContagemStatusEnum('status')
    .notNull()
    .default('aguardando_inicio'),
  responsavelId: integer('responsavel_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  ativo: boolean('ativo').notNull().default(true),
  filtros: jsonb('filtros').$type<DemandaFiltrosJson>().notNull(),
  observacoes: text('observacoes').notNull().default(''),
  alertaFragilidade: boolean('alerta_fragilidade').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const demandaEnderecos = estoquePgSchema.table(
  'demanda_enderecos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasContagem.id, { onDelete: 'cascade' }),
    enderecoId: uuid('endereco_id')
      .notNull()
      .references(() => enderecos.id, { onDelete: 'restrict' }),
    sequence: integer('sequence').notNull(),
    status: demandaEnderecoStatusEnum('status')
      .notNull()
      .default('pendente'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('demanda_enderecos_demanda_endereco_unique').on(
      table.demandaId,
      table.enderecoId,
    ),
    unique('demanda_enderecos_demanda_sequence_unique').on(
      table.demandaId,
      table.sequence,
    ),
  ],
);

export const contagens = estoquePgSchema.table('contagens', {
  id: uuid('id').defaultRandom().primaryKey(),
  demandaEnderecoId: uuid('demanda_endereco_id')
    .notNull()
    .references(() => demandaEnderecos.id, { onDelete: 'cascade' }),
  tipo: contagemTipoEnum('tipo').notNull(),
  operatorId: integer('operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  codigoProduto: varchar('codigo_produto', { length: 100 }).notNull(),
  produtoId: uuid('produto_id').references(() => produtos.id, {
    onDelete: 'set null',
  }),
  quantidadeCaixas: integer('quantidade_caixas').notNull().default(0),
  quantidadeUnidades: integer('quantidade_unidades').notNull().default(0),
  lote: varchar('lote', { length: 100 }),
  peso: numeric('peso', { precision: 12, scale: 3 }),
  enderecoConfirmado: varchar('endereco_confirmado', { length: 100 }),
  sscc: varchar('sscc', { length: 100 }),
  enderecoVazio: boolean('endereco_vazio').notNull().default(false),
  anomaliaEncontrada: boolean('anomalia_encontrada').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const depositos = estoquePgSchema.table(
  'depositos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codigo: varchar('codigo', { length: 30 }).notNull(),
    nome: varchar('nome', { length: 100 }).notNull(),
    finalidade: depositoFinalidadeEnum('finalidade').notNull(),
    permiteVenda: boolean('permite_venda').notNull().default(false),
    permitePicking: boolean('permite_picking').notNull().default(false),
    exigeEndereco: boolean('exige_endereco').notNull().default(false),
    contaDisponivel: boolean('conta_disponivel').notNull().default(false),
    sistema: boolean('sistema').notNull().default(true),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('depositos_unidade_codigo_unique').on(table.unidadeId, table.codigo),
  ],
);

export const saldos = estoquePgSchema.table(
  'saldos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'restrict' }),
    depositoId: uuid('deposito_id')
      .notNull()
      .references(() => depositos.id, { onDelete: 'restrict' }),
    lote: varchar('lote', { length: 100 }).notNull().default(''),
    validade: timestamp('validade', { withTimezone: true }),
    numeroSerie: varchar('numero_serie', { length: 100 }).notNull().default(''),
    natureza: naturezaSaldoEnum('natureza').notNull().default('fisico'),
    quantidade: numeric('quantidade', { precision: 18, scale: 4 }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    documentoRef: varchar('documento_ref', { length: 255 }).notNull().default(''),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('saldos_unidade_produto_deposito_rastreio_unique').on(
      table.unidadeId,
      table.produtoId,
      table.depositoId,
      table.lote,
      table.numeroSerie,
      table.natureza,
      table.documentoRef,
    ),
  ],
);

export const movimentacoesEstoque = estoquePgSchema.table(
  'movimentacoes_estoque',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'restrict' }),
    depositoOrigemId: uuid('deposito_origem_id').references(() => depositos.id, {
      onDelete: 'restrict',
    }),
    depositoDestinoId: uuid('deposito_destino_id').references(
      () => depositos.id,
      { onDelete: 'restrict' },
    ),
    tipoMovimento: tipoMovimentoEstoqueEnum('tipo_movimento').notNull(),
    quantidade: numeric('quantidade', { precision: 18, scale: 4 }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    lote: varchar('lote', { length: 100 }),
    validade: timestamp('validade', { withTimezone: true }),
    numeroSerie: varchar('numero_serie', { length: 100 }),
    natureza: naturezaSaldoEnum('natureza').notNull().default('fisico'),
    documentoRef: varchar('documento_ref', { length: 255 }),
    motivo: varchar('motivo', { length: 100 }).notNull(),
    operatorId: integer('operator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const contagemAvarias = estoquePgSchema.table('contagem_avarias', {
  id: uuid('id').defaultRandom().primaryKey(),
  demandaEnderecoId: uuid('demanda_endereco_id')
    .notNull()
    .references(() => demandaEnderecos.id, { onDelete: 'cascade' }),
  contagemId: uuid('contagem_id').references(() => contagens.id, {
    onDelete: 'set null',
  }),
  motivo: varchar('motivo', { length: 255 }).notNull(),
  quantidadeCaixas: integer('quantidade_caixas').notNull().default(0),
  quantidadeUnidades: integer('quantidade_unidades').notNull().default(0),
  photoCount: integer('photo_count').notNull().default(0),
  operatorId: integer('operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
