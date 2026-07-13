import {
  date,
  integer,
  pgSchema,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

import { unidades } from './master-data.schema.js';

export const authPgSchema = pgSchema('auth');

export const funcionarios = authPgSchema.table(
  'funcionarios',
  {
    id: serial('id').primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    matricula: varchar('matricula', { length: 50 }).notNull(),
    nome: varchar('nome', { length: 100 }).notNull(),
    cargo: varchar('cargo', { length: 50 }).notNull(),
    situacao: varchar('situacao', { length: 20 }).notNull().default('ativo'),
    dataAdmissao: date('data_admissao').notNull(),
    telefone: varchar('telefone', { length: 20 }),
    email: varchar('email', { length: 200 }),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('funcionarios_unidade_matricula_unique').on(
      table.unidadeId,
      table.matricula,
    ),
  ],
);

export const users = authPgSchema.table('users', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('operator'),
  status: varchar('status', { length: 20 }).notNull().default('ativo'),
  funcionarioId: integer('funcionario_id').references(() => funcionarios.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usuarioUnidades = authPgSchema.table(
  'usuario_unidades',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.unidadeId] }),
  ],
);

export const usuariosTerceiros = authPgSchema.table('usuarios_terceiros', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 100 }).notNull(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('viewer'),
  status: varchar('status', { length: 20 }).notNull().default('ativo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
