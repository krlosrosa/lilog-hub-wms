import type { ConflictResolver } from '../conflict/ConflictResolver.js';
import { ServerWinsConflictResolver } from '../conflict/ConflictResolver.js';
import type { Operation } from '../operations/Operation.js';

export interface SyncStrategyContext {
  now: number;
  online: boolean;
  pendingCount: number;
  sessionId: string;
}

export interface SyncStrategy {
  batchSize: number;
  maxBatchBytes: number;
  parallelism: number;
  debounceMs: number;
  shouldPush(ctx: SyncStrategyContext): boolean;
  shouldPull(ctx: SyncStrategyContext): boolean;
  shouldRetry(operation: Operation, error: unknown): boolean;
  shouldCompact(ctx: SyncStrategyContext): boolean;
  conflictStrategyFor(operation: Operation): ConflictResolver;
}

export class DefaultSyncStrategy implements SyncStrategy {
  batchSize = 50;
  maxBatchBytes = 256 * 1024;
  parallelism = 3;
  debounceMs = 300;

  shouldPush(ctx: SyncStrategyContext): boolean {
    return ctx.online && ctx.pendingCount > 0;
  }

  shouldPull(ctx: SyncStrategyContext): boolean {
    return ctx.online;
  }

  shouldRetry(operation: Operation, _error: unknown): boolean {
    return operation.retryCount < 7;
  }

  shouldCompact(ctx: SyncStrategyContext): boolean {
    return ctx.pendingCount > 0;
  }

  conflictStrategyFor(_operation: Operation): ConflictResolver {
    return new ServerWinsConflictResolver();
  }
}
