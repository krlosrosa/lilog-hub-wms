import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ProcessRecord, SyncOperationRecord } from '../local-db/schema';

vi.mock('./sync.service', () => ({
  pushDemand: vi.fn(),
}));

const mockPushDemand = vi.mocked(await import('./sync.service')).pushDemand;

const {
  hasPendingSyncWork,
  resetAutoSyncBackoff,
  resetAutoSyncV2State,
  scheduleAutoSync,
  syncNowV2,
  getAutoSyncPaused,
} = await import('./auto-sync-v2.service');

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';

function makeProcess(overrides: Partial<ProcessRecord> = {}): ProcessRecord {
  const now = Date.now();
  return {
    id: DEMAND_ID,
    unidadeId: 'unit-001',
    adapter: 'recebimento-v2',
    status: 'working',
    serverRevision: 5,
    baseRevision: 5,
    flowVersion: 'v2',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makePendingOp(overrides: Partial<SyncOperationRecord> = {}): SyncOperationRecord {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    aggregateId: DEMAND_ID,
    module: 'conference',
    opType: 'recebimento.item.conferir',
    sequence: now,
    dependsOn: [],
    idempotencyKey: crypto.randomUUID(),
    payload: { quantity: 3 },
    attachmentIds: [],
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('auto-sync-v2.service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetAutoSyncV2State();

    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.processes.put(makeProcess());
  });

  it('detects pending and retry operations as pending sync work', async () => {
    await recebimentoV2Db.syncOperations.bulkPut([
      makePendingOp({ status: 'pending' }),
      makePendingOp({ status: 'retry' }),
      makePendingOp({ status: 'synced' }),
    ]);

    expect(await hasPendingSyncWork(DEMAND_ID)).toBe(true);
  });

  it('returns false when no pending work exists', async () => {
    expect(await hasPendingSyncWork(DEMAND_ID)).toBe(false);
  });

  it('syncNowV2 pushes pending operations when online', async () => {
    const op = makePendingOp();
    await recebimentoV2Db.syncOperations.put(op);

    mockPushDemand.mockResolvedValue({
      accepted: 1,
      rejected: 0,
      conflicts: 0,
      newRevision: 6,
      photosUploaded: 0,
      photosFailed: 0,
      photosPending: 0,
    });

    const result = await syncNowV2(DEMAND_ID);

    expect(mockPushDemand).toHaveBeenCalledWith(DEMAND_ID, { manual: undefined });
    expect(result?.accepted).toBe(1);
  });

  it('does not push when process is in conflict', async () => {
    await recebimentoV2Db.processes.update(DEMAND_ID, { status: 'conflict' });
    await recebimentoV2Db.syncOperations.put(makePendingOp());

    const result = await syncNowV2(DEMAND_ID);

    expect(mockPushDemand).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('pauses auto-sync after consecutive network failures', async () => {
    await recebimentoV2Db.syncOperations.put(makePendingOp());
    mockPushDemand.mockRejectedValue(new Error('Network error'));

    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);

    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    const process = await recebimentoV2Db.processes.get(DEMAND_ID);
    expect(process?.autoSyncPaused).toBe(true);
    expect(mockPushDemand).toHaveBeenCalledTimes(3);

    mockPushDemand.mockClear();
    await syncNowV2(DEMAND_ID);
    expect(mockPushDemand).not.toHaveBeenCalled();
  });

  it('pauses auto-sync when retry operations exhaust max attempts', async () => {
    await recebimentoV2Db.syncOperations.bulkPut([
      makePendingOp({ status: 'retry', attempts: 3 }),
      makePendingOp({ status: 'retry', attempts: 3 }),
      makePendingOp({ status: 'retry', attempts: 3 }),
    ]);

    mockPushDemand.mockResolvedValue({
      accepted: 0,
      rejected: 0,
      conflicts: 0,
      newRevision: 5,
      photosUploaded: 0,
      photosFailed: 0,
      photosPending: 0,
    });

    const { refreshAutoSyncPauseState } = await import('./auto-sync-v2.service');
    const paused = await refreshAutoSyncPauseState(DEMAND_ID);

    expect(paused).toBe(true);
    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    mockPushDemand.mockClear();
    await syncNowV2(DEMAND_ID);
    expect(mockPushDemand).not.toHaveBeenCalled();
  });

  it('hydrates paused state from IndexedDB on register', async () => {
    await recebimentoV2Db.processes.update(DEMAND_ID, { autoSyncPaused: true });
    await recebimentoV2Db.syncOperations.put(makePendingOp({ status: 'retry', attempts: 1 }));

    const { registerAutoSyncForDemand } = await import('./auto-sync-v2.service');
    const unregister = await registerAutoSyncForDemand(DEMAND_ID);

    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    mockPushDemand.mockClear();
    await syncNowV2(DEMAND_ID);
    expect(mockPushDemand).not.toHaveBeenCalled();

    unregister();
  });

  it('manual sync resets backoff and retries push', async () => {
    await recebimentoV2Db.syncOperations.put(makePendingOp());
    mockPushDemand.mockRejectedValue(new Error('Network error'));

    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);
    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    resetAutoSyncBackoff(DEMAND_ID);
    mockPushDemand.mockResolvedValue({
      accepted: 1,
      rejected: 0,
      conflicts: 0,
      newRevision: 6,
      photosUploaded: 0,
      photosFailed: 0,
      photosPending: 0,
    });

    const result = await syncNowV2(DEMAND_ID, { manual: true });

    expect(getAutoSyncPaused(DEMAND_ID)).toBe(false);
    expect(result?.accepted).toBe(1);
  });

  it('scheduleAutoSync debounces push by 800ms', async () => {
    await recebimentoV2Db.syncOperations.put(makePendingOp());

    mockPushDemand.mockResolvedValue({
      accepted: 1,
      rejected: 0,
      conflicts: 0,
      newRevision: 6,
      photosUploaded: 0,
      photosFailed: 0,
      photosPending: 0,
    });

    scheduleAutoSync(DEMAND_ID);

    expect(mockPushDemand).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 900));

    expect(mockPushDemand).toHaveBeenCalledWith(DEMAND_ID, { manual: undefined });
  });
});
