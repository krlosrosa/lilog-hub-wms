import { describe, expect, it } from 'vitest';
import { PullExecutor } from '../core/PullExecutor.js';
import { SyncSession } from '../core/SyncSession.js';
import { EventBus } from '../events/EventBus.js';
import { FakeHttpAdapter } from '../testing/FakeHttpAdapter.js';
import { InMemoryStorageAdapter } from '../testing/InMemoryStorageAdapter.js';
import { InMemoryCheckpointRepository } from '../testing/InMemoryCheckpointRepository.js';
import { InMemorySnapshotStore } from '../testing/InMemorySnapshotStore.js';
import { NoOpMetricsPort } from '../ports/MetricsPort.js';
import { neverCancelled } from '../ports/CancellationToken.js';

describe('PullExecutor', () => {
  it('pulls incrementally and advances checkpoint after apply', async () => {
    const checkpoints = new InMemoryCheckpointRepository();
    const snapshots = new InMemorySnapshotStore();
    const storage = new InMemoryStorageAdapter();
    const http = new FakeHttpAdapter();
    http.defaultResponse = {
      status: 200,
      body: {
        checkpoint: { cursor: 'c2', version: 2, serverTimestamp: 200 },
        operations: [{ id: 'remote-1' }],
      },
    };

    const applied: string[] = [];
    const executor = new PullExecutor(
      {
        checkpoints,
        snapshots,
        storage,
        http,
        events: new EventBus(),
        metrics: new NoOpMetricsPort(),
        pullUrl: '/sync/pull',
      },
      {
        applyRemoteOperations: async () => {
          applied.push('ok');
        },
      },
    );

    const session = new SyncSession('session-1', Date.now());
    const result = await executor.execute('default', session, neverCancelled());
    expect(result?.checkpoint.cursor).toBe('c2');
    expect(applied).toEqual(['ok']);
    expect(await checkpoints.get('default')).toEqual({
      cursor: 'c2',
      version: 2,
      serverTimestamp: 200,
    });
  });
});
