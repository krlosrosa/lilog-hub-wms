import {
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { recebimentoPgSchema } from './recebimento.schema.js';

export const offlineImportLogs = recebimentoPgSchema.table(
  'offline_import_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    exportId: varchar('export_id', { length: 64 }).notNull(),
    demandId: varchar('demand_id', { length: 100 }).notNull(),
    entryKey: varchar('entry_key', { length: 128 }).notNull(),
    endpoint: varchar('endpoint', { length: 500 }).notNull(),
    method: varchar('method', { length: 10 }).notNull(),
    label: varchar('label', { length: 500 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    errorMessage: text('error_message'),
    userId: integer('user_id'),
    appliedAt: timestamp('applied_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('offline_import_logs_export_entry_uidx').on(
      table.exportId,
      table.entryKey,
    ),
  ],
);
