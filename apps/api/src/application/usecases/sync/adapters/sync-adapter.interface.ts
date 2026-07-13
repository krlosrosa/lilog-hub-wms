import type {
  SyncOperation,
  SyncOperationResult,
} from '../../../../domain/model/sync/sync.model.js';

export interface SyncApplyContext {
  aggregateId: string;
  unidadeId: string;
  userId: number | null;
  resourceId: string | null;
  idMappings: Map<string, string>;
}

export interface ISyncAdapter {
  readonly adapter: string;
  readonly protocolVersion: number;
  readonly allowsPartialSuccess: boolean;

  validateAggregate(
    aggregateId: string,
    unidadeId: string,
    userId: number | null,
  ): Promise<void>;

  sortOperations(operations: SyncOperation[]): SyncOperation[];

  apply(
    operation: SyncOperation,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult>;
}
