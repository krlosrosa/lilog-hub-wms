import type { LocalSyncOperation, SyncConflict } from '@lilog/contracts';

// ---------------------------------------------------------------------------
// Repository interfaces
// ---------------------------------------------------------------------------

export interface IOperationQueue {
  enqueue(op: Omit<LocalSyncOperation, 'id' | 'attempts' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string>;
  markSyncing(id: string): Promise<void>;
  markDone(id: string, serverRevision: number): Promise<void>;
  markError(id: string, message: string, nextAttemptAt: number): Promise<void>;
  markRejected(id: string, message: string): Promise<void>;
  markConflict(id: string): Promise<void>;
  resetRetry(id: string): Promise<void>;
  getPendingByAggregate(aggregateId: string): Promise<LocalSyncOperation[]>;
  getBlockedByDependency(dependsOnId: string): Promise<LocalSyncOperation[]>;
}

export interface IRevisionStore {
  get(aggregateId: string): Promise<number | undefined>;
  set(aggregateId: string, revision: number): Promise<void>;
  getAll(): Promise<Record<string, number>>;
}

export interface IConflictStore {
  save(conflict: SyncConflict): Promise<void>;
  resolve(conflictId: string): Promise<void>;
  getPending(): Promise<SyncConflict[]>;
}

export interface ILeaseStore {
  acquire(aggregateId: string, deviceId: string, ttlMs: number): Promise<boolean>;
  release(aggregateId: string, deviceId: string): Promise<void>;
  isHeld(aggregateId: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: number;
}

export interface SyncEngineConfig {
  retryPolicy: RetryPolicy;
  autoSyncIntervalMs: number;
  debounceMs: number;
  connectivityProbeUrl: string;
  deviceId: string;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface PushResult {
  batchId: string;
  synced: number;
  failed: number;
  conflicts: number;
  lastError?: Error;
}

export interface PullResult {
  updated: number;
  cursor: string;
  hasMore: boolean;
}
