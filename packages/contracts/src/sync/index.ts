import { z } from 'zod';

// ---------------------------------------------------------------------------
// Protocol version
// ---------------------------------------------------------------------------
export const SYNC_PROTOCOL_VERSION = 2 as const;

// ---------------------------------------------------------------------------
// Recebimento V2 operation type constants
// ---------------------------------------------------------------------------
export const RECEBIMENTO_V2_OP_TYPES = {
  CHECKLIST_UPSERT: 'recebimento.checklist.upsert',
  TEMPERATURA_UPSERT: 'recebimento.temperatura.upsert',
  ITEM_REMOVE_BY_PRODUTO: 'recebimento.item.remove_by_produto',
  ITEM_CONFERIR: 'recebimento.item.conferir',
  ITEM_LINHA_REMOVE: 'recebimento.item_linha.remove',
  PALETE_REMOVE: 'recebimento.palete.remove',
  PESAGEM_REMOVE: 'recebimento.pesagem.remove',
  AVARIA_CLEAR: 'recebimento.avaria.clear',
  AVARIA_REGISTRAR: 'recebimento.avaria.registrar',
  AVARIA_REMOVER: 'recebimento.avaria.remover',
  CONFERENCIA_SUSPENDER: 'recebimento.conferencia.suspender',
  CONFERENCIA_RETOMAR: 'recebimento.conferencia.retomar',
  CONFERENCIA_ENCERRAR: 'recebimento.conferencia.encerrar',
} as const;

export type RecebimentoV2OpType =
  (typeof RECEBIMENTO_V2_OP_TYPES)[keyof typeof RECEBIMENTO_V2_OP_TYPES];

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const SyncAttachmentSchema = z.object({
  mediaId: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  relatedId: z.string(),
  checksum: z.string().optional(),
  uploadedUrl: z.string().optional(),
});
export type SyncAttachment = z.infer<typeof SyncAttachmentSchema>;

export const SyncOperationSchema = z.object({
  opId: z.string().uuid(),
  type: z.string(),
  sequence: z.int().gte(0),
  dependsOn: z.array(z.string()).default([]),
  idempotencyKey: z.string(),
  payload: z.unknown(),
  attachments: z.array(SyncAttachmentSchema).default([]),
  createdAt: z.number().int(),
});
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncBatchRequestSchema = z.object({
  protocolVersion: z.literal(2),
  adapter: z.string(),
  batchId: z.string().uuid(),
  unidadeId: z.string(),
  aggregateType: z.string(),
  aggregateId: z.string().uuid(),
  baseRevision: z.int().gte(0).default(0),
  operations: z.array(SyncOperationSchema).min(1),
});
export type SyncBatchRequest = z.infer<typeof SyncBatchRequestSchema>;

export const SyncOperationResultSchema = z.object({
  opId: z.string(),
  status: z.enum(['applied', 'skipped', 'conflict', 'rejected', 'retryable']),
  message: z.string().optional(),
  serverId: z.string().optional(),
  /** ID da pesagem criada (caixa PVAR) em recebimento.item.conferir */
  serverPesagemId: z.string().optional(),
  serverRevision: z.number().int().optional(),
});
export type SyncOperationResult = z.infer<typeof SyncOperationResultSchema>;

export const SyncBatchResultSchema = z.object({
  batchId: z.string(),
  adapter: z.string(),
  aggregateId: z.string(),
  resourceId: z.string().optional(),
  serverRevision: z.number().int(),
  appliedCount: z.number().int(),
  skippedCount: z.number().int(),
  errorCount: z.number().int(),
  operations: z.array(SyncOperationResultSchema),
});
export type SyncBatchResult = z.infer<typeof SyncBatchResultSchema>;

export const SyncConflictSchema = z.object({
  conflictId: z.string().uuid(),
  batchId: z.string(),
  aggregateId: z.string(),
  adapter: z.string(),
  serverRevision: z.number().int(),
  localRevision: z.number().int(),
  sections: z.array(z.string()),
  serverSnapshot: z.unknown().optional(),
  detectedAt: z.number(),
});
export type SyncConflict = z.infer<typeof SyncConflictSchema>;

// ---------------------------------------------------------------------------
// Sync local state types (PWA side)
// ---------------------------------------------------------------------------

export type SyncOperationStatus =
  | 'pending'
  | 'blocked'
  | 'syncing'
  | 'retry'
  | 'synced'
  | 'conflict'
  | 'rejected';

export type SyncOperationLifecycleStatus =
  | 'PENDING'
  | 'WAITING_DEPENDENCY'
  | 'SENDING'
  | 'SENT'
  | 'CONFIRMED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export interface LocalSyncOperation {
  id: string;
  aggregateId: string;
  module: string;
  opType: string;
  sequence: number;
  dependsOn: string[];
  idempotencyKey: string;
  payload: unknown;
  attachmentIds: string[];
  status: SyncOperationStatus;
  lifecycleStatus?: SyncOperationLifecycleStatus;
  attempts: number;
  nextAttemptAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Process state types
// ---------------------------------------------------------------------------

export type ProcessStatus =
  | 'notDownloaded'
  | 'downloading'
  | 'ready'
  | 'working'
  | 'pendingSync'
  | 'syncing'
  | 'conflict'
  | 'completed'
  | 'error';

// ---------------------------------------------------------------------------
// Bootstrap / dataset types
// ---------------------------------------------------------------------------

export interface DatasetCursor {
  adapter: string;
  dataset: string;
  cursor: string;
  lastSyncedAt: number;
}

export interface BootstrapManifest {
  manifestId: string;
  demandId: string;
  unidadeId: string;
  adapter: string;
  serverRevision: number;
  generatedAt: number;
  requiredDatasets: string[];
  optionalDatasets: string[];
  estimatedBytes: number;
}
