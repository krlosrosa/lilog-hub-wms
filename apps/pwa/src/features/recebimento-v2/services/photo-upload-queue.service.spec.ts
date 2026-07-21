import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { DamageRecord, MediaRecord } from '../local-db/schema';
import {
  AVARIA_TARGET_ENTITY_TYPE,
  CHECKLIST_TARGET_ENTITY_TYPE,
} from './sync-photo.helpers';

vi.mock('@/features/recebimento/lib/recebimento-api', () => ({
  getRecebimentoByPreRecebimento: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/uppy/uppy-bucket-upload', () => ({
  uppyBucketUpload: vi.fn(),
}));

const mockUppyBucketUpload = vi.mocked(
  (await import('@/lib/uppy/uppy-bucket-upload')).uppyBucketUpload,
);

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';
const SERVER_AVARIA_ID = 'avaria-server-001';
const RECEBIMENTO_ID = 'recebimento-001';

function makeMedia(overrides: Partial<MediaRecord> = {}): MediaRecord {
  return {
    id: crypto.randomUUID(),
    processId: DEMAND_ID,
    ownerType: 'avaria',
    ownerId: 'avaria-session-1',
    blob: new Blob(['photo'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    status: 'local',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('photo-upload-queue.service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUppyBucketUpload.mockResolvedValue({ uploaded: 1, failed: 0, skipped: 0 });

    const { resetPhotoUploadQueueState } = await import('./photo-upload-queue.service');
    resetPhotoUploadQueueState();

    await recebimentoV2Db.media.clear();
    await recebimentoV2Db.damages.clear();
    await recebimentoV2Db.checklists.clear();
    await recebimentoV2Db.processes.clear();
  });

  afterEach(async () => {
    vi.useRealTimers();
    const { resetPhotoUploadQueueState } = await import('./photo-upload-queue.service');
    resetPhotoUploadQueueState();
  });

  it('returns zero when there is no eligible media', async () => {
    const { processPhotoQueue } = await import('./photo-upload-queue.service');

    const result = await processPhotoQueue(DEMAND_ID);

    expect(result).toEqual({ uploaded: 0, failed: 0, skipped: 0 });
    expect(mockUppyBucketUpload).not.toHaveBeenCalled();
  });

  it('uploads each target group exactly once via uppyBucketUpload', async () => {
    const mediaA = makeMedia({ id: 'media-a' });
    const mediaB = makeMedia({ id: 'media-b' });
    const mediaC = makeMedia({
      id: 'media-c',
      ownerType: 'checklist',
      targetEntityId: RECEBIMENTO_ID,
      targetEntityType: CHECKLIST_TARGET_ENTITY_TYPE,
    });

    const damage: DamageRecord = {
      id: crypto.randomUUID(),
      demandId: DEMAND_ID,
      description: 'Avaria teste',
      quantity: 1,
      motivo: 'outro',
      mediaIds: [mediaA.id, mediaB.id],
      registradoAt: new Date().toISOString(),
      syncStatus: 'synced',
      serverAvariaId: SERVER_AVARIA_ID,
      updatedAt: Date.now(),
    };

    await recebimentoV2Db.media.bulkPut([mediaA, mediaB, mediaC]);
    await recebimentoV2Db.damages.put(damage);
    await recebimentoV2Db.checklists.put({
      demandId: DEMAND_ID,
      id: crypto.randomUUID(),
      dock: 'Doca 1',
      lacre: '123',
      conditions: {},
      photoMediaIds: { lacre: [mediaC.id] },
      savedAt: new Date().toISOString(),
      syncStatus: 'synced',
      updatedAt: Date.now(),
    });
    await recebimentoV2Db.processes.put({
      id: DEMAND_ID,
      unidadeId: 'unit-001',
      adapter: 'recebimento-v2',
      status: 'working',
      serverRevision: 1,
      baseRevision: 1,
      flowVersion: 'v2',
      recebimentoId: RECEBIMENTO_ID,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    mockUppyBucketUpload.mockResolvedValueOnce({ uploaded: 2, failed: 0, skipped: 0 });
    mockUppyBucketUpload.mockResolvedValueOnce({ uploaded: 1, failed: 0, skipped: 0 });

    const { processPhotoQueue } = await import('./photo-upload-queue.service');
    const result = await processPhotoQueue(DEMAND_ID);

    expect(result).toEqual({ uploaded: 3, failed: 0, skipped: 0 });
    expect(mockUppyBucketUpload).toHaveBeenCalledTimes(2);

    const avariaCall = mockUppyBucketUpload.mock.calls.find(
      ([, options]) => options.entidadeTipo === AVARIA_TARGET_ENTITY_TYPE,
    );
    expect(avariaCall?.[1].entidadeId).toBe(RECEBIMENTO_ID);
    expect(avariaCall?.[0]).toHaveLength(2);

    const stampedA = await recebimentoV2Db.media.get(mediaA.id);
    const stampedB = await recebimentoV2Db.media.get(mediaB.id);
    expect(stampedA?.targetEntityId).toBe(SERVER_AVARIA_ID);
    expect(stampedB?.targetEntityType).toBe(AVARIA_TARGET_ENTITY_TYPE);
  });

  it('skips media without blob even when target is stamped', async () => {
    const media = makeMedia({
      targetEntityId: SERVER_AVARIA_ID,
      targetEntityType: AVARIA_TARGET_ENTITY_TYPE,
      blob: undefined as unknown as Blob,
    });

    await recebimentoV2Db.media.put(media);

    const { processPhotoQueue } = await import('./photo-upload-queue.service');
    const result = await processPhotoQueue(DEMAND_ID);

    expect(result).toEqual({ uploaded: 0, failed: 0, skipped: 0 });
    expect(mockUppyBucketUpload).not.toHaveBeenCalled();
  });
});
