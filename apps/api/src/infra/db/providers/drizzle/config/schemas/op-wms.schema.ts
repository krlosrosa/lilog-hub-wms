import {
  index,
  integer,
  pgEnum,
  pgSchema,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema.js';
import { mapaGrupos } from './expedicao.schema.js';
import { unidades } from './master-data.schema.js';
import {
  sessaoFuncionarios,
  sessoesTrabalho,
} from './sessao-operacao.schema.js';

export const opWmsPgSchema = pgSchema('op_wms');

export const demandaSeparacaoStatusEnum = pgEnum('demanda_separacao_status_type', [
  'pendente',
  'em_andamento',
  'concluida',
  'cancelada',
]);

export const demandaFuncionarioPapelEnum = pgEnum(
  'demanda_funcionario_papel_type',
  ['responsavel', 'auxiliar'],
);

export const demandasSeparacao = opWmsPgSchema.table(
  'demandas_separacao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    sessaoId: uuid('sessao_id')
      .notNull()
      .references(() => sessoesTrabalho.id, { onDelete: 'cascade' }),
    mapaGrupoId: uuid('mapa_grupo_id')
      .notNull()
      .references(() => mapaGrupos.id, { onDelete: 'restrict' }),
    sessaoFuncionarioId: uuid('sessao_funcionario_id')
      .notNull()
      .references(() => sessaoFuncionarios.id, { onDelete: 'cascade' }),
    status: demandaSeparacaoStatusEnum('status').notNull().default('pendente'),
    atribuidoPor: integer('atribuido_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    atribuidoEm: timestamp('atribuido_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    iniciadoEm: timestamp('iniciado_em', { withTimezone: true }),
    finalizadoEm: timestamp('finalizado_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('demandas_separacao_mapa_grupo_unique').on(table.mapaGrupoId),
    index('demandas_separacao_sessao_id_idx').on(table.sessaoId),
    index('demandas_separacao_sessao_funcionario_idx').on(
      table.sessaoFuncionarioId,
      table.sessaoId,
    ),
    index('demandas_separacao_unidade_id_idx').on(table.unidadeId),
  ],
);

export const demandaOperacionalFuncionarios = opWmsPgSchema.table(
  'demanda_operacional_funcionarios',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    demandaId: uuid('demanda_id')
      .notNull()
      .references(() => demandasSeparacao.id, { onDelete: 'cascade' }),
    sessaoFuncionarioId: uuid('sessao_funcionario_id')
      .notNull()
      .references(() => sessaoFuncionarios.id, { onDelete: 'cascade' }),
    papel: demandaFuncionarioPapelEnum('papel').notNull().default('auxiliar'),
    entrouEm: timestamp('entrou_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
    saiuEm: timestamp('saiu_em', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('demanda_oper_func_unique').on(
      table.demandaId,
      table.sessaoFuncionarioId,
    ),
    index('demanda_oper_func_demanda_id_idx').on(table.demandaId),
  ],
);
