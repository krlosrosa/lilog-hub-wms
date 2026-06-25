import {
  boolean,
  date,
  index,
  integer,
  json,
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

import { users, funcionarios } from './auth.schema.js';
import { docas, operacaoDocaPrioridadeEnum } from './doca.schema.js';
import { produtos, unidades } from './master-data.schema.js';
import { sessaoFuncionarios } from './sessao-operacao.schema.js';

export const expedicaoPgSchema = pgSchema('expedicao');

export const origemRemessaEnum = pgEnum('origem_remessa_type', [
  'upload',
  'reentrega',
]);

export const statusTransporteEnum = pgEnum('status_transporte_type', [
  'pendente',
  'alocado',
  'parcial',
  'em_separacao',
  'separado',
  'em_conferencia',
  'conferido',
  'em_carregamento',
  'carregado',
  'em_viagem',
  'viagem_finalizada',
]);

export const tipoVeiculoEnum = pgEnum('tipo_veiculo_type', [
  'VUC',
  'Toco',
  'Truck_3_4',
  'Carreta',
  'Bitrem',
]);

export const mapaGrupoProcessoTypeEnum = pgEnum('mapa_grupo_processo_type', [
  'separacao',
  'carregamento',
  'conferencia',
]);

export const uploadLotes = expedicaoPgSchema.table('upload_lotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  unidadeId: varchar('unidade_id', { length: 50 })
    .notNull()
    .references(() => unidades.id, { onDelete: 'restrict' }),
  dataReferencia: date('data_referencia').notNull(),
  horarioExpectativaSaida: timestamp('horario_expectativa_saida', {
    withTimezone: true,
  }).notNull(),
  nomeArquivo: varchar('nome_arquivo', { length: 255 }),
  totalRemessas: integer('total_remessas').notNull().default(0),
  criadoPor: integer('criado_por').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const remessas = expedicaoPgSchema.table('remessas', {
  id: uuid('id').defaultRandom().primaryKey(),
  uploadLoteId: uuid('upload_lote_id')
    .notNull()
    .references(() => uploadLotes.id, { onDelete: 'cascade' }),
  remessa: varchar('remessa', { length: 100 }).notNull(),
  empresa: varchar('empresa', { length: 100 }).notNull(),
  codCliente: varchar('cod_cliente', { length: 50 }).notNull(),
  cliente: varchar('cliente', { length: 255 }).notNull(),
  cidade: varchar('cidade', { length: 100 }).notNull(),
  peso: numeric('peso', { precision: 10, scale: 3 }).notNull(),
  volume: numeric('volume', { precision: 10, scale: 3 }).notNull(),
  origem: origemRemessaEnum('origem').notNull().default('upload'),
  motivoReentrega: text('motivo_reentrega'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const remessaItens = expedicaoPgSchema.table(
  'remessa_itens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    remessaId: uuid('remessa_id')
      .notNull()
      .references(() => remessas.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 50 }).notNull(),
    produtoId: uuid('produto_id').references(() => produtos.id, {
      onDelete: 'set null',
    }),
    lote: varchar('lote', { length: 100 }),
    dataFabricacao: date('data_fabricacao'),
    faixa: varchar('faixa', { length: 50 }),
    peso: numeric('peso', { precision: 10, scale: 3 }),
    quantidade: numeric('quantidade', { precision: 14, scale: 3 }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    quantidadeNormalizadaUnidades: numeric('quantidade_normalizada_unidades', {
      precision: 14,
      scale: 3,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('remessa_itens_remessa_sku_lote_unidade_unique').on(
      table.remessaId,
      table.sku,
      table.lote,
      table.unidadeMedida,
    ),
  ],
);

export const transportes = expedicaoPgSchema.table('transportes', {
  id: uuid('id').defaultRandom().primaryKey(),
  unidadeId: varchar('unidade_id', { length: 50 })
    .notNull()
    .references(() => unidades.id, { onDelete: 'restrict' }),
  uploadLoteId: uuid('upload_lote_id')
    .notNull()
    .references(() => uploadLotes.id, { onDelete: 'restrict' }),
  rota: varchar('rota', { length: 100 }).notNull(),
  regiao: varchar('regiao', { length: 100 }).notNull(),
  cidade: varchar('cidade', { length: 100 }).notNull(),
  bairro: varchar('bairro', { length: 100 }),
  dataTransporte: date('data_transporte').notNull(),
  horarioExpectativaSaida: timestamp('horario_expectativa_saida', {
    withTimezone: true,
  }),
  pesoTotal: numeric('peso_total', { precision: 10, scale: 3 })
    .notNull()
    .default('0'),
  volumeTotal: numeric('volume_total', { precision: 10, scale: 3 })
    .notNull()
    .default('0'),
  distanciaKm: numeric('distancia_km', { precision: 8, scale: 2 }),
  itinerario: varchar('itinerario', { length: 100 }),
  perfilEsperado: tipoVeiculoEnum('perfil_esperado'),
  status: statusTransporteEnum('status').notNull().default('pendente'),
  placa: varchar('placa', { length: 20 }),
  motorista: varchar('motorista', { length: 255 }),
  transportadora: varchar('transportadora', { length: 255 }),
  perfilPagamentoId: uuid('perfil_pagamento_id'),
  perfilPagamentoNome: varchar('perfil_pagamento_nome', { length: 255 }),
  custoPrevisto: numeric('custo_previsto', { precision: 10, scale: 2 }),
  freteSemCusto: boolean('frete_sem_custo').notNull().default(false),
  reentregaExclusiva: boolean('reentrega_exclusiva').notNull().default(false),
  isPrioridade: boolean('is_prioridade').notNull().default(false),
  nivelPrioridade: operacaoDocaPrioridadeEnum('nivel_prioridade'),
  mapaGeradoEm: timestamp('mapa_gerado_em', { withTimezone: true }),
  ultimoMapaLoteId: uuid('ultimo_mapa_lote_id'),
  viagemId: integer('viagem_id'),
  viagemInicioEm: timestamp('viagem_inicio_em', { withTimezone: true }),
  viagemFimEm: timestamp('viagem_fim_em', { withTimezone: true }),
  anomalia: varchar('anomalia', { length: 500 }),
  docaId: uuid('doca_id').references(() => docas.id, { onDelete: 'set null' }),
  lacreCarregamento: varchar('lacre_carregamento', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const configuracoesImpressao = expedicaoPgSchema.table(
  'configuracoes_impressao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    nome: varchar('nome', { length: 120 }).notNull(),
    configuracao: jsonb('configuracao').notNull(),
    templatesHtml: jsonb('templates_html').notNull(),
    isPadrao: boolean('is_padrao').notNull().default(false),
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
);

export const transporteRemessas = expedicaoPgSchema.table(
  'transporte_remessas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transporteId: uuid('transporte_id')
      .notNull()
      .references(() => transportes.id, { onDelete: 'cascade' }),
    remessaId: uuid('remessa_id')
      .notNull()
      .references(() => remessas.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('transporte_remessas_transporte_remessa_unique').on(
      table.transporteId,
      table.remessaId,
    ),
  ],
);

export const mapaLotes = expedicaoPgSchema.table(
  'mapa_lotes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    config: jsonb('config').notNull(),
    payload: jsonb('payload').notNull(),
    resumo: jsonb('resumo').notNull(),
    configuracaoImpressaoId: uuid('configuracao_impressao_id').references(
      () => configuracoesImpressao.id,
      { onDelete: 'set null' },
    ),
    templatesHtml: jsonb('templates_html'),
    criadoPor: integer('criado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('mapa_lotes_unidade_created_at_idx').on(
      table.unidadeId,
      table.createdAt,
    ),
  ],
);

export const mapaLoteTransportes = expedicaoPgSchema.table(
  'mapa_lote_transportes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mapaLoteId: uuid('mapa_lote_id')
      .notNull()
      .references(() => mapaLotes.id, { onDelete: 'cascade' }),
    transporteId: uuid('transporte_id')
      .notNull()
      .references(() => transportes.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('mapa_lote_transportes_lote_transporte_unique').on(
      table.mapaLoteId,
      table.transporteId,
    ),
    index('mapa_lote_transportes_transporte_id_idx').on(table.transporteId),
  ],
);

export const mapaGrupos = expedicaoPgSchema.table(
  'mapa_grupos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mapaLoteId: uuid('mapa_lote_id')
      .notNull()
      .references(() => mapaLotes.id, { onDelete: 'cascade' }),
    microUuid: varchar('micro_uuid', { length: 120 }).notNull(),
    processo: mapaGrupoProcessoTypeEnum('processo').notNull(),
    transporteId: uuid('transporte_id')
      .notNull()
      .references(() => transportes.id, { onDelete: 'restrict' }),
    titulo: varchar('titulo', { length: 255 }).notNull(),
    subtitulo: varchar('subtitulo', { length: 255 }),
    cabecalho: jsonb('cabecalho').notNull(),
    totalItens: integer('total_itens').notNull(),
    pesoTotal: numeric('peso_total', { precision: 12, scale: 3 }).notNull(),
    sequencia: integer('sequencia').notNull(),
    iniciadoEm: timestamp('iniciado_em', { withTimezone: true }),
    finalizadoEm: timestamp('finalizado_em', { withTimezone: true }),
    sessaoFuncionarioId: uuid('sessao_funcionario_id').references(
      () => sessaoFuncionarios.id,
      { onDelete: 'set null' },
    ),
    tempoEsperado: integer('tempo_esperado').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('mapa_grupos_micro_uuid_idx').on(table.microUuid),
    index('mapa_grupos_sessao_funcionario_id_idx').on(table.sessaoFuncionarioId),
    unique('mapa_grupos_lote_micro_uuid_processo_unique').on(
      table.mapaLoteId,
      table.microUuid,
      table.processo,
    ),
  ],
);

export const mapaGrupoItens = expedicaoPgSchema.table('mapa_grupo_itens', {
  id: uuid('id').defaultRandom().primaryKey(),
  mapaGrupoId: uuid('mapa_grupo_id')
    .notNull()
    .references(() => mapaGrupos.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 50 }).notNull(),
  descricao: varchar('descricao', { length: 500 }),
  remessa: varchar('remessa', { length: 100 }).notNull(),
  cliente: varchar('cliente', { length: 255 }).notNull(),
  codCliente: varchar('cod_cliente', { length: 50 }).notNull(),
  empresa: varchar('empresa', { length: 100 }).notNull(),
  categoria: varchar('categoria', { length: 100 }).notNull(),
  lote: varchar('lote', { length: 100 }),
  dataFabricacao: date('data_fabricacao'),
  faixa: varchar('faixa', { length: 50 }),
  quantidade: numeric('quantidade', { precision: 14, scale: 3 }).notNull(),
  unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
  quantidadeNormalizadaUnidades: numeric('quantidade_normalizada_unidades', {
    precision: 14,
    scale: 3,
  }).notNull(),
  peso: numeric('peso', { precision: 10, scale: 3 }),
  quebraPalete: boolean('quebra_palete').notNull().default(false),
  breakdown: jsonb('breakdown'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clientesEspeciais = expedicaoPgSchema.table(
  'clientes_especiais',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codCliente: varchar('cod_cliente', { length: 50 }).notNull(),
    nomeCliente: varchar('nome_cliente', { length: 255 }).notNull(),
    ativo: boolean('ativo').notNull().default(true),
    exigeSegregacaoMapa: boolean('exige_segregacao_mapa')
      .notNull()
      .default(false),
    exigeSeparacaoEspecial: boolean('exige_separacao_especial')
      .notNull()
      .default(false),
    exigeCarregamentoEspecial: boolean('exige_carregamento_especial')
      .notNull()
      .default(false),
    observacaoSeparacao: text('observacao_separacao'),
    observacaoCarregamento: text('observacao_carregamento'),
    observacaoGeral: text('observacao_geral'),
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
    unique('clientes_especiais_unidade_cod_unique').on(
      table.unidadeId,
      table.codCliente,
    ),
    index('clientes_especiais_unidade_id_idx').on(table.unidadeId),
  ],
);

export type RemessaViewRow = {
  id: string;
  remessa: string;
  empresa: string;
  codCliente: string;
  cliente: string;
  cidade: string;
  peso: string;
  volume: string;
  origem: 'upload' | 'reentrega';
  motivoReentrega: string | null;
};

export const vwTransportes = expedicaoPgSchema
  .view('vw_transportes', {
    id: uuid('id').notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    uploadLoteId: uuid('upload_lote_id').notNull(),
    rota: varchar('rota', { length: 100 }).notNull(),
    regiao: varchar('regiao', { length: 100 }).notNull(),
    cidade: varchar('cidade', { length: 100 }).notNull(),
    bairro: varchar('bairro', { length: 100 }),
    dataTransporte: date('data_transporte').notNull(),
    horarioExpectativaSaida: timestamp('horario_expectativa_saida', {
      withTimezone: true,
    }),
    pesoTotal: numeric('peso_total', { precision: 10, scale: 3 }).notNull(),
    volumeTotal: numeric('volume_total', { precision: 10, scale: 3 }).notNull(),
    distanciaKm: numeric('distancia_km', { precision: 8, scale: 2 }),
    itinerario: varchar('itinerario', { length: 100 }),
    perfilEsperado: tipoVeiculoEnum('perfil_esperado'),
    status: statusTransporteEnum('status').notNull(),
    placa: varchar('placa', { length: 20 }),
    motorista: varchar('motorista', { length: 255 }),
    transportadora: varchar('transportadora', { length: 255 }),
    perfilPagamentoId: uuid('perfil_pagamento_id'),
    perfilPagamentoNome: varchar('perfil_pagamento_nome', { length: 255 }),
    custoPrevisto: numeric('custo_previsto', { precision: 10, scale: 2 }),
    freteSemCusto: boolean('frete_sem_custo').notNull(),
    reentregaExclusiva: boolean('reentrega_exclusiva').notNull(),
    isPrioridade: boolean('is_prioridade').notNull(),
    nivelPrioridade: operacaoDocaPrioridadeEnum('nivel_prioridade'),
    mapaGeradoEm: timestamp('mapa_gerado_em', { withTimezone: true }),
    ultimoMapaLoteId: uuid('ultimo_mapa_lote_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    remessas: json('remessas').notNull().$type<RemessaViewRow[]>(),
  })
  .existing();
