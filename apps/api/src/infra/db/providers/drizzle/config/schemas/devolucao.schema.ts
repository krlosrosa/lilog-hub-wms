import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema.js';
import { remessas, transportes } from './expedicao.schema.js';
import { produtos, unidades } from './master-data.schema.js';
import {
  sessaoFuncionarios,
  sessoesTrabalho,
} from './sessao-operacao.schema.js';

export const devolucaoPgSchema = pgSchema('devolucao');

export const demandaDevolucaoStatusEnum = pgEnum('demanda_devolucao_status_type', [
  'rascunho',
  'aberta',
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
  'cancelada',
]);

export const devolucaoNotaFiscalTipoEnum = pgEnum('devolucao_nota_fiscal_tipo_type', [
  'reentrega',
  'devolucao_parcial',
  'devolucao_total',
]);

export const devolucaoItemCondicaoEnum = pgEnum('devolucao_item_condicao_type', [
  'integro',
  'avariado',
  'vencido',
  'violado',
  'nao_identificado',
]);

export const devolucaoAlocacaoFuncaoEnum = pgEnum(
  'devolucao_alocacao_funcao_type',
  ['lider', 'conferente', 'auxiliar'],
);

export const devolucaoAlocacaoStatusEnum = pgEnum(
  'devolucao_alocacao_status_type',
  ['em_andamento', 'concluida', 'cancelada'],
);

export const devolucaoFaltaPesoStatusEnum = pgEnum(
  'devolucao_falta_peso_status_type',
  ['pendente', 'validada', 'rejeitada'],
);

export const devolucaoGrupoDescargaStatusEnum = pgEnum(
  'devolucao_grupo_descarga_status_type',
  [
    'rascunho',
    'aguardando_conferencia',
    'em_conferencia',
    'conferida',
    'concluida',
    'cancelada',
  ],
);

export const devolucaoItemNaoContabilStatusEnum = pgEnum(
  'devolucao_item_nao_contabil_status_type',
  ['pendente', 'conciliado', 'descartado', 'gerou_ocorrencia'],
);

export const demandasDevolucao = devolucaoPgSchema.table(
  'demandas_devolucao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codigoDemanda: varchar('codigo_demanda', { length: 30 }).notNull(),
    status: demandaDevolucaoStatusEnum('status').notNull().default('rascunho'),
    abertaPorUserId: integer('aberta_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    responsavelOperacaoId: integer('responsavel_operacao_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    observacao: text('observacao'),
    placa: varchar('placa', { length: 20 }),
    doca: varchar('doca', { length: 100 }),
    cargaSegregada: boolean('carga_segregada').notNull().default(false),
    paletesEsperados: integer('paletes_esperados'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    concluidaAt: timestamp('concluida_at', { withTimezone: true }),
  },
  (table) => [
    unique('demandas_devolucao_unidade_codigo_unique').on(
      table.unidadeId,
      table.codigoDemanda,
    ),
    index('demandas_devolucao_unidade_status_created_idx').on(
      table.unidadeId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const devolucaoNotasFiscais = devolucaoPgSchema.table(
  'devolucao_notas_fiscais',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasDevolucao.id, { onDelete: 'cascade' }),
    numeroNf: varchar('numero_nf', { length: 20 }).notNull(),
    chaveAcesso: varchar('chave_acesso', { length: 44 }),
    tipo: devolucaoNotaFiscalTipoEnum('tipo').notNull(),
    motivo: text('motivo').notNull(),
    cliente: varchar('cliente', { length: 255 }),
    codCliente: varchar('cod_cliente', { length: 50 }),
    remessaId: uuid('remessa_id').references(() => remessas.id, {
      onDelete: 'set null',
    }),
    transporteId: varchar('transporte_id', { length: 100 }).references(
      () => transportes.numeroTransporte,
      { onDelete: 'cascade' },
    ),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('devolucao_notas_fiscais_demanda_id_idx').on(table.demandaId),
    index('devolucao_notas_fiscais_numero_nf_idx').on(table.numeroNf),
    uniqueIndex('devolucao_notas_fiscais_chave_acesso_unique_idx')
      .on(table.chaveAcesso)
      .where(sql`${table.chaveAcesso} is not null`),
  ],
);

export const devolucaoItens = devolucaoPgSchema.table(
  'devolucao_itens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    devolucaoNfId: uuid('devolucao_nf_id')
      .notNull()
      .references(() => devolucaoNotasFiscais.id, { onDelete: 'cascade' }),
    produtoId: varchar('produto_id', { length: 50 }).references(() => produtos.produtoId, {
      onDelete: 'set null',
    }),
    sku: varchar('sku', { length: 50 }).notNull(),
    descricaoProduto: varchar('descricao_produto', { length: 500 }),
    lote: varchar('lote', { length: 100 }),
    dataFabricacao: date('data_fabricacao'),
    quantidade: numeric('quantidade', { precision: 14, scale: 3 }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    quantidadeNormalizadaUnidades: numeric('quantidade_normalizada_unidades', {
      precision: 14,
      scale: 3,
    }).notNull(),
    pesoDevolvido: numeric('peso_devolvido', { precision: 10, scale: 3 }),
    motivoItem: text('motivo_item'),
    condicao: devolucaoItemCondicaoEnum('condicao')
      .notNull()
      .default('integro'),
    qtdConferida: integer('qtd_conferida'),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('devolucao_itens_devolucao_nf_id_idx').on(table.devolucaoNfId),
    index('devolucao_itens_produto_id_idx').on(table.produtoId),
    index('devolucao_itens_sku_idx').on(table.sku),
  ],
);

export const devolucaoAlocacoes = devolucaoPgSchema.table(
  'devolucao_alocacoes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasDevolucao.id, { onDelete: 'cascade' }),
    sessaoId: uuid('sessao_id')
      .notNull()
      .references(() => sessoesTrabalho.id, { onDelete: 'restrict' }),
    sessaoFuncionarioId: uuid('sessao_funcionario_id')
      .notNull()
      .references(() => sessaoFuncionarios.id, { onDelete: 'restrict' }),
    funcao: devolucaoAlocacaoFuncaoEnum('funcao')
      .notNull()
      .default('conferente'),
    status: devolucaoAlocacaoStatusEnum('status')
      .notNull()
      .default('em_andamento'),
    atribuidoEm: timestamp('atribuido_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    inicioEm: timestamp('inicio_em', { withTimezone: true }),
    fimEm: timestamp('fim_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('devolucao_alocacoes_demanda_id_idx').on(table.demandaId),
    index('devolucao_alocacoes_sessao_func_idx').on(
      table.sessaoId,
      table.sessaoFuncionarioId,
    ),
  ],
);

export const devolucaoEventos = devolucaoPgSchema.table(
  'devolucao_eventos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasDevolucao.id, { onDelete: 'cascade' }),
    statusAnterior: demandaDevolucaoStatusEnum('status_anterior'),
    statusNovo: demandaDevolucaoStatusEnum('status_novo').notNull(),
    descricao: text('descricao'),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('devolucao_eventos_demanda_id_idx').on(table.demandaId),
  ],
);

export const devolucaoChecklist = devolucaoPgSchema.table(
  'devolucao_checklist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .unique()
      .references(() => demandasDevolucao.id, { onDelete: 'cascade' }),
    dock: varchar('dock', { length: 100 }).notNull(),
    paletesRecebidos: integer('paletes_recebidos').notNull(),
    tempBau: numeric('temp_bau', { precision: 5, scale: 1 }),
    tempProduto: numeric('temp_produto', { precision: 5, scale: 1 }),
    conditions: jsonb('conditions')
      .$type<Record<string, boolean>>()
      .notNull()
      .default({}),
    observacoes: text('observacoes'),
    photoCount: integer('photo_count').notNull().default(0),
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
    index('devolucao_checklist_demanda_id_idx').on(table.demandaId),
  ],
);

export const devolucaoFaltasPeso = devolucaoPgSchema.table(
  'devolucao_faltas_peso',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasDevolucao.id, { onDelete: 'cascade' }),
    notaFiscalId: uuid('nota_fiscal_id')
      .notNull()
      .references(() => devolucaoNotasFiscais.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => devolucaoItens.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 50 }).notNull(),
    pesoEsperadoKg: numeric('peso_esperado_kg', { precision: 10, scale: 3 }).notNull(),
    pesoDevolvidoKg: numeric('peso_devolvido_kg', { precision: 10, scale: 3 }).notNull(),
    pesoFaltanteKg: numeric('peso_faltante_kg', { precision: 10, scale: 3 })
      .generatedAlwaysAs(sql`"peso_esperado_kg" - "peso_devolvido_kg"`),
    quantidadeFiscalOriginal: numeric('quantidade_fiscal_original', {
      precision: 14,
      scale: 3,
    }),
    quantidadeContabilConsiderada: numeric('quantidade_contabil_considerada', {
      precision: 14,
      scale: 3,
    })
      .notNull()
      .default('0'),
    tratativaContabil: varchar('tratativa_contabil', { length: 30 })
      .notNull()
      .default('diferenca_peso'),
    zerarQuantidadeContabil: boolean('zerar_quantidade_contabil')
      .notNull()
      .default(true),
    motivo: text('motivo'),
    observacao: text('observacao'),
    status: devolucaoFaltaPesoStatusEnum('status').notNull().default('pendente'),
    registradoPorUserId: integer('registrado_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    registradoEm: timestamp('registrado_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    validadoPorUserId: integer('validado_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    validadoEm: timestamp('validado_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('devolucao_faltas_peso_demanda_id_idx').on(table.demandaId),
    index('devolucao_faltas_peso_item_id_idx').on(table.itemId),
    uniqueIndex('devolucao_faltas_peso_item_id_ativo_unique_idx')
      .on(table.itemId)
      .where(sql`${table.status} in ('pendente', 'validada')`),
  ],
);

export const devolucaoGruposDescarga = devolucaoPgSchema.table(
  'devolucao_grupos_descarga',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codigoGrupo: varchar('codigo_grupo', { length: 30 }).notNull(),
    placaDescarga: varchar('placa_descarga', { length: 20 }).notNull(),
    doca: varchar('doca', { length: 100 }),
    cargaSegregada: boolean('carga_segregada').notNull().default(false),
    paletesEsperados: integer('paletes_esperados'),
    observacao: text('observacao'),
    status: devolucaoGrupoDescargaStatusEnum('status')
      .notNull()
      .default('rascunho'),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [
    unique('devolucao_grupos_descarga_unidade_codigo_unique').on(
      table.unidadeId,
      table.codigoGrupo,
    ),
    index('devolucao_grupos_descarga_unidade_status_idx').on(
      table.unidadeId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const devolucaoGrupoDemandas = devolucaoPgSchema.table(
  'devolucao_grupo_demandas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    grupoId: uuid('grupo_id')
      .notNull()
      .references(() => devolucaoGruposDescarga.id, { onDelete: 'cascade' }),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasDevolucao.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('devolucao_grupo_demandas_demanda_unique').on(table.demandaId),
    index('devolucao_grupo_demandas_grupo_id_idx').on(table.grupoId),
  ],
);

export const devolucaoItensNaoContabeis = devolucaoPgSchema.table(
  'devolucao_itens_nao_contabeis',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    grupoDescargaId: uuid('grupo_descarga_id').references(
      () => devolucaoGruposDescarga.id,
      { onDelete: 'cascade' },
    ),
    demandaId: uuid('demanda_id').references(() => demandasDevolucao.id, {
      onDelete: 'set null',
    }),
    sku: varchar('sku', { length: 50 }).notNull(),
    descricaoProduto: varchar('descricao_produto', { length: 500 }),
    quantidadeConferida: numeric('quantidade_conferida', {
      precision: 14,
      scale: 3,
    }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    lote: varchar('lote', { length: 100 }),
    dataFabricacao: date('data_fabricacao'),
    condicao: devolucaoItemCondicaoEnum('condicao')
      .notNull()
      .default('nao_identificado'),
    observacao: text('observacao'),
    status: devolucaoItemNaoContabilStatusEnum('status')
      .notNull()
      .default('pendente'),
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
    index('devolucao_itens_nao_contabeis_grupo_id_idx').on(
      table.grupoDescargaId,
    ),
    index('devolucao_itens_nao_contabeis_demanda_id_idx').on(table.demandaId),
    index('devolucao_itens_nao_contabeis_unidade_status_idx').on(
      table.unidadeId,
      table.status,
    ),
  ],
);

export const devolucaoAvarias = devolucaoPgSchema.table(
  'devolucao_avarias',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasDevolucao.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => devolucaoItens.id, {
      onDelete: 'set null',
    }),
    tipo: varchar('tipo', { length: 50 }).notNull(),
    natureza: varchar('natureza', { length: 50 }),
    causa: varchar('causa', { length: 50 }),
    quantidadeCaixa: integer('quantidade_caixa'),
    quantidadeUnidade: integer('quantidade_unidade'),
    skusAfetados: varchar('skus_afetados', { length: 50 }).array(),
    observacao: text('observacao'),
    photoUrls: text('photo_urls').array(),
    criadoPorUserId: integer('criado_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('devolucao_avarias_demanda_id_idx').on(table.demandaId),
    index('devolucao_avarias_item_id_idx').on(table.itemId),
  ],
);
