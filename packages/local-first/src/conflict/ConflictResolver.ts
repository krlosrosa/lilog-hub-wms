import type { ConflictDecision } from '../types/index.js';
import type { Operation } from '../operations/Operation.js';
import type { SyncContext } from '../types/index.js';

export interface ConflictResolver {
  resolve(operation: Operation, serverState: unknown, ctx: SyncContext): ConflictDecision | Promise<ConflictDecision>;
}

export class LastWriteWinsConflictResolver implements ConflictResolver {
  constructor(private readonly clock: () => number = Date.now) {}

  resolve(operation: Operation, serverState: unknown): ConflictDecision {
    const serverTimestamp =
      typeof serverState === 'object' &&
      serverState !== null &&
      'updatedAt' in serverState
        ? Number((serverState as { updatedAt: unknown }).updatedAt)
        : 0;
    return serverTimestamp >= this.clock()
      ? { action: 'acceptServer' }
      : { action: 'keepClient' };
  }
}

export class ServerWinsConflictResolver implements ConflictResolver {
  resolve(): ConflictDecision {
    return { action: 'acceptServer' };
  }
}

export class ClientWinsConflictResolver implements ConflictResolver {
  resolve(): ConflictDecision {
    return { action: 'keepClient' };
  }
}

export class MergeStrategyConflictResolver implements ConflictResolver {
  resolve(operation: Operation, serverState: unknown): ConflictDecision {
    if (
      typeof operation.payload === 'object' &&
      operation.payload !== null &&
      typeof serverState === 'object' &&
      serverState !== null
    ) {
      return {
        action: 'merge',
        mergedPayload: {
          ...(serverState as Record<string, unknown>),
          ...(operation.payload as Record<string, unknown>),
        },
      };
    }
    return { action: 'acceptServer' };
  }
}

export class CustomStrategyConflictResolver implements ConflictResolver {
  constructor(
    private readonly fn: (
      operation: Operation,
      serverState: unknown,
      ctx: SyncContext,
    ) => ConflictDecision | Promise<ConflictDecision>,
  ) {}

  resolve(operation: Operation, serverState: unknown, ctx: SyncContext): ConflictDecision | Promise<ConflictDecision> {
    return this.fn(operation, serverState, ctx);
  }
}
