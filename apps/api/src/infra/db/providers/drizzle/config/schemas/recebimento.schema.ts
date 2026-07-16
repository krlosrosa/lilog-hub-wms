import { sql } from 'drizzle-orm';
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
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { funcionarios, users } from './auth.schema.js';
import { produtos, unidades } from './master-data.schema.js';
import { unitizadores } from './armazenagem.schema.js';
import { docas } from './doca.schema.js';
import {
  sessaoFuncionarios,
  sessoesTrabalho,
} from './sessao-operacao.schema.js';

export const recebimentoPgSchema = pgSchema('recebimento');

export const preRecebimentoSituacaoEnum = pgEnum(
  'pre_recebimento_situacao_type',
  [
    'agendado',
    'aguardando',
    'liberado_para_conferencia',
    'em_conferencia',
    'impedido',
    'conferido',
    'finalizado',
    'cancelado',
  ],
);

export const recebimentoSituacaoEnum = pgEnum('recebimento_situacao_type', [
  'em_conferencia',
  'conferido',
  'finalizado',
  'cancelado',
]);

export const tipoDivergenciaEnum = pgEnum('tipo_divergencia_type', [
  'quantidade_maior',
  'quantidade_menor',
  'produto_nao_esperado',
  'produto_ausente',
  'divergencia_lote',
  'divergencia_peso',
  'divergencia_validade',
]);

export const preRecebimentos = recebimentoPgSchema.table('pre_recebimentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  unidadeId: varchar('unidade_id', { length: 50 })
    .notNull()
    .references(() => unidades.id, { onDelete: 'restrict' }),
  transportadoraNome: varchar('transportadora_nome', { length: 255 }),
  placa: varchar('placa', { length: 20 }),
  motoristaNome: varchar('motorista_nome', { length: 255 }),
  motoristaTelefone: varchar('motorista_telefone', { length: 20 }),
  grauPrioridade: varchar('grau_prioridade', { length: 20 }),
  numeroOcr: varchar('numero_ocr', { length: 100 }),
  numeroTransporte: varchar('numero_transporte', { length: 100 }),
  origemDados: varchar('origem_dados', { length: 30 })
    .notNull()
    .default('manual'),
  origem: varchar('origem', { length: 50 }).default('3201'),
  horarioPrevisto: timestamp('horario_previsto', {
    withTimezone: true,
  }).notNull(),
  observacao: text('observacao'),
  quantidadePaletesEsperada: integer('quantidade_paletes_esperada'),
  numeroTermoPalete: varchar('numero_termo_palete', { length: 100 }),
  situacao: preRecebimentoSituacaoEnum('situacao')
    .notNull()
    .default('agendado'),
  dataChegada: timestamp('data_chegada', { withTimezone: true }),
  docaId: uuid('doca_id').references(() => docas.id, { onDelete: 'set null' }),
  rastreioToken: uuid('rastreio_token'),
  userId: integer('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notasFiscaisPreRecebimento = recebimentoPgSchema.table(
  'notas_fiscais_pre_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    preRecebimentoId: uuid('pre_recebimento_id')
      .notNull()
      .references(() => preRecebimentos.id, { onDelete: 'cascade' }),
    numeroNf: varchar('numero_nf', { length: 20 }).notNull(),
    serie: varchar('serie', { length: 5 }),
    chaveAcesso: varchar('chave_acesso', { length: 44 }),
    numeroRemessa: varchar('numero_remessa', { length: 100 }),
    fornecedorNome: varchar('fornecedor_nome', { length: 255 }),
    fornecedorDocumento: varchar('fornecedor_documento', { length: 20 }),
    pesoTotal: numeric('peso_total', { precision: 12, scale: 3 }),
    volumeTotal: numeric('volume_total', { precision: 12, scale: 3 }),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('nfs_pre_recebimento_pre_id_idx').on(table.preRecebimentoId),
    uniqueIndex('nfs_pre_recebimento_chave_acesso_unique_idx')
      .on(table.chaveAcesso)
      .where(sql`${table.chaveAcesso} is not null`),
  ],
);

export const itensPreRecebimento = recebimentoPgSchema.table(
  'itens_pre_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    preRecebimentoId: uuid('pre_recebimento_id')
      .notNull()
      .references(() => preRecebimentos.id, { onDelete: 'cascade' }),
    produtoId: varchar('produto_id', { length: 50 })
      .notNull()
      .references(() => produtos.produtoId, { onDelete: 'restrict' }),
    quantidadeEsperada: numeric('quantidade_esperada', {
      precision: 12,
      scale: 3,
    }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    loteEsperado: varchar('lote_esperado', { length: 100 }),
    pesoEsperado: numeric('peso_esperado', { precision: 12, scale: 3 }),
    validadeEsperada: timestamp('validade_esperada', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const recebimentos = recebimentoPgSchema.table('recebimentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  preRecebimentoId: uuid('pre_recebimento_id')
    .notNull()
    .references(() => preRecebimentos.id, { onDelete: 'cascade' }),
  docaId: uuid('doca_id').references(() => docas.id, { onDelete: 'set null' }),
  responsavelId: integer('responsavel_id')
    .notNull()
    .references(() => funcionarios.id, { onDelete: 'restrict' }),
  dataInicio: timestamp('data_inicio', { withTimezone: true }).notNull(),
  dataFim: timestamp('data_fim', { withTimezone: true }),
  situacao: recebimentoSituacaoEnum('situacao')
    .notNull()
    .default('em_conferencia'),
  quantidadePaletes: integer('quantidade_paletes'),
  teveSobreposicaoCarga: boolean('teve_sobreposicao_carga')
    .notNull()
    .default(false),
  modoUnitizacao: varchar('modo_unitizacao', { length: 50 })
    .notNull()
    .default('gerar_etiqueta_na_armazenagem'),
  userId: integer('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const itensRecebimento = recebimentoPgSchema.table(
  'itens_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoId: uuid('recebimento_id')
      .notNull()
      .references(() => recebimentos.id, { onDelete: 'cascade' }),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    produtoId: varchar('produto_id', { length: 50 })
      .notNull()
      .references(() => produtos.produtoId, { onDelete: 'restrict' }),
    quantidadeRecebida: numeric('quantidade_recebida', {
      precision: 12,
      scale: 3,
    }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    loteRecebido: varchar('lote_recebido', { length: 100 }),
    pesoRecebido: numeric('peso_recebido', { precision: 12, scale: 3 }),
    validade: timestamp('validade', { withTimezone: true }),
    numeroSerie: varchar('numero_serie', { length: 100 }),
    unitizadorId: uuid('unitizador_id').references(() => unitizadores.id, {
      onDelete: 'set null',
    }),
    conferidoPorId: integer('conferido_por_id').references(() => funcionarios.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('itens_recebimento_unidade_id_idx').on(table.unidadeId)],
);

export const pesagensRecebimento = recebimentoPgSchema.table(
  'pesagens_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoItemId: uuid('recebimento_item_id')
      .notNull()
      .references(() => itensRecebimento.id, { onDelete: 'cascade' }),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    sequenciaCaixa: integer('sequencia_caixa').notNull().default(1),
    etiquetaCodigo: varchar('etiqueta_codigo', { length: 100 }),
    pesoKg: numeric('peso_kg', { precision: 12, scale: 3 }).notNull(),
    conferidoPorId: integer('conferido_por_id').references(() => funcionarios.id, {
      onDelete: 'set null',
    }),
    clientConferenceId: varchar('client_conference_id', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('pesagens_recebimento_item_idx').on(table.recebimentoItemId),
    uniqueIndex('pesagens_recebimento_etiqueta_unidade_idx')
      .on(table.unidadeId, table.etiquetaCodigo)
      .where(sql`${table.etiquetaCodigo} is not null`),
    unique('pesagens_recebimento_item_client_conf_uidx').on(
      table.recebimentoItemId,
      table.clientConferenceId,
    ),
  ],
);

export const recebimentoAvarias = recebimentoPgSchema.table(
  'recebimento_avarias',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoId: uuid('recebimento_id')
      .notNull()
      .references(() => recebimentos.id, { onDelete: 'cascade' }),
    produtoId: varchar('produto_id', { length: 50 }).references(() => produtos.produtoId, {
      onDelete: 'set null',
    }),
    tipo: varchar('tipo', { length: 50 }).notNull(),
    natureza: varchar('natureza', { length: 50 }).notNull(),
    causa: varchar('causa', { length: 50 }).notNull(),
    quantidadeCaixas: integer('quantidade_caixas').notNull().default(0),
    quantidadeUnidades: integer('quantidade_unidades').notNull().default(0),
    lote: varchar('lote', { length: 100 }),
    validade: timestamp('validade', { withTimezone: true }),
    numeroSerie: varchar('numero_serie', { length: 100 }),
    photoCount: integer('photo_count').notNull().default(0),
    replicado: boolean('replicado').notNull().default(false),
    clientDamageId: varchar('client_damage_id', { length: 128 }),
    operatorId: integer('operator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('recebimento_avarias_recebimento_client_damage_uidx').on(
      table.recebimentoId,
      table.clientDamageId,
    ),
  ],
);

export const temperaturaProdutoEtapaEnum = pgEnum(
  'temperatura_produto_etapa_type',
  ['inicio', 'meio', 'fim'],
);

export const recebimentoTemperaturasProduto = recebimentoPgSchema.table(
  'recebimento_temperaturas_produto',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoId: uuid('recebimento_id')
      .notNull()
      .references(() => recebimentos.id, { onDelete: 'cascade' }),
    etapa: temperaturaProdutoEtapaEnum('etapa').notNull(),
    temperatura: numeric('temperatura', { precision: 5, scale: 1 }).notNull(),
    medidoEm: timestamp('medido_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    operatorId: integer('operator_id').references(() => users.id, {
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
    uniqueIndex('recebimento_temperaturas_produto_recebimento_etapa_unique_idx').on(
      table.recebimentoId,
      table.etapa,
    ),
    index('recebimento_temperaturas_produto_recebimento_id_idx').on(
      table.recebimentoId,
    ),
  ],
);

export const checklistRecebimento = recebimentoPgSchema.table(
  'checklist_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoId: uuid('recebimento_id')
      .notNull()
      .unique()
      .references(() => recebimentos.id, { onDelete: 'cascade' }),
    lacre: varchar('lacre', { length: 100 }),
    tempBau: numeric('temp_bau', { precision: 5, scale: 1 }),
    tempProduto: numeric('temp_produto', { precision: 5, scale: 1 }),
    condicaoLimpeza: boolean('condicao_limpeza').notNull().default(false),
    condicaoOdor: boolean('condicao_odor').notNull().default(false),
    condicaoEstrutura: boolean('condicao_estrutura').notNull().default(false),
    condicaoVedacao: boolean('condicao_vedacao').notNull().default(false),
    conditions: jsonb('conditions').$type<Record<string, boolean>>().default({}),
    observacoes: text('observacoes'),
    photoCount: integer('photo_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const recebimentoAlocacaoStatusEnum = pgEnum(
  'recebimento_alocacao_status_type',
  ['atribuida', 'iniciada', 'cancelada', 'encerrada'],
);

export const recebimentoAlocacaoPapelEnum = pgEnum(
  'recebimento_alocacao_papel_type',
  ['responsavel', 'apoio'],
);

export const recebimentoAlocacoes = recebimentoPgSchema.table(
  'alocacoes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    preRecebimentoId: uuid('pre_recebimento_id')
      .notNull()
      .references(() => preRecebimentos.id, { onDelete: 'cascade' }),
    sessaoId: uuid('sessao_id')
      .notNull()
      .references(() => sessoesTrabalho.id, { onDelete: 'restrict' }),
    sessaoFuncionarioId: uuid('sessao_funcionario_id')
      .notNull()
      .references(() => sessaoFuncionarios.id, { onDelete: 'restrict' }),
    funcionarioId: integer('funcionario_id')
      .notNull()
      .references(() => funcionarios.id, { onDelete: 'restrict' }),
    papel: recebimentoAlocacaoPapelEnum('papel').notNull().default('responsavel'),
    status: recebimentoAlocacaoStatusEnum('status').notNull().default('atribuida'),
    atribuidoPorUserId: integer('atribuido_por_user_id'),
    atribuidoEm: timestamp('atribuido_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    inicioEm: timestamp('inicio_em', { withTimezone: true }),
    canceladoEm: timestamp('cancelado_em', { withTimezone: true }),
    encerradoEm: timestamp('encerrado_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('alocacoes_pre_recebimento_responsavel_ativa_idx')
      .on(table.preRecebimentoId)
      .where(
        sql`${table.status} = 'atribuida' and ${table.papel} = 'responsavel'`,
      ),
    uniqueIndex('alocacoes_pre_recebimento_apoio_ativo_idx')
      .on(table.preRecebimentoId, table.funcionarioId)
      .where(
        sql`${table.papel} = 'apoio' and ${table.status} in ('atribuida', 'iniciada')`,
      ),
    index('alocacoes_sessao_id_idx').on(table.sessaoId),
    index('alocacoes_sessao_funcionario_id_idx').on(table.sessaoFuncionarioId),
  ],
);

export const divergenciasRecebimento = recebimentoPgSchema.table(
  'divergencias_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recebimentoId: uuid('recebimento_id')
      .notNull()
      .references(() => recebimentos.id, { onDelete: 'cascade' }),
    produtoId: varchar('produto_id', { length: 50 }).references(() => produtos.produtoId, {
      onDelete: 'set null',
    }),
    tipoDivergencia: tipoDivergenciaEnum('tipo_divergencia').notNull(),
    quantidadeEsperada: numeric('quantidade_esperada', {
      precision: 12,
      scale: 3,
    }),
    quantidadeRecebida: numeric('quantidade_recebida', {
      precision: 12,
      scale: 3,
    }),
    descricao: text('descricao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const impedimentosRecebimento = recebimentoPgSchema.table(
  'impedimentos_recebimento',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    preRecebimentoId: uuid('pre_recebimento_id')
      .notNull()
      .references(() => preRecebimentos.id, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 50 }).notNull(),
    descricao: text('descricao').notNull(),
    photoCount: integer('photo_count').notNull().default(0),
    registradoPorId: integer('registrado_por_id').references(() => funcionarios.id, {
      onDelete: 'set null',
    }),
    registradoEm: timestamp('registrado_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('impedimentos_recebimento_pre_id_idx').on(table.preRecebimentoId),
  ],
);
