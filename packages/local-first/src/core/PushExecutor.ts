import {
  CancelledSyncError,
  ConflictSyncError,
  classifyError,
} from '../errors/index.js';
import { compactOperations } from '../domain/QueueCompactor.js';
import { getExecutableOperations } from '../domain/DependencyResolver.js';
import type { BatchOptimizer } from './BatchOptimizer.js';
import type { AggregateExecutionLock, ParallelismSemaphore } from './AggregateExecutionLock.js';
import type { SyncSession } from './SyncSession.js';
import type { EventBus } from '../events/EventBus.js';
import type { OperationQueue } from '../queue/OperationQueue.js';
import type { OperationRegistry } from '../operations/OperationRegistry.js';
import type { HttpAdapter } from '../network/HttpAdapter.js';
import type { CancellationToken } from '../ports/CancellationToken.js';
import type { Logger } from '../ports/Logger.js';
import type { MetricsPort } from '../ports/MetricsPort.js';
import type { SyncStrategy } from '../strategy/SyncStrategy.js';
import type { RetryPolicy } from '../retry/RetryPolicy.js';
import type { Operation } from '../operations/Operation.js';
import type { PushBatchResult } from '../types/index.js';

export interface PushExecutorDeps {
  queue: OperationQueue;
  registry: OperationRegistry;
  http: HttpAdapter;
  batchOptimizer: BatchOptimizer;
  aggregateLock: AggregateExecutionLock;
  semaphore: ParallelismSemaphore;
  retryPolicy: RetryPolicy;
  strategy: SyncStrategy;
  events: EventBus;
  logger: Logger;
  metrics: MetricsPort;
}

export class PushExecutor {
  constructor(private readonly deps: PushExecutorDeps) {}

  async execute(
    session: SyncSession,
    token: CancellationToken,
  ): Promise<PushBatchResult[]> {
    token.throwIfCancelled();
    await this.deps.events.emit('PushStarted', { sessionId: session.sessionId });

    const now = Date.now();
    let pending = await this.deps.queue.getPending();

    if (this.deps.strategy.shouldCompact({ now, online: true, pendingCount: pending.length, sessionId: session.sessionId })) {
      const compacted = compactOperations(pending);
      pending = compacted.operations;
      if (compacted.removedIds.length > 0) {
        await this.deps.queue.remove(compacted.removedIds);
      }
    }

    const executable = getExecutableOperations(pending, new Set(), now);
    const batches = this.deps.batchOptimizer.buildBatches(executable);
    const results: PushBatchResult[] = [];

    for (const batch of batches) {
      token.throwIfCancelled();
      await this.deps.events.emit('BatchBuilt', { batch, sessionId: session.sessionId });

      const releaseParallel = await this.deps.semaphore.acquire();
      try {
        const acquired = await this.deps.aggregateLock.acquire(batch.aggregateId);
        if (!acquired) continue;

        try {
          const claimed = await this.deps.queue.claim(batch.operationIds);
          if (claimed.length === 0) continue;

          const result = await this.pushBatch(batch.operations, session, token);
          results.push(result);
          session.batches++;
          session.bytesSent += result.bytesSent;
        } finally {
          await this.deps.aggregateLock.release(batch.aggregateId);
        }
      } finally {
        releaseParallel();
      }
    }

    await this.deps.events.emit('PushFinished', {
      sessionId: session.sessionId,
      batches: batches.length,
    });

    return results;
  }

  private async pushBatch(
    operations: Operation[],
    session: SyncSession,
    token: CancellationToken,
  ): Promise<PushBatchResult> {
    const succeeded: string[] = [];
    const failed: Array<{ operationId: string; error: string }> = [];
    const conflicts: Array<{ operationId: string; serverState: unknown }> = [];
    let bytesSent = 0;

    for (const operation of operations) {
      token.throwIfCancelled();
      session.operationsProcessed++;
      await this.deps.events.emit('OperationStarted', {
        operation,
        sessionId: session.sessionId,
      });

      const handler = this.deps.registry.get(operation.handler);
      if (!handler) {
        await this.deps.queue.fail(operation.id, 'Handler not registered');
        session.operationsFailed++;
        failed.push({ operationId: operation.id, error: 'Handler not registered' });
        continue;
      }

      try {
        const ctx = {
          sessionId: session.sessionId,
          correlationId: operation.correlationId ?? operation.id,
          aggregateId: operation.aggregateId,
          aggregateType: operation.aggregateType,
          now: Date.now(),
        };

        const request = await handler.buildRequest(operation, ctx);
        token.throwIfCancelled();
        const response = await this.deps.http.request(request);
        bytesSent += JSON.stringify(request.body ?? {}).length;

        if (response.status === 409) {
          const resolver = this.deps.strategy.conflictStrategyFor(operation);
          const decision = await resolver.resolve(operation, response.body, ctx);
          await this.deps.events.emit('ConflictDetected', {
            operation,
            sessionId: session.sessionId,
          });
          session.conflicts++;

          if (decision.action === 'acceptServer') {
            await handler.applyResult(operation, response.body, ctx);
          } else if (decision.action === 'merge' && decision.mergedPayload !== undefined) {
            await handler.applyResult(
              operation,
              { ...(response.body as object), payload: decision.mergedPayload },
              ctx,
            );
          } else if (decision.action === 'fail') {
            throw new ConflictSyncError('Conflict resolution failed', response.body);
          }
        } else if (response.status >= 400) {
          throw classifyError(new Error(`HTTP ${response.status}`));
        } else {
          await handler.applyResult(operation, response.body, ctx);
        }

        await this.deps.queue.complete([operation.id]);
        session.operationsSucceeded++;
        await this.deps.events.emit('OperationCompleted', {
          operation,
          sessionId: session.sessionId,
        });
        succeeded.push(operation.id);
        this.deps.metrics.increment('sync.operation.completed');
      } catch (error) {
        if (error instanceof CancelledSyncError) {
          throw error;
        }

        const classified = this.deps.retryPolicy.classify(error);
        const shouldRetry =
          classified.retryable &&
          this.deps.strategy.shouldRetry(operation, error) &&
          this.deps.retryPolicy.canRetry(operation.retryCount);

        if (shouldRetry) {
          const nextAttemptAt = this.deps.retryPolicy.nextAttemptAt(operation.retryCount);
          await this.deps.queue.fail(operation.id, classified.message, nextAttemptAt);
          session.retries++;
          await this.deps.events.emit('RetryScheduled', {
            operation,
            nextAttemptAt,
            sessionId: session.sessionId,
          });
        } else {
          await this.deps.queue.fail(operation.id, classified.message);
          await this.deps.queue.cancelDependents(operation.id);
          session.operationsFailed++;
        }

        const message = classified.message;
        failed.push({ operationId: operation.id, error: message });
        await this.deps.events.emit('OperationFailed', {
          operation,
          sessionId: session.sessionId,
          error: message,
        });
        this.deps.metrics.increment('sync.operation.failed');
        this.deps.logger.error('Push operation failed', {
          operationId: operation.id,
          sessionId: session.sessionId,
          error: message,
        });
      }
    }

    return {
      batchId: `batch:${operations[0]?.aggregateId ?? 'unknown'}:${operations.map((op) => op.id).join('-')}`,
      succeeded,
      failed,
      conflicts,
      bytesSent,
    };
  }
}
