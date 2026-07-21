import { createOperation } from '../operations/Operation.js';
import type { CreateOperationInput, Operation } from '../operations/Operation.js';
import type { Clock } from '../ports/Clock.js';
import type { IdGenerator } from '../ports/IdGenerator.js';
import { cascadeDependencyFailure } from '../domain/DependencyResolver.js';
import type { QueueRepository } from './QueueRepository.js';

export class OperationQueue {
  private sequenceByAggregate = new Map<string, number>();

  constructor(
    private readonly repository: QueueRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {}

  async enqueue(input: CreateOperationInput): Promise<Operation> {
    const existing = input.idempotencyKey
      ? await this.repository.findByIdempotencyKey(input.idempotencyKey)
      : undefined;

    if (existing && existing.status !== 'Completed' && existing.status !== 'Cancelled') {
      return existing;
    }

    const now = this.clock.now();
    const sequence =
      input.sequence ??
      (this.sequenceByAggregate.get(input.aggregateId) ?? 0) + 1;
    this.sequenceByAggregate.set(input.aggregateId, sequence);

    const operation = createOperation(
      { ...input, sequence },
      this.idGenerator.generate(),
      now,
    );

    await this.repository.save(operation);
    return operation;
  }

  async getPending(aggregateId?: string): Promise<Operation[]> {
    return this.repository.findPending(
      aggregateId ? { aggregateId, limit: 1000 } : { limit: 1000 },
    );
  }

  async claim(ids: string[]): Promise<Operation[]> {
    return this.repository.claim(ids, this.clock.now());
  }

  async complete(ids: string[]): Promise<void> {
    await this.repository.markCompleted(ids, this.clock.now());
  }

  async fail(id: string, error: string, nextAttemptAt?: number): Promise<void> {
    await this.repository.markFailed(id, error, this.clock.now(), nextAttemptAt);
  }

  async cancelDependents(failedOperationId: string): Promise<void> {
    const pending = await this.repository.findPending({ limit: 1000 });
    const cascaded = cascadeDependencyFailure(
      pending,
      failedOperationId,
      this.clock.now(),
    );
    for (const op of cascaded) {
      if (op.status === 'Cancelled' && op.id !== failedOperationId) {
        await this.repository.markCancelled(
          op.id,
          op.lastError ?? 'Dependency cancelled',
          this.clock.now(),
        );
      }
    }
  }

  async recoverOrphanedRunning(): Promise<number> {
    return this.repository.recoverOrphanedRunning(this.clock.now());
  }

  async remove(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.repository.delete(id);
    }
  }
}
