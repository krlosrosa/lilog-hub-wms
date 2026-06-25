import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { unidades } from './master-data.schema.js';

export const transportePgSchema = pgSchema('transporte');

export const transportadoraStatusEnum = pgEnum('transportadora_status_type', [
  'ativa',
  'inativa',
]);

export const tipoCargaEnum = pgEnum('tipo_carga_type', ['seco', 'refrigerado']);

export const transportadoras = transportePgSchema.table(
  'transportadoras',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    idRavexTransportadora: integer('id_ravex_transportadora').notNull(),
    nome: varchar('nome', { length: 255 }).notNull(),
    cnpj: varchar('cnpj', { length: 14 }).notNull(),
    status: transportadoraStatusEnum('status').notNull().default('ativa'),
    quantidadeVeiculos: integer('quantidade_veiculos').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('transportadoras_unidade_ravex_unique').on(
      table.unidadeId,
      table.idRavexTransportadora,
    ),
  ],
);

export const transportadoraPlacas = transportePgSchema.table(
  'transportadora_placas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transportadoraId: uuid('transportadora_id')
      .notNull()
      .references(() => transportadoras.id, { onDelete: 'cascade' }),
    idRavexVeiculo: integer('id_ravex_veiculo').notNull(),
    placa: varchar('placa', { length: 10 }).notNull(),
    tipoVeiculoIdRavex: integer('tipo_veiculo_id_ravex'),
    tipoVeiculoNome: varchar('tipo_veiculo_nome', { length: 100 }),
    peso: numeric('peso', { precision: 12, scale: 2 }),
    cubagem: numeric('cubagem', { precision: 12, scale: 2 }),
    tara: numeric('tara', { precision: 12, scale: 2 }),
    estrangeiro: boolean('estrangeiro').notNull().default(false),
    perfilTarifaId: uuid('perfil_tarifa_id').references(() => perfisTarifas.id, {
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
    unique('transportadora_placas_transportadora_placa_unique').on(
      table.transportadoraId,
      table.placa,
    ),
    unique('transportadora_placas_transportadora_ravex_veiculo_unique').on(
      table.transportadoraId,
      table.idRavexVeiculo,
    ),
  ],
);

export const perfisTarifas = transportePgSchema.table(
  'perfis_tarifas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    unidadeId: varchar('unidade_id', { length: 50 })
      .notNull()
      .references(() => unidades.id, { onDelete: 'restrict' }),
    idRavex: integer('id_ravex').notNull(),
    nome: varchar('nome', { length: 255 }).notNull(),
    descricao: varchar('descricao', { length: 500 }),
    peso: numeric('peso', { precision: 12, scale: 2 }).notNull(),
    cubagem: numeric('cubagem', { precision: 12, scale: 2 }),
    tipoCarga: tipoCargaEnum('tipo_carga').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('perfis_tarifas_unidade_ravex_unique').on(
      table.unidadeId,
      table.idRavex,
    ),
  ],
);

export const perfisTarifasFaixasKm = transportePgSchema.table(
  'perfis_tarifas_faixas_km',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    perfilTarifaId: uuid('perfil_tarifa_id')
      .notNull()
      .references(() => perfisTarifas.id, { onDelete: 'cascade' }),
    kmInicial: numeric('km_inicial', { precision: 10, scale: 2 }).notNull(),
    kmFinal: numeric('km_final', { precision: 10, scale: 2 }),
    valor: numeric('valor', { precision: 12, scale: 2 }).notNull(),
    itinerario: text('itinerario'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('perfis_tarifas_faixas_km_perfil_km_inicial_unique').on(
      table.perfilTarifaId,
      table.kmInicial,
    ),
  ],
);
