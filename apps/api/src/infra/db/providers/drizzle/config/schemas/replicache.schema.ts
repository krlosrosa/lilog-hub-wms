import {
  index,
  integer,
  jsonb,
  pgSchema,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const replicachePgSchema = pgSchema('replicache');

export const replicacheSpaces = replicachePgSchema.table('spaces', {
  spaceId: varchar('space_id', { length: 50 }).primaryKey(),
  version: integer('version').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const replicacheClients = replicachePgSchema.table(
  'clients',
  {
    clientId: varchar('client_id', { length: 100 }).primaryKey(),
    clientGroupId: varchar('client_group_id', { length: 100 }).notNull(),
    lastMutationId: integer('last_mutation_id').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('replicache_clients_group_idx').on(table.clientGroupId),
  ],
);

export const replicacheChanges = replicachePgSchema.table(
  'changes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    spaceId: varchar('space_id', { length: 50 }).notNull(),
    version: integer('version').notNull(),
    key: varchar('key', { length: 255 }).notNull(),
    op: varchar('op', { length: 10 }).notNull(),
    value: jsonb('value'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('replicache_changes_space_version_idx').on(
      table.spaceId,
      table.version,
    ),
  ],
);
