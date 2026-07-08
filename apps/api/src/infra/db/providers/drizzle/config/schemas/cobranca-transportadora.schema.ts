import {
  boolean,
  index,
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
import {
  demandasDevolucao,
  devolucaoAvarias,
  devolucaoFaltasPeso,
  devolucaoItens,
} from './devolucao.schema.js';
import { unidades } from './master-data.schema.js';
import { transportadoras } from './transporte.schema.js';

export const cobrancaTransportadoraPgSchema = pgSchema('cobranca_transportadora');

export const processoDebitoStatusEnum = pgEnum(
  'processo_debito_status_type',
  ['aberto', 'em_analise', 'aprovado', 'incluido_em_documento', 'cancelado'],
);

export const debitoItemTipoEnum = pgEnum('debito_item_tipo_type', [
  'falta',
  'avaria',
  'sobra',
]);

export const debitoItemStatusEnum = pgEnum('debito_item_status_type', [
  'pendente',
  'aprovado',
  'rejeitado',
  'cobrar',
  'nao_cobrar',
  'sobra',
]);

export const documentoCobrancaStatusEnum = pgEnum(
  'documento_cobranca_status_type',
  ['rascunho', 'emitido', 'enviado', 'pago', 'cancelado'],
);

export const cobrancaEventoEntidadeTipoEnum = pgEnum(
  'cobranca_evento_entidade_tipo_type',
  ['processo', 'documento'],
);

export const tipoContestacaoEnum = pgEnum('tipo_contestacao_type', [
  'erro_conferencia',
  'nf_incorreta',
  'avaria_nao_procedente',
  'outros',
]);

export const interacaoAutorEnum = pgEnum('interacao_autor_type', [
  'transportadora',
  'cd',
]);

export const interacaoTipoEnum = pgEnum('interacao_tipo_type', [
  'erro_conferencia',
  'nf_incorreta',
  'avaria_nao_procedente',
  'envio_documento',
  'esclarecimento',
  'outros',
  'solicitacao_prova',
  'parecer',
  'observacao_cd',
]);

export const processosDebito = cobrancaTransportadoraPgSchema.table(
  'processos_debito',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    demandaId: uuid('demanda_id')
      .notNull()
      .unique()
      .references(() => demandasDevolucao.id, { onDelete: 'restrict' }),
    transporteId: varchar('transporte_id', { length: 100 }),
    transportadoraId: uuid('transportadora_id').references(
      () => transportadoras.id,
      { onDelete: 'set null' },
    ),
    transportadoraNome: varchar('transportadora_nome', { length: 255 }),
    status: processoDebitoStatusEnum('status').notNull().default('aberto'),
    valorTotal: numeric('valor_total', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    quantidadeItens: integer('quantidade_itens').notNull().default(0),
    observacao: text('observacao'),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
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
    index('processos_debito_unidade_status_idx').on(
      table.unidadeId,
      table.status,
    ),
    index('processos_debito_transportadora_id_idx').on(table.transportadoraId),
  ],
);

export const processoDebitoItens = cobrancaTransportadoraPgSchema.table(
  'processo_debito_itens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    processoDebitoId: uuid('processo_debito_id')
      .notNull()
      .references(() => processosDebito.id, { onDelete: 'cascade' }),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasDevolucao.id, { onDelete: 'restrict' }),
    notaFiscalId: uuid('nota_fiscal_id'),
    itemId: uuid('item_id').references(() => devolucaoItens.id, {
      onDelete: 'set null',
    }),
    avariaId: uuid('avaria_id').references(() => devolucaoAvarias.id, {
      onDelete: 'set null',
    }),
    faltaPesoId: uuid('falta_peso_id').references(
      () => devolucaoFaltasPeso.id,
      { onDelete: 'set null' },
    ),
    tipo: debitoItemTipoEnum('tipo').notNull(),
    sku: varchar('sku', { length: 50 }),
    descricaoProduto: varchar('descricao_produto', { length: 500 }),
    quantidade: numeric('quantidade', { precision: 14, scale: 3 }),
    pesoKg: numeric('peso_kg', { precision: 10, scale: 3 }),
    valorUnitario: numeric('valor_unitario', { precision: 12, scale: 2 }),
    valorDebito: numeric('valor_debito', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    motivo: text('motivo'),
    observacao: text('observacao'),
    status: debitoItemStatusEnum('status').notNull().default('cobrar'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('processo_debito_itens_processo_id_idx').on(table.processoDebitoId),
    index('processo_debito_itens_demanda_id_idx').on(table.demandaId),
  ],
);

export const documentosCobranca = cobrancaTransportadoraPgSchema.table(
  'documentos_cobranca',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    numeroDocumento: varchar('numero_documento', { length: 50 }).notNull(),
    transportadoraId: uuid('transportadora_id').references(
      () => transportadoras.id,
      { onDelete: 'set null' },
    ),
    transportadoraNome: varchar('transportadora_nome', { length: 255 }).notNull(),
    status: documentoCobrancaStatusEnum('status').notNull().default('rascunho'),
    valorTotal: numeric('valor_total', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    quantidadeProcessos: integer('quantidade_processos').notNull().default(0),
    quantidadeItens: integer('quantidade_itens').notNull().default(0),
    emitidoPorUserId: integer('emitido_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    emitidoEm: timestamp('emitido_em', { withTimezone: true }),
    enviadoEm: timestamp('enviado_em', { withTimezone: true }),
    pagoEm: timestamp('pago_em', { withTimezone: true }),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('documentos_cobranca_unidade_numero_unique').on(
      table.unidadeId,
      table.numeroDocumento,
    ),
    index('documentos_cobranca_unidade_status_idx').on(
      table.unidadeId,
      table.status,
    ),
  ],
);

export const documentoCobrancaItens = cobrancaTransportadoraPgSchema.table(
  'documento_cobranca_itens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentoCobrancaId: uuid('documento_cobranca_id')
      .notNull()
      .references(() => documentosCobranca.id, { onDelete: 'cascade' }),
    processoDebitoId: uuid('processo_debito_id')
      .notNull()
      .references(() => processosDebito.id, { onDelete: 'restrict' }),
    processoDebitoItemId: uuid('processo_debito_item_id')
      .notNull()
      .references(() => processoDebitoItens.id, { onDelete: 'restrict' }),
    valorDebito: numeric('valor_debito', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('documento_cobranca_itens_doc_item_unique').on(
      table.documentoCobrancaId,
      table.processoDebitoItemId,
    ),
    index('documento_cobranca_itens_documento_id_idx').on(
      table.documentoCobrancaId,
    ),
  ],
);

export const processoDebitoReplicas = cobrancaTransportadoraPgSchema.table(
  'processo_debito_replicas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    processoDebitoId: uuid('processo_debito_id')
      .notNull()
      .references(() => processosDebito.id, { onDelete: 'cascade' }),
    transportadoraId: uuid('transportadora_id')
      .notNull()
      .references(() => transportadoras.id, { onDelete: 'restrict' }),
    tipoContestacao: tipoContestacaoEnum('tipo_contestacao').notNull(),
    descricao: text('descricao').notNull(),
    anexoChaves: jsonb('anexo_chaves').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('processo_debito_replicas_processo_id_idx').on(table.processoDebitoId),
    index('processo_debito_replicas_transportadora_id_idx').on(
      table.transportadoraId,
    ),
  ],
);

export const processoDebitoInteracoes = cobrancaTransportadoraPgSchema.table(
  'processo_debito_interacoes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    processoDebitoId: uuid('processo_debito_id')
      .notNull()
      .references(() => processosDebito.id, { onDelete: 'cascade' }),
    autor: interacaoAutorEnum('autor').notNull(),
    tipo: interacaoTipoEnum('tipo').notNull(),
    descricao: text('descricao').notNull(),
    anexoChaves: jsonb('anexo_chaves').notNull().default([]),
    transportadoraId: uuid('transportadora_id').references(
      () => transportadoras.id,
      { onDelete: 'restrict' },
    ),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('processo_debito_interacoes_processo_id_idx').on(
      table.processoDebitoId,
    ),
  ],
);

export const cobrancaEventos = cobrancaTransportadoraPgSchema.table(
  'cobranca_eventos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entidadeTipo: cobrancaEventoEntidadeTipoEnum('entidade_tipo').notNull(),
    entidadeId: uuid('entidade_id').notNull(),
    statusAnterior: varchar('status_anterior', { length: 50 }),
    statusNovo: varchar('status_novo', { length: 50 }).notNull(),
    descricao: text('descricao'),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('cobranca_eventos_entidade_idx').on(
      table.entidadeTipo,
      table.entidadeId,
    ),
  ],
);

export const portalNotificacaoTipoEnum = pgEnum(
  'portal_notificacao_tipo_type',
  ['novo_debito', 'status_atualizado', 'nova_interacao'],
);

export const portalNotificacoes = cobrancaTransportadoraPgSchema.table(
  'portal_notificacoes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transportadoraId: uuid('transportadora_id')
      .notNull()
      .references(() => transportadoras.id, { onDelete: 'cascade' }),
    processoDebitoId: uuid('processo_debito_id').references(
      () => processosDebito.id,
      { onDelete: 'cascade' },
    ),
    tipo: portalNotificacaoTipoEnum('tipo').notNull(),
    titulo: varchar('titulo', { length: 200 }).notNull(),
    mensagem: varchar('mensagem', { length: 500 }).notNull(),
    rotaDestino: varchar('rota_destino', { length: 300 }).notNull(),
    lida: boolean('lida').notNull().default(false),
    lidaEm: timestamp('lida_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('portal_notificacoes_transportadora_idx').on(
      table.transportadoraId,
      table.lida,
      table.createdAt,
    ),
  ],
);
