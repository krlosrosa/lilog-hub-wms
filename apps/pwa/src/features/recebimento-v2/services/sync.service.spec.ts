import { RECEBIMENTO_V2_OP_TYPES, type SyncBatchResult } from '@lilog/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, DamageRecord, ProcessRecord, SyncOperationRecord } from '../local-db/schema';

// We need to mock the API modules
vi.mock('../api/sync-api', () => ({
  pushBatch: vi.fn(),
  fetchSnapshot: vi.fn(),
}));

vi.mock('@/features/recebimento/lib/recebimento-api', () => ({
  getRecebimentoByPreRecebimento: vi.fn(),
}));

vi.mock('./upload-checklist-photos-v2', () => ({
  uploadChecklistPhotosV2: vi.fn(),
}));

vi.mock('./upload-avaria-photos-v2', () => ({
  uploadAvariaPhotosV2: vi.fn(),
}));

vi.mock('./sync-photo.helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./sync-photo.helpers')>();
  return {
    ...actual,
    resolveRecebimentoIdForDemand: vi.fn(),
    countPendingPhotoUploads: vi.fn(),
    recoverStuckSyncState: vi.fn(),
  };
});

const mockPushBatch = vi.mocked(await import('../api/sync-api')).pushBatch;
const mockFetchSnapshot = vi.mocked(await import('../api/sync-api')).fetchSnapshot;
const mockGetRecebimentoByPreRecebimento = vi.mocked(
  await import('@/features/recebimento/lib/recebimento-api'),
).getRecebimentoByPreRecebimento;
const mockUploadChecklistPhotosV2 = vi.mocked(
  await import('./upload-checklist-photos-v2'),
).uploadChecklistPhotosV2;
const mockUploadAvariaPhotosV2 = vi.mocked(
  await import('./upload-avaria-photos-v2'),
).uploadAvariaPhotosV2;
const mockResolveRecebimentoIdForDemand = vi.mocked(
  await import('./sync-photo.helpers'),
).resolveRecebimentoIdForDemand;
const mockCountPendingPhotoUploads = vi.mocked(
  await import('./sync-photo.helpers'),
).countPendingPhotoUploads;

// Import after mock is set up
const { pushDemand } = await import('./sync.service');

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';
const UNIT_ID = 'unit-001';

function makeProcess(overrides: Partial<ProcessRecord> = {}): ProcessRecord {
  const now = Date.now();
  return {
    id: DEMAND_ID,
    unidadeId: UNIT_ID,
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

describe('sync.service – pushDemand', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetRecebimentoByPreRecebimento.mockResolvedValue(null);
    mockUploadChecklistPhotosV2.mockResolvedValue({ uploaded: 0, failed: 0, skipped: 0 });
    mockUploadAvariaPhotosV2.mockResolvedValue({ uploaded: 0, failed: 0, skipped: 0 });
    mockResolveRecebimentoIdForDemand.mockResolvedValue(null);
    mockCountPendingPhotoUploads.mockResolvedValue({ pending: 0, uploading: 0, error: 0 });

    // Reset the database state for this demand
    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.syncConflicts.clear();
    await recebimentoV2Db.checklists.clear();
    await recebimentoV2Db.media.clear();
    await recebimentoV2Db.conferences.clear();
    await recebimentoV2Db.damages.clear();

    await recebimentoV2Db.processes.put(makeProcess());
  });

  it('returns zero counts when no pending operations exist', async () => {
    const result = await pushDemand(DEMAND_ID);

    expect(mockPushBatch).not.toHaveBeenCalled();
    expect(result).toEqual({
      accepted: 0,
      rejected: 0,
      conflicts: 0,
      newRevision: 5,
      photosUploaded: 0,
      photosPending: 0,
    });
  });

  it('uploads pending checklist photos when no sync operations remain', async () => {
    const mediaId = crypto.randomUUID();
    const recebimentoId = 'recebimento-001';

    await recebimentoV2Db.checklists.put({
      demandId: DEMAND_ID,
      id: crypto.randomUUID(),
      dock: 'Doca 1',
      lacre: '123',
      conditions: { limpeza: true, odor: true, estrutura: true, vedacao: true },
      photoMediaIds: { lacre: [mediaId] },
      savedAt: new Date().toISOString(),
      syncStatus: 'synced',
      updatedAt: Date.now(),
    });

    await recebimentoV2Db.media.put({
      id: mediaId,
      processId: DEMAND_ID,
      ownerType: 'checklist',
      ownerId: `${DEMAND_ID}::lacre`,
      blob: new Blob(['photo'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      status: 'local',
      createdAt: new Date().toISOString(),
    });

    mockResolveRecebimentoIdForDemand.mockResolvedValue(recebimentoId);
    mockUploadChecklistPhotosV2.mockResolvedValue({ uploaded: 1, failed: 0, skipped: 0 });
    mockCountPendingPhotoUploads.mockResolvedValue({ pending: 0, uploading: 0, error: 0 });

    const result = await pushDemand(DEMAND_ID);

    expect(mockResolveRecebimentoIdForDemand).toHaveBeenCalledWith(DEMAND_ID, undefined);
    expect(mockUploadChecklistPhotosV2).toHaveBeenCalledWith(
      recebimentoId,
      { lacre: [mediaId] },
    );
    expect(result.photosUploaded).toBe(1);
    expect(result.photosPending).toBe(0);
  });

  it('marks all pending operations as syncing before pushing', async () => {
    const op1 = makePendingOp();
    const op2 = makePendingOp();
    await recebimentoV2Db.syncOperations.bulkPut([op1, op2]);

    const batchResult: SyncBatchResult = {
      batchId: 'batch-001',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 6,
      appliedCount: 2,
      skippedCount: 0,
      errorCount: 0,
      operations: [
        { opId: op1.id, status: 'applied' },
        { opId: op2.id, status: 'applied' },
      ],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    await pushDemand(DEMAND_ID);

    // Verify operations are now synced
    const stored1 = await recebimentoV2Db.syncOperations.get(op1.id);
    const stored2 = await recebimentoV2Db.syncOperations.get(op2.id);
    expect(stored1?.status).toBe('synced');
    expect(stored2?.status).toBe('synced');
  });

  it('updates process serverRevision after successful push', async () => {
    const op = makePendingOp();
    await recebimentoV2Db.syncOperations.put(op);

    const batchResult: SyncBatchResult = {
      batchId: 'batch-002',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 10,
      appliedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      operations: [{ opId: op.id, status: 'applied' }],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    const result = await pushDemand(DEMAND_ID);

    expect(result.newRevision).toBe(10);
    expect(result.accepted).toBe(1);

    const process = await recebimentoV2Db.processes.get(DEMAND_ID);
    expect(process?.serverRevision).toBe(10);
    expect(process?.lastSyncedAt).toBeGreaterThan(0);
  });

  it('creates a SyncConflict record when backend returns conflict status', async () => {
    const op = makePendingOp();
    await recebimentoV2Db.syncOperations.put(op);

    const batchResult: SyncBatchResult = {
      batchId: 'batch-003',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 8,
      appliedCount: 0,
      skippedCount: 0,
      errorCount: 1,
      operations: [{ opId: op.id, status: 'conflict', message: 'Revision mismatch' }],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    const result = await pushDemand(DEMAND_ID);

    expect(result.conflicts).toBe(1);

    // Operation marked as conflict
    const storedOp = await recebimentoV2Db.syncOperations.get(op.id);
    expect(storedOp?.status).toBe('conflict');
    expect(storedOp?.errorMessage).toBe('Revision mismatch');

    // Conflict record created
    const conflicts = await recebimentoV2Db.syncConflicts
      .where('aggregateId')
      .equals(DEMAND_ID)
      .toArray();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.batchId).toBe('batch-003');

    // Process status is conflict
    const process = await recebimentoV2Db.processes.get(DEMAND_ID);
    expect(process?.status).toBe('conflict');
  });

  it('marks rejected operations as rejected with error message', async () => {
    const op = makePendingOp();
    await recebimentoV2Db.syncOperations.put(op);

    const batchResult: SyncBatchResult = {
      batchId: 'batch-004',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 5,
      appliedCount: 0,
      skippedCount: 0,
      errorCount: 1,
      operations: [{ opId: op.id, status: 'rejected', message: 'Invalid payload' }],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    const result = await pushDemand(DEMAND_ID);

    expect(result.rejected).toBe(1);

    const storedOp = await recebimentoV2Db.syncOperations.get(op.id);
    expect(storedOp?.status).toBe('rejected');
    expect(storedOp?.errorMessage).toBe('Invalid payload');
  });

  it('reverts to retry status on network error', async () => {
    const op = makePendingOp();
    await recebimentoV2Db.syncOperations.put(op);

    mockPushBatch.mockRejectedValue(new Error('Network error'));

    await expect(pushDemand(DEMAND_ID)).rejects.toThrow('Network error');

    const storedOp = await recebimentoV2Db.syncOperations.get(op.id);
    expect(storedOp?.status).toBe('retry');
    expect((storedOp?.attempts ?? 0)).toBeGreaterThan(0);
  });

  it('stores serverItemId and serverPesagemId on conference after PVAR ITEM_CONFERIR sync', async () => {
    const conferenceId = crypto.randomUUID();
    const conference: ConferenceRecord = {
      id: conferenceId,
      demandId: DEMAND_ID,
      sku: '610500413',
      quantity: 1,
      peso: 12.5,
      isPvarBox: true,
      recebidaCaixa: 1,
      conferidoAt: new Date().toISOString(),
      syncStatus: 'pending',
      updatedAt: Date.now(),
    };
    const op = makePendingOp({
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      payload: {
        conferenceId,
        produtoId: 'PROD-PVAR',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 12.5,
        pesoVariavel: true,
      },
    });

    await recebimentoV2Db.conferences.put(conference);
    await recebimentoV2Db.syncOperations.put(op);

    const batchResult: SyncBatchResult = {
      batchId: 'batch-pvar',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 8,
      appliedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      operations: [
        {
          opId: op.id,
          status: 'applied',
          serverId: 'item-pvar-99',
          serverPesagemId: 'pesagem-99',
        },
      ],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    await pushDemand(DEMAND_ID);

    const storedConference = await recebimentoV2Db.conferences.get(conferenceId);
    expect(storedConference?.serverItemId).toBe('item-pvar-99');
    expect(storedConference?.serverPesagemId).toBe('pesagem-99');
    expect(storedConference?.syncStatus).toBe('synced');
  });

  it('stores serverItemId on conference after ITEM_CONFERIR sync', async () => {
    const conferenceId = crypto.randomUUID();
    const conference: ConferenceRecord = {
      id: conferenceId,
      demandId: DEMAND_ID,
      sku: '600598361',
      quantity: 5,
      conferidoAt: new Date().toISOString(),
      syncStatus: 'pending',
      updatedAt: Date.now(),
    };
    const op = makePendingOp({
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      payload: {
        conferenceId,
        produtoId: 'PROD-1',
        quantidadeRecebida: 5,
        unidadeMedida: 'UN',
      },
    });

    await recebimentoV2Db.conferences.put(conference);
    await recebimentoV2Db.syncOperations.put(op);

    const batchResult: SyncBatchResult = {
      batchId: 'batch-conferir',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 7,
      appliedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      operations: [{ opId: op.id, status: 'applied', serverId: 'item-server-99' }],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    await pushDemand(DEMAND_ID);

    const storedConference = await recebimentoV2Db.conferences.get(conferenceId);
    expect(storedConference?.serverItemId).toBe('item-server-99');
    expect(storedConference?.syncStatus).toBe('synced');
  });

  it('stores serverAvariaId on damage after AVARIA_REGISTRAR sync', async () => {
    const damageId = crypto.randomUUID();
    const damage: DamageRecord = {
      id: damageId,
      demandId: DEMAND_ID,
      sku: '600598361',
      description: 'Avaria teste',
      quantity: 1,
      motivo: '1',
      tipo: '1',
      natureza: '1',
      causa: '1',
      registradoAt: new Date().toISOString(),
      syncStatus: 'pending',
      updatedAt: Date.now(),
    };
    const op = makePendingOp({
      module: 'damage',
      opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
      payload: {
        damageId,
        tipo: '1',
        natureza: '1',
        causa: '1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
      },
    });

    await recebimentoV2Db.damages.put(damage);
    await recebimentoV2Db.syncOperations.put(op);

    mockPushBatch.mockResolvedValue({
      batchId: 'batch-avaria',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 8,
      appliedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      operations: [{ opId: op.id, status: 'applied', serverId: 'avaria-server-1' }],
    } satisfies SyncBatchResult);

    await pushDemand(DEMAND_ID);

    const storedDamage = await recebimentoV2Db.damages.get(damageId);
    expect(storedDamage?.serverAvariaId).toBe('avaria-server-1');
    expect(storedDamage?.syncStatus).toBe('synced');
  });

  it('throws when process does not exist', async () => {
    await expect(pushDemand('non-existent-demand-id')).rejects.toThrow(
      'não encontrado',
    );
  });

  it('sets process status to completed when CONFERENCIA_ENCERRAR is applied', async () => {
    const op = makePendingOp({
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR,
      payload: {
        demandId: DEMAND_ID,
        encerradoAt: new Date().toISOString(),
        dock: 'Doca 1',
        quantidadePaletes: 12,
      },
    });
    await recebimentoV2Db.syncOperations.put(op);
    await recebimentoV2Db.processes.update(DEMAND_ID, { status: 'completed' });

    const batchResult: SyncBatchResult = {
      batchId: 'batch-encerrar',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 10,
      appliedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      operations: [{ opId: op.id, status: 'applied' }],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    await pushDemand(DEMAND_ID);

    const process = await recebimentoV2Db.processes.get(DEMAND_ID);
    expect(process?.status).toBe('completed');

    const storedOp = await recebimentoV2Db.syncOperations.get(op.id);
    expect(storedOp?.status).toBe('synced');
  });

  it('sets process status to pendingSync when CONFERENCIA_ENCERRAR is rejected', async () => {
    const op = makePendingOp({
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR,
      payload: {
        demandId: DEMAND_ID,
        encerradoAt: new Date().toISOString(),
        dock: 'Doca 1',
        quantidadePaletes: 12,
      },
    });
    await recebimentoV2Db.syncOperations.put(op);
    await recebimentoV2Db.processes.update(DEMAND_ID, { status: 'completed' });

    const batchResult: SyncBatchResult = {
      batchId: 'batch-encerrar-reject',
      adapter: 'recebimento-v2',
      aggregateId: DEMAND_ID,
      serverRevision: 5,
      appliedCount: 0,
      skippedCount: 0,
      errorCount: 1,
      operations: [
        {
          opId: op.id,
          status: 'rejected',
          message: 'Conferência só pode ser encerrada com recebimento em andamento',
        },
      ],
    };
    mockPushBatch.mockResolvedValue(batchResult);

    await pushDemand(DEMAND_ID);

    const process = await recebimentoV2Db.processes.get(DEMAND_ID);
    expect(process?.status).toBe('pendingSync');

    const storedOp = await recebimentoV2Db.syncOperations.get(op.id);
    expect(storedOp?.status).toBe('rejected');
    expect(storedOp?.errorMessage).toBe(
      'Conferência só pode ser encerrada com recebimento em andamento',
    );
  });
});
