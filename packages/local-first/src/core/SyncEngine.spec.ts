import { describe, expect, it } from 'vitest';
import { SyncEngine } from '../core/SyncEngine.js';
import { InMemoryStorageAdapter } from '../testing/InMemoryStorageAdapter.js';
import { FakeHttpAdapter } from '../testing/FakeHttpAdapter.js';
import { FakeConnectivityAdapter } from '../testing/FakeConnectivityAdapter.js';
import { InMemoryCheckpointRepository } from '../testing/InMemoryCheckpointRepository.js';
import { InMemorySnapshotStore } from '../testing/InMemorySnapshotStore.js';
import { neverCancelled } from '../ports/CancellationToken.js';
import type { OperationHandler } from '../operations/OperationHandler.js';

describe('SyncEngine', () => {
  it('dispatches operations and syncs push/pull', async () => {
    const storage = new InMemoryStorageAdapter();
    const http = new FakeHttpAdapter();
    http.defaultResponse = {
      status: 200,
      body: {
        checkpoint: { cursor: 'c1', version: 1, serverTimestamp: 1 },
        operations: [],
      },
    };

    const connectivity = new FakeConnectivityAdapter();
    const engine = new SyncEngine({
      storage,
      http,
      connectivity,
      checkpoints: new InMemoryCheckpointRepository(),
      snapshots: new InMemorySnapshotStore(),
      config: {
        deviceId: 'device-1',
        pullScope: 'default',
        pullUrl: '/sync/pull',
      },
    });

    const handler: OperationHandler = {
      buildRequest: (operation) => ({
        method: 'POST',
        url: `/ops/${operation.id}`,
        body: operation.payload,
      }),
      applyResult: async () => {},
      onConflict: () => ({ action: 'acceptServer' }),
    };
    engine.register('create', handler);

    await engine.dispatch({
      aggregateId: 'agg-1',
      aggregateType: 'Test',
      operationType: 'create',
      payload: { ok: true },
      sequence: 1,
    });

    await engine.start();
    await engine.sync(neverCancelled());

    const pending = await storage.findOperations({ status: 'Completed' });
    expect(pending.length).toBe(1);
  });
});
