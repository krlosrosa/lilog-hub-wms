import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ProcessSyncBatchUseCase,
  SYNC_ADAPTER_REGISTRY,
} from '../../../src/application/usecases/sync/process-sync-batch.usecase.js';
import { SyncAdapterRegistry } from '../../../src/application/usecases/sync/adapters/sync-adapter.registry.js';
import type { ISyncAdapter } from '../../../src/application/usecases/sync/adapters/sync-adapter.interface.js';
import { SYNC_REPOSITORY } from '../../../src/domain/repositories/sync/sync.repository.js';
import { USER_REPOSITORY } from '../../../src/domain/repositories/user/user.repository.js';
import type { SyncBatchRequest } from '../../../src/domain/model/sync/sync.model.js';

const DEMAND_ID = '11111111-1111-1111-1111-111111111111';
const BATCH_ID = '22222222-2222-2222-2222-222222222222';
const OP_ID = '33333333-3333-3333-3333-333333333333';
const UNIDADE_ID = 'ITB';

function makeBatchRequest(
  overrides: Partial<SyncBatchRequest> = {},
): SyncBatchRequest {
  return {
    protocolVersion: 2,
    adapter: 'recebimento-v2',
    batchId: BATCH_ID,
    unidadeId: UNIDADE_ID,
    aggregateType: 'recebimento',
    aggregateId: DEMAND_ID,
    baseRevision: 0,
    operations: [
      {
        opId: OP_ID,
        type: 'recebimento.checklist.upsert',
        sequence: 0,
        dependsOn: [],
        idempotencyKey: 'idem-001',
        payload: { responsavelId: 1, docaId: 'doca-01' },
        attachments: [],
        createdAt: Date.now(),
      },
    ],
    ...overrides,
  };
}

describe('ProcessSyncBatchUseCase', () => {
  let useCase: ProcessSyncBatchUseCase;
  let registry: SyncAdapterRegistry;
  let mockAdapter: ISyncAdapter;
  let mockSyncRepo: {
    findBatchByBatchIdAndAdapter: ReturnType<typeof vi.fn>;
    createBatch: ReturnType<typeof vi.fn>;
    completeBatch: ReturnType<typeof vi.fn>;
    findOperationByBatchAndOpId: ReturnType<typeof vi.fn>;
    createOperation: ReturnType<typeof vi.fn>;
    getAggregateRevision: ReturnType<typeof vi.fn>;
    incrementAggregateRevision: ReturnType<typeof vi.fn>;
    recordChange: ReturnType<typeof vi.fn>;
  };
  let mockUserRepo: {
    listAccessibleUnidades: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockSyncRepo = {
      findBatchByBatchIdAndAdapter: vi.fn().mockResolvedValue(null),
      createBatch: vi.fn().mockResolvedValue({ id: 'batch-db-id' }),
      completeBatch: vi.fn().mockResolvedValue(undefined),
      findOperationByBatchAndOpId: vi.fn().mockResolvedValue(null),
      createOperation: vi.fn().mockResolvedValue({ id: 'op-db-id' }),
      getAggregateRevision: vi.fn().mockResolvedValue(0),
      incrementAggregateRevision: vi.fn().mockResolvedValue(1),
      recordChange: vi.fn().mockResolvedValue(undefined),
    };

    mockUserRepo = {
      listAccessibleUnidades: vi
        .fn()
        .mockResolvedValue([{ id: UNIDADE_ID, nome: 'ITB', nomeFilial: '', cluster: '' }]),
      findById: vi.fn(),
    };

    mockAdapter = {
      adapter: 'recebimento-v2',
      protocolVersion: 2,
      allowsPartialSuccess: true,
      validateAggregate: vi.fn().mockResolvedValue(undefined),
      sortOperations: vi.fn().mockImplementation((ops) => ops),
      apply: vi.fn().mockResolvedValue({ opId: OP_ID, status: 'applied' }),
    };

    registry = new SyncAdapterRegistry();
    registry.register(mockAdapter);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProcessSyncBatchUseCase,
        { provide: SYNC_ADAPTER_REGISTRY, useValue: registry },
        { provide: SYNC_REPOSITORY, useValue: mockSyncRepo },
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    useCase = moduleRef.get(ProcessSyncBatchUseCase);
  });

  it('processes a batch and returns result with applied count', async () => {
    const result = await useCase.execute({
      request: makeBatchRequest(),
      userId: 1,
    });

    expect(result.batchId).toBe(BATCH_ID);
    expect(result.appliedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(result.errorCount).toBe(0);
    expect(result.operations[0]?.status).toBe('applied');
  });

  it('rejects request with unknown adapter', async () => {
    await expect(
      useCase.execute({
        request: makeBatchRequest({ adapter: 'unknown-adapter' as never }),
        userId: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects when user has no access to unidade', async () => {
    mockUserRepo.listAccessibleUnidades.mockResolvedValue([]);

    await expect(
      useCase.execute({
        request: makeBatchRequest(),
        userId: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ConflictException when baseRevision is behind server', async () => {
    mockSyncRepo.getAggregateRevision.mockResolvedValue(5);

    await expect(
      useCase.execute({
        request: makeBatchRequest({ baseRevision: 3 }),
        userId: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('replays already-processed batch (idempotent)', async () => {
    mockSyncRepo.findBatchByBatchIdAndAdapter.mockResolvedValue({
      id: 'existing-batch',
      status: 'completed',
    });

    const result = await useCase.execute({
      request: makeBatchRequest(),
      userId: 1,
    });

    expect(result.skippedCount).toBe(1);
    expect(mockAdapter.apply).not.toHaveBeenCalled();
  });

  it('skips operations already recorded (deduplication within batch)', async () => {
    mockSyncRepo.findOperationByBatchAndOpId.mockResolvedValue({
      id: 'existing-op',
      opId: OP_ID,
      status: 'applied',
      errorMessage: null,
    });

    const result = await useCase.execute({
      request: makeBatchRequest(),
      userId: 1,
    });

    expect(result.appliedCount).toBe(1);
    expect(mockAdapter.apply).not.toHaveBeenCalled();
  });

  it('returns retryable status when adapter apply throws unexpected error', async () => {
    (mockAdapter.apply as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    );

    const result = await useCase.execute({
      request: makeBatchRequest(),
      userId: 1,
    });

    expect(result.operations[0]?.status).toBe('retryable');
    expect(result.errorCount).toBe(1);
  });

  it('increments revision only for applied operations', async () => {
    (mockAdapter.apply as ReturnType<typeof vi.fn>).mockResolvedValue({
      opId: OP_ID,
      status: 'skipped',
    });

    await useCase.execute({
      request: makeBatchRequest(),
      userId: 1,
    });

    expect(mockSyncRepo.incrementAggregateRevision).not.toHaveBeenCalled();
  });

  it('allows null userId (unauthenticated; validation falls to adapter)', async () => {
    const result = await useCase.execute({
      request: makeBatchRequest(),
      userId: null,
    });

    expect(mockUserRepo.listAccessibleUnidades).not.toHaveBeenCalled();
    expect(result.appliedCount).toBe(1);
  });
});
