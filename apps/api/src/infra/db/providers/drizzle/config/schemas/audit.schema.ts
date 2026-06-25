import {
  integer,
  jsonb,
  pgSchema,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const auditPgSchema = pgSchema('audit');

export const auditLogs = auditPgSchema.table('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id'),
  userEmail: varchar('user_email', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  httpMethod: varchar('http_method', { length: 10 }).notNull(),
  httpPath: varchar('http_path', { length: 500 }).notNull(),
  httpStatus: integer('http_status').notNull(),
  payload: jsonb('payload'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
