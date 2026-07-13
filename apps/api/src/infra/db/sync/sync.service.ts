import { Inject, Injectable } from '@nestjs/common';

import type { CompleteSyncBatchInput } from '../../../domain/model/sync/sync.model.js';
import {
  SYNC_REPOSITORY,
  type CreateSyncOperationInput,
  type ISyncRepository,
  type RecordSyncChangeInput,
  type SyncBatchRecord,
  type SyncOperationRecord,
} from '../../../domain/repositories/sync/sync.repository.js';
import { DRIZZLE_PROVIDER, type DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { completeSyncBatchDb } from './complete-sync-batch.drizzle.js';
import { createSyncBatchDb } from './create-sync-batch.drizzle.js';
import {
  createSyncOperationDb,
  findSyncOperationByBatchAndOpIdDb,
} from './create-sync-operation.drizzle.js';
import {
  findSyncBatchByBatchIdAndAdapterDb,
} from './find-sync-batch.drizzle.js';
import {
  getAggregateRevisionDb,
  incrementAggregateRevisionDb,
} from './get-aggregate-revision.drizzle.js';
import { recordSyncChangeDb } from './record-sync-change.drizzle.js';
import type { CreateSyncBatchInput } from '../../../domain/repositories/sync/sync.repository.js';

@Injectable()
export class SyncService implements ISyncRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  findBatchByBatchIdAndAdapter(
    batchId: string,
    adapter: string,
  ): Promise<SyncBatchRecord | null> {
    return findSyncBatchByBatchIdAndAdapterDb(this.db, batchId, adapter);
  }

  createBatch(input: CreateSyncBatchInput): Promise<SyncBatchRecord> {
    return createSyncBatchDb(this.db, input);
  }

  completeBatch(id: string, result: CompleteSyncBatchInput): Promise<void> {
    return completeSyncBatchDb(this.db, id, result);
  }

  findOperationByBatchAndOpId(
    batchId: string,
    opId: string,
  ): Promise<SyncOperationRecord | null> {
    return findSyncOperationByBatchAndOpIdDb(this.db, batchId, opId);
  }

  createOperation(
    input: CreateSyncOperationInput,
  ): Promise<SyncOperationRecord> {
    return createSyncOperationDb(this.db, input);
  }

  getAggregateRevision(adapter: string, aggregateId: string): Promise<number> {
    return getAggregateRevisionDb(this.db, adapter, aggregateId);
  }

  incrementAggregateRevision(
    adapter: string,
    aggregateId: string,
    unidadeId: string,
  ): Promise<number> {
    return incrementAggregateRevisionDb(this.db, adapter, aggregateId, unidadeId);
  }

  recordChange(input: RecordSyncChangeInput): Promise<void> {
    return recordSyncChangeDb(this.db, input);
  }
}
