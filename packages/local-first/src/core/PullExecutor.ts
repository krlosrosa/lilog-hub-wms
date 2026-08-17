import type { CheckpointRepository } from '../storage/CheckpointRepository.js';
import type { SnapshotStore } from '../storage/SnapshotStore.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';
import type { HttpAdapter } from '../network/HttpAdapter.js';
import type { CancellationToken } from '../ports/CancellationToken.js';
import type { EventBus } from '../events/EventBus.js';
import type { MetricsPort } from '../ports/MetricsPort.js';
import type { SyncSession } from './SyncSession.js';
import type { PullChangesResult, SyncCheckpoint } from '../types/index.js';

export interface PullExecutorDeps {
  checkpoints: CheckpointRepository;
  snapshots: SnapshotStore;
  storage: StorageAdapter;
  http: HttpAdapter;
  events: EventBus;
  metrics: MetricsPort;
  pullUrl: string;
}

export interface PullApplyHandler {
  applySnapshot?(scope: string, snapshot: unknown, checkpoint: SyncCheckpoint): Promise<void>;
  applyRemoteOperations?(scope: string, operations: unknown[], checkpoint: SyncCheckpoint): Promise<void>;
}

export class PullExecutor {
  constructor(
    private readonly deps: PullExecutorDeps,
    private readonly applyHandler: PullApplyHandler = {},
  ) {}

  async execute(
    scope: string,
    session: SyncSession,
    token: CancellationToken,
  ): Promise<PullChangesResult | null> {
    token.throwIfCancelled();
    await this.deps.events.emit('PullStarted', { sessionId: session.sessionId, scope });

    const checkpoint = (await this.deps.checkpoints.get(scope)) ?? {
      cursor: '',
      version: 0,
      serverTimestamp: 0,
    };

    token.throwIfCancelled();
    const response = await this.deps.http.get(
      `${this.deps.pullUrl}?cursor=${encodeURIComponent(checkpoint.cursor)}&scope=${encodeURIComponent(scope)}`,
    );

    if (response.status >= 400) {
      return null;
    }

    const body = (response.body ?? {}) as Partial<PullChangesResult>;
    const nextCheckpoint = body.checkpoint ?? checkpoint;
    const bytesReceived = JSON.stringify(response.body ?? {}).length;
    session.bytesReceived += bytesReceived;

    await this.deps.storage.transaction(async () => {
      if (body.snapshot) {
        await this.deps.snapshots.set(body.snapshot);
        if (this.applyHandler.applySnapshot) {
          await this.applyHandler.applySnapshot(scope, body.snapshot.state, nextCheckpoint);
        }
      }

      if (body.operations && body.operations.length > 0) {
        if (this.applyHandler.applyRemoteOperations) {
          await this.applyHandler.applyRemoteOperations(scope, body.operations, nextCheckpoint);
        }
      }

      await this.deps.checkpoints.set(scope, nextCheckpoint);
    });

    await this.deps.events.emit('PullFinished', {
      sessionId: session.sessionId,
      scope,
      bytesReceived,
    });
    this.deps.metrics.histogram('sync.pull.bytes_received', bytesReceived, { scope });

    return {
      checkpoint: nextCheckpoint,
      snapshot: body.snapshot,
      operations: body.operations,
      bytesReceived,
    };
  }
}
