import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProcessSyncBatchController } from '../../../src/presentation/controllers/sync/process-sync-batch.controller.js';

describe('ProcessSyncBatchController', () => {
  let controller: ProcessSyncBatchController;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  const mockResult = {
    batchId: '22222222-2222-2222-2222-222222222222',
    adapter: 'recebimento-v2',
    aggregateId: '11111111-1111-1111-1111-111111111111',
    serverRevision: 1,
    appliedCount: 1,
    skippedCount: 0,
    errorCount: 0,
    operations: [{ opId: '33333333-3333-3333-3333-333333333333', status: 'applied' }],
  };

  beforeEach(async () => {
    mockUseCase = {
      execute: vi.fn().mockResolvedValue(mockResult),
    };

    controller = new ProcessSyncBatchController(mockUseCase as any);
  });

  it('delegates to usecase and returns result', async () => {
    const body = {
      protocolVersion: 2 as const,
      adapter: 'recebimento-v2' as const,
      batchId: '22222222-2222-2222-2222-222222222222',
      unidadeId: 'ITB',
      aggregateType: 'recebimento',
      aggregateId: '11111111-1111-1111-1111-111111111111',
      baseRevision: 0,
      operations: [
        {
          opId: '33333333-3333-3333-3333-333333333333',
          type: 'recebimento.checklist.upsert',
          sequence: 0,
          dependsOn: [],
          idempotencyKey: 'idem-001',
          payload: {},
          attachments: [],
          createdAt: Date.now(),
        },
      ],
    };

    const result = await controller.handle(body, {
      user: { id: 1, email: 'test@test.com', role: 'operator' },
    });

    expect(mockUseCase.execute).toHaveBeenCalledWith({
      request: body,
      userId: 1,
    });
    expect(result).toEqual(mockResult);
  });

  it('passes null userId when user is not authenticated', async () => {
    const body = {
      protocolVersion: 2 as const,
      adapter: 'recebimento-v2' as const,
      batchId: '22222222-2222-2222-2222-222222222222',
      unidadeId: 'ITB',
      aggregateType: 'recebimento',
      aggregateId: '11111111-1111-1111-1111-111111111111',
      baseRevision: 0,
      operations: [
        {
          opId: '33333333-3333-3333-3333-333333333333',
          type: 'recebimento.checklist.upsert',
          sequence: 0,
          dependsOn: [],
          idempotencyKey: 'idem-001',
          payload: {},
          attachments: [],
          createdAt: Date.now(),
        },
      ],
    };

    await controller.handle(body, {});

    expect(mockUseCase.execute).toHaveBeenCalledWith({
      request: body,
      userId: null,
    });
  });
});
