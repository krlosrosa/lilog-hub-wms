import { z } from 'zod';

export const SYNC_PROTOCOL_VERSION = 2 as const;

export const SYNC_ADAPTERS = ['recebimento-v2'] as const;
export type SyncAdapter = (typeof SYNC_ADAPTERS)[number];

export const SyncOperationStatusSchema = z.enum([
  'applied',
  'skipped',
  'conflict',
  'rejected',
  'retryable',
]);
export type SyncOperationStatus = z.infer<typeof SyncOperationStatusSchema>;

export const SyncBatchStatusSchema = z.enum([
  'processing',
  'completed',
  'failed',
]);
export type SyncBatchStatus = z.infer<typeof SyncBatchStatusSchema>;

export const SyncAttachmentSchema = z.object({
  mediaId: z.string().uuid(),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  relatedId: z.string().min(1),
  checksum: z.string().optional(),
  uploadedUrl: z.url().optional(),
});
export type SyncAttachment = z.infer<typeof SyncAttachmentSchema>;

export const SyncOperationSchema = z.object({
  opId: z.string().uuid(),
  type: z.string().min(1).max(100),
  sequence: z.number().int().nonnegative().default(0),
  dependsOn: z.array(z.string().uuid()).default([]),
  idempotencyKey: z.string().min(1).max(256),
  payload: z.unknown(),
  attachments: z.array(SyncAttachmentSchema).default([]),
  createdAt: z.number().int().nonnegative(),
});
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncBatchRequestSchema = z.object({
  protocolVersion: z.literal(SYNC_PROTOCOL_VERSION),
  adapter: z.enum(SYNC_ADAPTERS),
  batchId: z.string().uuid(),
  unidadeId: z.string().min(1).max(50),
  aggregateType: z.string().min(1).max(50),
  aggregateId: z.string().uuid(),
  baseRevision: z.number().int().nonnegative().default(0),
  operations: z.array(SyncOperationSchema).min(1),
});
export type SyncBatchRequest = z.infer<typeof SyncBatchRequestSchema>;

export const SyncOperationResultSchema = z.object({
  opId: z.string().uuid(),
  status: SyncOperationStatusSchema,
  message: z.string().optional(),
  serverId: z.string().optional(),
  serverPesagemId: z.string().optional(),
  serverRevision: z.number().int().nonnegative().optional(),
});
export type SyncOperationResult = z.infer<typeof SyncOperationResultSchema>;

export const SyncConflictDetailSchema = z.object({
  section: z.string(),
  serverValue: z.unknown().optional(),
  localValue: z.unknown().optional(),
});
export type SyncConflictDetail = z.infer<typeof SyncConflictDetailSchema>;

export const SyncBatchResultSchema = z.object({
  batchId: z.string().uuid(),
  adapter: z.string(),
  aggregateId: z.string().uuid(),
  resourceId: z.string().optional(),
  serverRevision: z.number().int().nonnegative(),
  appliedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  operations: z.array(SyncOperationResultSchema),
  conflictDetails: z.array(SyncConflictDetailSchema).optional(),
});
export type SyncBatchResult = z.infer<typeof SyncBatchResultSchema>;

export const CreateSyncBatchInputSchema = z.object({
  batchId: z.string().uuid(),
  adapter: z.string(),
  protocolVersion: z.number().int(),
  aggregateType: z.string(),
  aggregateId: z.string(),
  unidadeId: z.string(),
  baseRevision: z.number().int(),
  userId: z.number().int().nullable().optional(),
  deviceId: z.string().optional(),
});
export type CreateSyncBatchInput = z.infer<typeof CreateSyncBatchInputSchema>;

export const CompleteSyncBatchInputSchema = z.object({
  finalRevision: z.number().int().nonnegative(),
  status: SyncBatchStatusSchema,
  appliedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
});
export type CompleteSyncBatchInput = z.infer<
  typeof CompleteSyncBatchInputSchema
>;
