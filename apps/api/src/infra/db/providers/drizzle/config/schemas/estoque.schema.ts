import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema.js';
import { centros, produtos, unidades } from './master-data.schema.js';

export const estoquePgSchema = pgSchema('estoque');

export const enderecoTipoEnum = pgEnum('endereco_tipo_type', [
  'picking',
  'pulmao',
  'aereo',
  'recebimento',
  'expedicao',
  'avaria',
  'inventario',
  'cross_docking',
  'area_operacional',
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
  'piso',
  'staging',
  'area-delimitada',
  'patio',
]);

export const curvaAbcEnum = pgEnum('curva_abc_type', ['A', 'B', 'C']);

export const armazemLayoutElementoTipoEnum = pgEnum(
  'armazem_layout_elemento_tipo',
  ['estante', 'corredor', 'doca', 'staging', 'saida'],
);

export const produtoEnderecoPapelEnum = pgEnum('produto_endereco_papel_type', [
  'picking_primario',
  'picking_secundario',
  'pulmao',
]);

export const enderecos = estoquePgSchema.table(
  'enderecos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    enderecoMascarado: varchar('endereco_mascarado', { length: 100 }).notNull(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
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
    unique('enderecos_unidade_endereco_mascarado_unique').on(
      table.unidadeId,
      table.enderecoMascarado,
    ),
  ],
);

export const produtoEnderecos = estoquePgSchema.table(
  'produto_enderecos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    centroId: uuid('centro_id')
      .notNull()
      .references(() => centros.id, { onDelete: 'restrict' }),
    produtoId: varchar('produto_id', { length: 50 })
      .notNull()
      .references(() => produtos.produtoId, { onDelete: 'restrict' }),
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
  ],
);

export const statusSaldoEnderecoEnum = pgEnum('status_saldo_endereco_type', [
  'liberado',
  'bloqueado',
]);

export const origemMotivoBloqueioSaldoEnum = pgEnum(
  'origem_motivo_bloqueio_saldo_type',
  ['recebimento', 'inventario', 'manual', 'qualidade', 'devolucao', 'sistema'],
);

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

export const inventarioTipoEnum = pgEnum('inventario_tipo', ['ciclo', 'geral']);

export const reservaStatusEnum = pgEnum('reserva_status_type', [
  'ativa',
  'parcial',
  'atendida',
  'cancelada',
  'expirada',
]);

export const reservaOrigemEnum = pgEnum('reserva_origem_type', [
  'pedido',
  'separacao',
  'manual',
  'inventario',
]);

export type DemandaFiltrosJson = {
  enderecoIds: string[];
  zonas: string[];
  rackInicio?: string;
  rackFim?: string;
  categorias: string[];
  skuBusca?: string;
};

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
  produtoId: varchar('produto_id', { length: 50 }).references(() => produtos.produtoId, {
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
  saldoEnderecoId: uuid('saldo_endereco_id').references(() => saldosEndereco.id, {
    onDelete: 'set null',
  }),
  correspondeAoEsperado: boolean('corresponde_ao_esperado')
    .notNull()
    .default(false),
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

export const motivosBloqueioSaldo = estoquePgSchema.table(
  'motivos_bloqueio_saldo',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    codigo: varchar('codigo', { length: 50 }).notNull(),
    nome: varchar('nome', { length: 100 }).notNull(),
    descricao: varchar('descricao', { length: 255 }),
    origem: origemMotivoBloqueioSaldoEnum('origem').notNull().default('manual'),
    ativo: boolean('ativo').notNull().default(true),
    sistema: boolean('sistema').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('motivos_bloqueio_saldo_unidade_codigo_unique').on(
      table.unidadeId,
      table.codigo,
    ),
  ],
);

export const saldosEndereco = estoquePgSchema.table(
  'saldos_endereco',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    produtoId: varchar('produto_id', { length: 50 })
      .notNull()
      .references(() => produtos.produtoId, { onDelete: 'restrict' }),
    depositoId: uuid('deposito_id')
      .notNull()
      .references(() => depositos.id, { onDelete: 'restrict' }),
    enderecoId: uuid('endereco_id')
      .notNull()
      .references(() => enderecos.id, { onDelete: 'restrict' }),
    lote: varchar('lote', { length: 100 }).notNull().default(''),
    validade: timestamp('validade', { withTimezone: true }),
    numeroSerie: varchar('numero_serie', { length: 100 }).notNull().default(''),
    natureza: naturezaSaldoEnum('natureza').notNull().default('fisico'),
    status: statusSaldoEnderecoEnum('status').notNull().default('liberado'),
    motivoBloqueioId: uuid('motivo_bloqueio_id').references(
      () => motivosBloqueioSaldo.id,
      { onDelete: 'restrict' },
    ),
    observacaoBloqueio: varchar('observacao_bloqueio', { length: 255 }),
    bloqueadoEm: timestamp('bloqueado_em', { withTimezone: true }),
    bloqueadoPor: integer('bloqueado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    quantidade: numeric('quantidade', { precision: 18, scale: 4 }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('saldos_endereco_unique').on(
      table.produtoId,
      table.depositoId,
      table.enderecoId,
      table.lote,
      table.numeroSerie,
      table.natureza,
      table.status,
    ),
    index('idx_saldos_endereco_endereco').on(table.enderecoId),
    index('idx_saldos_endereco_produto_deposito').on(
      table.produtoId,
      table.depositoId,
    ),
  ],
);

export const reservasEstoque = estoquePgSchema.table(
  'reservas_estoque',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    produtoId: varchar('produto_id', { length: 50 })
      .notNull()
      .references(() => produtos.produtoId, { onDelete: 'restrict' }),
    depositoId: uuid('deposito_id')
      .notNull()
      .references(() => depositos.id, { onDelete: 'restrict' }),
    enderecoId: uuid('endereco_id').references(() => enderecos.id, {
      onDelete: 'set null',
    }),
    lote: varchar('lote', { length: 100 }),
    numeroSerie: varchar('numero_serie', { length: 100 }),
    quantidade: numeric('quantidade', { precision: 18, scale: 4 }).notNull(),
    quantidadeAtendida: numeric('quantidade_atendida', {
      precision: 18,
      scale: 4,
    })
      .notNull()
      .default('0'),
    status: reservaStatusEnum('status').notNull().default('ativa'),
    origem: reservaOrigemEnum('origem').notNull(),
    documentoRef: varchar('documento_ref', { length: 255 }).notNull(),
    motivo: varchar('motivo', { length: 100 }),
    operatorId: integer('operator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_reservas_estoque_produto_deposito_status').on(
      table.produtoId,
      table.depositoId,
      table.status,
    ),
    index('idx_reservas_estoque_documento_ref').on(table.documentoRef),
  ],
);

export const movimentacoesEstoque = estoquePgSchema.table(
  'movimentacoes_estoque',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    produtoId: varchar('produto_id', { length: 50 })
      .notNull()
      .references(() => produtos.produtoId, { onDelete: 'restrict' }),
    depositoOrigemId: uuid('deposito_origem_id').references(() => depositos.id, {
      onDelete: 'restrict',
    }),
    depositoDestinoId: uuid('deposito_destino_id').references(
      () => depositos.id,
      { onDelete: 'restrict' },
    ),
    enderecoOrigemId: uuid('endereco_origem_id').references(() => enderecos.id, {
      onDelete: 'set null',
    }),
    enderecoDestinoId: uuid('endereco_destino_id').references(
      () => enderecos.id,
      { onDelete: 'set null' },
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

export const armazemLayouts = estoquePgSchema.table(
  'armazem_layouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'cascade' }),
    nome: varchar('nome', { length: 100 }).notNull(),
    gridCols: integer('grid_cols').notNull(),
    gridRows: integer('grid_rows').notNull(),
    versao: integer('versao').notNull().default(1),
    publicadoEm: timestamp('publicado_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('armazem_layouts_unidade_unique').on(table.unidadeId),
    index('armazem_layouts_unidade_id_idx').on(table.unidadeId),
  ],
);

export const armazemLayoutElementos = estoquePgSchema.table(
  'armazem_layout_elementos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    layoutId: uuid('layout_id')
      .notNull()
      .references(() => armazemLayouts.id, { onDelete: 'cascade' }),
    clientKey: varchar('client_key', { length: 64 }).notNull(),
    type: armazemLayoutElementoTipoEnum('type').notNull(),
    gx: integer('gx').notNull(),
    gy: integer('gy').notNull(),
    gw: integer('gw').notNull(),
    gh: integer('gh').notNull(),
    label: varchar('label', { length: 100 }).notNull(),
    levels: integer('levels'),
    zona: varchar('zona', { length: 2 }),
    ordem: integer('ordem').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('armazem_layout_elementos_layout_client_key_unique').on(
      table.layoutId,
      table.clientKey,
    ),
    index('armazem_layout_elementos_layout_id_idx').on(table.layoutId),
  ],
);

export const armazemLayoutSlots = estoquePgSchema.table(
  'armazem_layout_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    elementoId: uuid('elemento_id')
      .notNull()
      .references(() => armazemLayoutElementos.id, { onDelete: 'cascade' }),
    slotIndex: integer('slot_index').notNull().default(0),
    nivel: integer('nivel').notNull(),
    enderecoId: uuid('endereco_id').references(() => enderecos.id, {
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
    unique('armazem_layout_slots_elemento_slot_nivel_unique').on(
      table.elementoId,
      table.slotIndex,
      table.nivel,
    ),
    index('armazem_layout_slots_elemento_id_idx').on(table.elementoId),
    index('armazem_layout_slots_endereco_id_idx').on(table.enderecoId),
  ],
);

export const inventarioDivergenciaTipoEnum = pgEnum('inventario_divergencia_tipo', [
  'falta',
  'sobra',
  'endereco_vazio',
  'anomalia',
]);

export const inventarioDivergenciaStatusEnum = pgEnum(
  'inventario_divergencia_status',
  ['pendente', 'aprovada', 'reprovada', 'aplicada'],
);

export const inventarioDivergencias = estoquePgSchema.table(
  'inventario_divergencias',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    inventarioId: uuid('inventario_id')
      .notNull()
      .references(() => inventarios.id, { onDelete: 'cascade' }),
    contagemId: uuid('contagem_id').references(() => contagens.id, {
      onDelete: 'set null',
    }),
    enderecoId: uuid('endereco_id')
      .notNull()
      .references(() => enderecos.id, { onDelete: 'restrict' }),
    saldoEnderecoId: uuid('saldo_endereco_id').references(
      () => saldosEndereco.id,
      { onDelete: 'set null' },
    ),
    depositoId: uuid('deposito_id').references(() => depositos.id, {
      onDelete: 'set null',
    }),
    produtoId: varchar('produto_id', { length: 50 }).references(
      () => produtos.produtoId,
      { onDelete: 'set null' },
    ),
    sku: varchar('sku', { length: 100 }).notNull(),
    produtoNome: varchar('produto_nome', { length: 255 }).notNull(),
    quantidadeEsperada: numeric('quantidade_esperada', {
      precision: 12,
      scale: 3,
    }).notNull(),
    quantidadeContada: numeric('quantidade_contada', {
      precision: 12,
      scale: 3,
    }).notNull(),
    delta: numeric('delta', { precision: 12, scale: 3 }).notNull(),
    unidadeMedida: varchar('unidade_medida', { length: 20 }),
    lote: varchar('lote', { length: 100 }),
    tipo: inventarioDivergenciaTipoEnum('tipo').notNull(),
    status: inventarioDivergenciaStatusEnum('status')
      .notNull()
      .default('pendente'),
    aprovadaPor: integer('aprovada_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    aprovadaEm: timestamp('aprovada_em', { withTimezone: true }),
    motivoAprovacao: text('motivo_aprovacao'),
    reprovadaPor: integer('reprovada_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    reprovadaEm: timestamp('reprovada_em', { withTimezone: true }),
    motivoReprovacao: text('motivo_reprovacao'),
    documentoRef: varchar('documento_ref', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('inventario_divergencias_inventario_id_idx').on(table.inventarioId),
    index('inventario_divergencias_status_idx').on(table.status),
  ],
);

export const inventarioDivergenciaRecontagens = estoquePgSchema.table(
  'inventario_divergencia_recontagens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    inventarioId: uuid('inventario_id')
      .notNull()
      .references(() => inventarios.id, { onDelete: 'cascade' }),
    divergenciaId: uuid('divergencia_id')
      .notNull()
      .references(() => inventarioDivergencias.id, { onDelete: 'cascade' }),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasContagem.id, { onDelete: 'cascade' })
      .unique(),
    solicitadaPor: integer('solicitada_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    responsavelId: integer('responsavel_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    motivo: text('motivo').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('inventario_divergencia_recontagens_inventario_id_idx').on(
      table.inventarioId,
    ),
    index('inventario_divergencia_recontagens_divergencia_id_idx').on(
      table.divergenciaId,
    ),
    index('inventario_divergencia_recontagens_demanda_id_idx').on(
      table.demandaId,
    ),
  ],
);
