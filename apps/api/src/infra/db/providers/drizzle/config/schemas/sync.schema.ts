import {
  bigint,
  index,
  integer,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const syncPgSchema = pgSchema('sync');

export const syncBatches = syncPgSchema.table(
  'sync_batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: varchar('batch_id', { length: 64 }).notNull(),
    adapter: varchar('adapter', { length: 50 }).notNull(),
    protocolVersion: smallint('protocol_version').notNull().default(2),
    aggregateType: varchar('aggregate_type', { length: 50 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 100 }).notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    baseRevision: integer('base_revision').notNull().default(0),
    finalRevision: integer('final_revision'),
    status: varchar('status', { length: 20 }).notNull().default('processing'),
    appliedCount: integer('applied_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    userId: integer('user_id'),
    deviceId: varchar('device_id', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('sync_batches_batch_adapter_uidx').on(
      table.batchId,
      table.adapter,
    ),
    index('sync_batches_aggregate_idx').on(
      table.aggregateType,
      table.aggregateId,
    ),
    index('sync_batches_unidade_idx').on(table.unidadeId),
    index('sync_batches_created_at_idx').on(table.createdAt),
  ],
);

export const syncOperations = syncPgSchema.table(
  'sync_operations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => syncBatches.id, { onDelete: 'cascade' }),
    opId: varchar('op_id', { length: 128 }).notNull(),
    opType: varchar('op_type', { length: 100 }).notNull(),
    sequence: bigint('sequence', { mode: 'number' }).notNull().default(0),
    status: varchar('status', { length: 20 }).notNull(),
    errorMessage: text('error_message'),
    appliedAt: timestamp('applied_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('sync_operations_batch_op_uidx').on(
      table.batchId,
      table.opId,
    ),
    uniqueIndex('sync_operations_op_uidx').on(table.opId),
    index('sync_operations_batch_idx').on(table.batchId),
  ],
);

export const syncOperationLogs = syncPgSchema.table(
  'sync_operation_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => syncBatches.id, { onDelete: 'cascade' }),
    opId: varchar('op_id', { length: 128 }).notNull(),
    opType: varchar('op_type', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }).notNull(),
    durationMs: integer('duration_ms').notNull().default(0),
    attempt: integer('attempt').notNull().default(1),
    errorMessage: text('error_message'),
    response: text('response'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('sync_operation_logs_batch_idx').on(table.batchId),
    index('sync_operation_logs_op_idx').on(table.opId),
    index('sync_operation_logs_created_at_idx').on(table.createdAt),
  ],
);

export const syncAggregateRevisions = syncPgSchema.table(
  'sync_aggregate_revisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adapter: varchar('adapter', { length: 50 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 100 }).notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    revision: integer('revision').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('sync_aggregate_revisions_adapter_aggregate_uidx').on(
      table.adapter,
      table.aggregateId,
    ),
    index('sync_aggregate_revisions_unidade_idx').on(table.unidadeId),
  ],
);

export const syncChanges = syncPgSchema.table(
  'sync_changes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adapter: varchar('adapter', { length: 50 }).notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    operation: varchar('operation', { length: 10 }).notNull(),
    revision: integer('revision').notNull(),
    payload: text('payload'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('sync_changes_adapter_unidade_revision_idx').on(
      table.adapter,
      table.unidadeId,
      table.revision,
    ),
    index('sync_changes_entity_idx').on(table.entityType, table.entityId),
  ],
);
