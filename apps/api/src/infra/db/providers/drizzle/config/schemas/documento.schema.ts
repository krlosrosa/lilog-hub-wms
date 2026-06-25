import {
  integer,
  pgEnum,
  pgSchema,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const documentoPgSchema = pgSchema('documento');

export const documentoStatusEnum = pgEnum('documento_status', [
  'pending',
  'ativo',
  'deletado',
]);

export const documentos = documentoPgSchema.table('documentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  chave: varchar('chave', { length: 500 }).notNull().unique(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  tamanho: integer('tamanho').notNull(),
  entidadeTipo: varchar('entidade_tipo', { length: 50 }),
  entidadeId: varchar('entidade_id', { length: 100 }),
  status: documentoStatusEnum('status').notNull().default('pending'),
  uploadedBy: integer('uploaded_by'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
