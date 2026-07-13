import type {
  CompleteSyncBatchInput,
  CreateSyncBatchInput,
} from '../../model/sync/sync.model.js';

export type { CompleteSyncBatchInput, CreateSyncBatchInput };

export const SYNC_REPOSITORY = 'ISyncRepository';

export type SyncBatchRecord = {
  id: string;
  batchId: string;
  adapter: string;
  protocolVersion: number;
  aggregateType: string;
  aggregateId: string;
  unidadeId: string;
  baseRevision: number;
  finalRevision: number | null;
  status: string;
  appliedCount: number;
  skippedCount: number;
  errorCount: number;
  userId: number | null;
  deviceId: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type SyncOperationRecord = {
  id: string;
  batchId: string;
  opId: string;
  opType: string;
  sequence: number;
  status: string;
  errorMessage: string | null;
  appliedAt: Date;
};

export type SyncAggregateRevisionRecord = {
  id: string;
  adapter: string;
  aggregateId: string;
  unidadeId: string;
  revision: number;
  updatedAt: Date;
};

export type CreateSyncOperationInput = {
  batchId: string;
  opId: string;
  opType: string;
  sequence: number;
  status: string;
  errorMessage?: string;
};

export type RecordSyncChangeInput = {
  adapter: string;
  unidadeId: string;
  entityType: string;
  entityId: string;
  operation: 'upsert' | 'delete';
  revision: number;
  payload?: string;
};

export interface ISyncRepository {
  findBatchByBatchIdAndAdapter(
    batchId: string,
    adapter: string,
  ): Promise<SyncBatchRecord | null>;

  createBatch(input: CreateSyncBatchInput): Promise<SyncBatchRecord>;

  completeBatch(
    id: string,
    result: CompleteSyncBatchInput,
  ): Promise<void>;

  findOperationByBatchAndOpId(
    batchId: string,
    opId: string,
  ): Promise<SyncOperationRecord | null>;

  createOperation(
    input: CreateSyncOperationInput,
  ): Promise<SyncOperationRecord>;

  getAggregateRevision(adapter: string, aggregateId: string): Promise<number>;

  incrementAggregateRevision(
    adapter: string,
    aggregateId: string,
    unidadeId: string,
  ): Promise<number>;

  recordChange(input: RecordSyncChangeInput): Promise<void>;
}
