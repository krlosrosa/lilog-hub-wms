import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgSchema,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { funcionarios, users } from './auth.schema.js';
import { unidades } from './master-data.schema.js';

export const sessaoOperacaoPgSchema = pgSchema('sessao_operacao');

export const sessaoTrabalhoStatusEnum = pgEnum('sessao_trabalho_status_type', [
  'planejada',
  'aberta',
  'encerrada',
  'cancelada',
]);

export const sessaoPresencaStatusEnum = pgEnum('sessao_presenca_status_type', [
  'esperado',
  'presente',
  'falta',
  'atestado',
  'folga',
  'atraso',
]);

export const sessaoPausaTipoEnum = pgEnum('sessao_pausa_tipo_type', [
  'termica',
  'refeicao',
  'outros',
]);

export const sessaoVinculoTipoEnum = pgEnum('sessao_vinculo_tipo_type', [
  'titular',
  'apoio',
]);

export const equipes = sessaoOperacaoPgSchema.table(
  'equipes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    nome: varchar('nome', { length: 100 }).notNull(),
    liderUserId: integer('lider_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    area: varchar('area', { length: 50 }),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique('equipes_unidade_nome_unique').on(table.unidadeId, table.nome)],
);

export const equipeFuncionarios = sessaoOperacaoPgSchema.table(
  'equipe_funcionarios',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    equipeId: uuid('equipe_id')
      .notNull()
      .references(() => equipes.id, { onDelete: 'cascade' }),
    funcionarioId: integer('funcionario_id')
      .notNull()
      .references(() => funcionarios.id, { onDelete: 'restrict' }),
    vigenciaInicio: date('vigencia_inicio'),
    vigenciaFim: date('vigencia_fim'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('equipe_funcionarios_equipe_funcionario_unique').on(
      table.equipeId,
      table.funcionarioId,
    ),
    index('equipe_funcionarios_funcionario_id_idx').on(table.funcionarioId),
  ],
);

export const escalasTrabalho = sessaoOperacaoPgSchema.table(
  'escalas_trabalho',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    equipeId: uuid('equipe_id')
      .notNull()
      .references(() => equipes.id, { onDelete: 'restrict' }),
    nome: varchar('nome', { length: 100 }).notNull(),
    horaInicioPlanejada: time('hora_inicio_planejada').notNull(),
    horaFimPlanejada: time('hora_fim_planejada').notNull(),
    cruzaMeiaNoite: boolean('cruza_meia_noite').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('escalas_trabalho_equipe_nome_unique').on(table.equipeId, table.nome),
  ],
);

export const sessoesTrabalho = sessaoOperacaoPgSchema.table(
  'sessoes_trabalho',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    escalaId: uuid('escala_id')
      .notNull()
      .references(() => escalasTrabalho.id, { onDelete: 'restrict' }),
    equipeId: uuid('equipe_id')
      .notNull()
      .references(() => equipes.id, { onDelete: 'restrict' }),
    dataReferencia: date('data_referencia').notNull(),
    inicioPlanejado: timestamp('inicio_planejado', {
      withTimezone: true,
    }).notNull(),
    fimPlanejado: timestamp('fim_planejado', { withTimezone: true }).notNull(),
    inicioReal: timestamp('inicio_real', { withTimezone: true }),
    fimReal: timestamp('fim_real', { withTimezone: true }),
    status: sessaoTrabalhoStatusEnum('status').notNull().default('planejada'),
    abertaPorUserId: integer('aberta_por_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    encerradaPorUserId: integer('encerrada_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('sessoes_trabalho_escala_data_referencia_unique').on(
      table.escalaId,
      table.dataReferencia,
    ),
    index('sessoes_trabalho_unidade_data_status_idx').on(
      table.unidadeId,
      table.dataReferencia,
      table.status,
    ),
    index('sessoes_trabalho_equipe_data_idx').on(
      table.equipeId,
      table.dataReferencia,
    ),
  ],
);

export const sessaoFuncionarios = sessaoOperacaoPgSchema.table(
  'sessao_funcionarios',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessaoId: uuid('sessao_id')
      .notNull()
      .references(() => sessoesTrabalho.id, { onDelete: 'cascade' }),
    funcionarioId: integer('funcionario_id')
      .notNull()
      .references(() => funcionarios.id, { onDelete: 'restrict' }),
    status: sessaoPresencaStatusEnum('status').notNull().default('esperado'),
    checkIn: timestamp('check_in', { withTimezone: true }),
    checkOut: timestamp('check_out', { withTimezone: true }),
    registradoPorUserId: integer('registrado_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    observacao: text('observacao'),
    tipoVinculo: sessaoVinculoTipoEnum('tipo_vinculo')
      .notNull()
      .default('titular'),
    equipeOrigemId: uuid('equipe_origem_id').references(() => equipes.id, {
      onDelete: 'set null',
    }),
    sessaoOrigemId: uuid('sessao_origem_id').references(() => sessoesTrabalho.id, {
      onDelete: 'set null',
    }),
    apoioInicio: timestamp('apoio_inicio', { withTimezone: true }),
    apoioFim: timestamp('apoio_fim', { withTimezone: true }),
    apoioRegistradoPorUserId: integer('apoio_registrado_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('sessao_funcionarios_sessao_funcionario_unique').on(
      table.sessaoId,
      table.funcionarioId,
    ),
    index('sessao_funcionarios_apoio_ativo_idx')
      .on(table.sessaoId)
      .where(
        sql`${table.tipoVinculo} = 'apoio' and ${table.apoioFim} is null`,
      ),
  ],
);

export const sessaoFuncionarioPausas = sessaoOperacaoPgSchema.table(
  'sessao_funcionario_pausas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessaoFuncionarioId: uuid('sessao_funcionario_id')
      .notNull()
      .references(() => sessaoFuncionarios.id, { onDelete: 'cascade' }),
    tipo: sessaoPausaTipoEnum('tipo').notNull(),
    inicio: timestamp('inicio', { withTimezone: true }).notNull(),
    fim: timestamp('fim', { withTimezone: true }),
    registradoPorUserId: integer('registrado_por_user_id').references(
      () => users.id,
      { onDelete: 'set null' },
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
    index('sessao_funcionario_pausas_sessao_funcionario_id_idx').on(
      table.sessaoFuncionarioId,
    ),
    uniqueIndex('sessao_funcionario_pausas_um_aberto_idx')
      .on(table.sessaoFuncionarioId)
      .where(sql`${table.fim} is null`),
  ],
);
