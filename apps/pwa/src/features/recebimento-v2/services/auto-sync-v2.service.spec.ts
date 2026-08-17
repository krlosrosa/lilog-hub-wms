import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, ProcessRecord, SyncOperationRecord } from '../local-db/schema';

vi.mock('./push-demand-patch.service', () => ({
  pushDemandPatchFromLocal: vi.fn(),
}));

vi.mock('./sync.service', () => ({
  pushDemand: vi.fn(),
}));

vi.mock('./photo-upload-queue.service', () => ({
  processPhotoQueue: vi.fn(),
  triggerPhotoQueue: vi.fn(),
  registerPhotoQueueForDemand: vi.fn(() => () => undefined),
  resetPhotoUploadQueueState: vi.fn(),
}));

const mockPushDemandPatchFromLocal = vi.mocked(
  (await import('./push-demand-patch.service')).pushDemandPatchFromLocal,
);
const mockPushDemand = vi.mocked((await import('./sync.service')).pushDemand);
const mockProcessPhotoQueue = vi.mocked(
  (await import('./photo-upload-queue.service')).processPhotoQueue,
);

const {
  hasDirtyPatchWork,
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

function makeDirtyConference(overrides: Partial<ConferenceRecord> = {}): ConferenceRecord {
  const now = Date.now();
  const id = crypto.randomUUID();
  return {
    id,
    demandId: DEMAND_ID,
    sku: 'SKU-001',
    quantity: 1,
    conferidoAt: new Date(now).toISOString(),
    syncStatus: 'pending',
    updatedAt: now,
    ...overrides,
  };
}

function makePatchResult(overrides: Partial<{
  serverRevision: number;
  applied: {
    conferencias?: { accepted: number; rejected: number };
  };
}> = {}) {
  return {
    serverRevision: 6,
    applied: {
      conferencias: { accepted: 1, rejected: 0 },
      ...overrides.applied,
    },
    ...overrides,
  };
}

describe('auto-sync-v2.service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetAutoSyncV2State();

    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.conferences.clear();
    await recebimentoV2Db.checklists.clear();
    await recebimentoV2Db.media.clear();
    mockProcessPhotoQueue.mockResolvedValue({ uploaded: 0, failed: 0, skipped: 0 });
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

  it('detects dirty patch work from pending conferences', async () => {
    await recebimentoV2Db.conferences.put(makeDirtyConference());

    expect(await hasDirtyPatchWork(DEMAND_ID)).toBe(true);
  });

  it('syncNowV2 pushes dirty patch work when online', async () => {
    await recebimentoV2Db.conferences.put(makeDirtyConference());

    mockPushDemandPatchFromLocal.mockResolvedValue(makePatchResult());

    const result = await syncNowV2(DEMAND_ID);

    expect(mockPushDemandPatchFromLocal).toHaveBeenCalledWith(DEMAND_ID);
    expect(result?.accepted).toBe(1);
  });

  it('does not push when process is in conflict', async () => {
    await recebimentoV2Db.processes.update(DEMAND_ID, { status: 'conflict' });
    await recebimentoV2Db.conferences.put(makeDirtyConference());

    const result = await syncNowV2(DEMAND_ID);

    expect(mockPushDemandPatchFromLocal).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('pauses auto-sync after consecutive network failures', async () => {
    await recebimentoV2Db.conferences.put(makeDirtyConference());
    mockPushDemandPatchFromLocal.mockRejectedValue(new Error('Network error'));

    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);

    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    const process = await recebimentoV2Db.processes.get(DEMAND_ID);
    expect(process?.autoSyncPaused).toBe(true);
    expect(mockPushDemandPatchFromLocal).toHaveBeenCalledTimes(3);

    mockPushDemandPatchFromLocal.mockClear();
    await syncNowV2(DEMAND_ID);
    expect(mockPushDemandPatchFromLocal).not.toHaveBeenCalled();
  });

  it('pauses auto-sync when retry operations exhaust max attempts', async () => {
    await recebimentoV2Db.syncOperations.bulkPut([
      makePendingOp({ status: 'retry', attempts: 3 }),
      makePendingOp({ status: 'retry', attempts: 3 }),
      makePendingOp({ status: 'retry', attempts: 3 }),
    ]);

    mockPushDemandPatchFromLocal.mockResolvedValue(makePatchResult({ serverRevision: 5 }));

    const { refreshAutoSyncPauseState } = await import('./auto-sync-v2.service');
    const paused = await refreshAutoSyncPauseState(DEMAND_ID);

    expect(paused).toBe(true);
    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    mockPushDemandPatchFromLocal.mockClear();
    await syncNowV2(DEMAND_ID);
    expect(mockPushDemandPatchFromLocal).not.toHaveBeenCalled();
  });

  it('hydrates paused state from IndexedDB on register', async () => {
    await recebimentoV2Db.processes.update(DEMAND_ID, { autoSyncPaused: true });
    await recebimentoV2Db.conferences.put(makeDirtyConference());

    const { registerAutoSyncForDemand } = await import('./auto-sync-v2.service');
    const unregister = await registerAutoSyncForDemand(DEMAND_ID);

    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    mockPushDemandPatchFromLocal.mockClear();
    await syncNowV2(DEMAND_ID);
    expect(mockPushDemandPatchFromLocal).not.toHaveBeenCalled();

    unregister();
  });

  it('manual sync resets backoff and retries push', async () => {
    await recebimentoV2Db.conferences.put(makeDirtyConference());
    mockPushDemandPatchFromLocal.mockRejectedValue(new Error('Network error'));

    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);
    await syncNowV2(DEMAND_ID);
    expect(getAutoSyncPaused(DEMAND_ID)).toBe(true);

    resetAutoSyncBackoff(DEMAND_ID);
    mockPushDemandPatchFromLocal.mockResolvedValue(makePatchResult());

    const result = await syncNowV2(DEMAND_ID, { manual: true });

    expect(getAutoSyncPaused(DEMAND_ID)).toBe(false);
    expect(result?.accepted).toBe(1);
  });

  it('syncNowV2 still uploads photos when auto-sync is paused', async () => {
    await recebimentoV2Db.processes.update(DEMAND_ID, { autoSyncPaused: true });
    await recebimentoV2Db.syncOperations.put(
      makePendingOp({ status: 'retry', attempts: 3 }),
    );

    const mediaId = crypto.randomUUID();
    await recebimentoV2Db.media.put({
      id: mediaId,
      processId: DEMAND_ID,
      ownerType: 'checklist',
      ownerId: DEMAND_ID,
      blob: new Blob(['photo'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      status: 'error',
      createdAt: new Date().toISOString(),
    });
    await recebimentoV2Db.checklists.put({
      demandId: DEMAND_ID,
      id: crypto.randomUUID(),
      dock: 'Doca 1',
      lacre: '123',
      conditions: {},
      savedAt: new Date().toISOString(),
      syncStatus: 'synced',
      photoMediaIds: { lacre: [mediaId] },
      updatedAt: Date.now(),
    });

    mockProcessPhotoQueue.mockResolvedValue({
      uploaded: 1,
      failed: 0,
      skipped: 0,
    });

    const result = await syncNowV2(DEMAND_ID);

    expect(mockPushDemandPatchFromLocal).not.toHaveBeenCalled();
    expect(mockPushDemand).not.toHaveBeenCalled();
    expect(mockProcessPhotoQueue).toHaveBeenCalledWith(DEMAND_ID);
    expect(result?.photosUploaded).toBe(1);
  });

  it('scheduleAutoSync debounces push by 800ms', async () => {
    await recebimentoV2Db.conferences.put(makeDirtyConference());

    mockPushDemandPatchFromLocal.mockResolvedValue(makePatchResult());

    scheduleAutoSync(DEMAND_ID);

    expect(mockPushDemandPatchFromLocal).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 900));

    expect(mockPushDemandPatchFromLocal).toHaveBeenCalledWith(DEMAND_ID);
  });
});
