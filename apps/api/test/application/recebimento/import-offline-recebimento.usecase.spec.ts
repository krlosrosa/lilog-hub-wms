import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  ImportOfflineRecebimentoUseCase,
  type ImportOfflineRecebimentoInput,
} from '../../../src/application/usecases/recebimento/import-offline-recebimento.usecase.js';

const PRE_RECEBIMENTO_ID = 'pre-rec-001';
const UNIDADE_ID = 'ITB';
const EXPORT_ID = 'test-export-001';
const DOCA_ID = '550e8400-e29b-41d4-a716-446655440000';

function makeEntry(
  overrides: Partial<{
    outboxId: number;
    label: string;
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: unknown;
    createdAt: number;
  }> = {},
) {
  return {
    outboxId: 1,
    label: 'test-entry',
    endpoint: `/recebimentos/__offline__/itens`,
    method: 'POST' as const,
    payload: {
      produtoId: 'SKU-001',
      quantidadeRecebida: 10,
      unidadeMedida: 'CX',
    },
    createdAt: Date.now(),
    photoRefs: [],
    ...overrides,
  };
}

describe('ImportOfflineRecebimentoUseCase — characterization tests (V1 freeze)', () => {
  let useCase: ImportOfflineRecebimentoUseCase;
  let mockLogRepo: {
    findByExportAndEntryKey: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let mockPreRecebimentoRepo: {
    findById: ReturnType<typeof vi.fn>;
    updateSituacao: ReturnType<typeof vi.fn>;
  };
  let mockRecebimentoRepo: {
    findByPreRecebimentoId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let mockIniciarUC: { execute: ReturnType<typeof vi.fn> };
  let mockChecklistUC: { execute: ReturnType<typeof vi.fn> };
  let mockConferirUC: { execute: ReturnType<typeof vi.fn> };
  let mockEncerrarUC: { execute: ReturnType<typeof vi.fn> };
  let mockRegistrarAvariaUC: { execute: ReturnType<typeof vi.fn> };
  let mockRemoverAvariasUC: { execute: ReturnType<typeof vi.fn> };
  let mockRemoverItemUC: { execute: ReturnType<typeof vi.fn> };
  let mockRemoverLinhaUC: { execute: ReturnType<typeof vi.fn> };
  let mockRemoverPaleteUC: { execute: ReturnType<typeof vi.fn> };
  let mockRemoverPesagemUC: { execute: ReturnType<typeof vi.fn> };

  const RECEBIMENTO_ID = 'rec-001';

  beforeEach(async () => {
    mockLogRepo = {
      findByExportAndEntryKey: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'log-1', status: 'applied' }),
    };
    mockPreRecebimentoRepo = {
      findById: vi.fn().mockResolvedValue({
        id: PRE_RECEBIMENTO_ID,
        unidadeId: UNIDADE_ID,
        situacao: 'liberado_para_conferencia',
      }),
      updateSituacao: vi.fn().mockResolvedValue({}),
    };
    mockRecebimentoRepo = {
      findByPreRecebimentoId: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue({
        id: RECEBIMENTO_ID,
        situacao: 'em_conferencia',
        itens: [],
        divergencias: [],
      }),
    };
    mockIniciarUC = {
      execute: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
    };
    mockChecklistUC = {
      execute: vi.fn().mockResolvedValue({}),
    };
    mockConferirUC = {
      execute: vi.fn().mockResolvedValue({ item: { id: 'item-1' }, pesagem: null }),
    };
    mockEncerrarUC = {
      execute: vi.fn().mockResolvedValue({}),
    };
    mockRegistrarAvariaUC = {
      execute: vi.fn().mockResolvedValue({ id: 'avaria-1' }),
    };
    mockRemoverAvariasUC = {
      execute: vi.fn().mockResolvedValue({}),
    };
    mockRemoverItemUC = {
      execute: vi.fn().mockResolvedValue({}),
    };
    mockRemoverLinhaUC = {
      execute: vi.fn().mockResolvedValue({}),
    };
    mockRemoverPaleteUC = {
      execute: vi.fn().mockResolvedValue({}),
    };
    mockRemoverPesagemUC = {
      execute: vi.fn().mockResolvedValue({}),
    };

    // Direct instantiation to bypass NestJS DI (vitest/esbuild doesn't emit decorator metadata
    // needed for class-based token resolution without @Inject())
    useCase = new ImportOfflineRecebimentoUseCase(
      mockPreRecebimentoRepo as any,
      mockRecebimentoRepo as any,
      mockLogRepo as any,
      mockIniciarUC as any,
      mockChecklistUC as any,
      mockConferirUC as any,
      mockRemoverItemUC as any,
      mockRemoverPesagemUC as any,
      mockRemoverLinhaUC as any,
      mockRemoverPaleteUC as any,
      mockRegistrarAvariaUC as any,
      mockRemoverAvariasUC as any,
      mockEncerrarUC as any,
    );
  });

  it('processes checklist entry and creates recebimento via placeholder', async () => {
    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [
        makeEntry({
          outboxId: 1,
          endpoint: `/recebimentos/__offline__/checklist`,
          method: 'PUT',
          payload: {
            responsavelId: 42,
            docaId: DOCA_ID,
            conditions: {},
          },
          createdAt: 1000,
        }),
      ],
    };

    const result = await useCase.execute({ data: input, userId: 1 });

    expect(result.appliedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockIniciarUC.execute).toHaveBeenCalled();
  });

  it('orders entries: checklist first (priority 0), then items (priority 2), then close (priority 4)', async () => {
    const callOrder: string[] = [];

    mockChecklistUC.execute.mockImplementation(async () => {
      callOrder.push('checklist');
      return {};
    });
    mockConferirUC.execute.mockImplementation(async () => {
      callOrder.push('item');
      return { item: { id: 'item-1' }, pesagem: null };
    });
    mockEncerrarUC.execute.mockImplementation(async () => {
      callOrder.push('encerrar');
      return {};
    });
    mockRecebimentoRepo.findByPreRecebimentoId.mockResolvedValue({
      id: RECEBIMENTO_ID,
      situacao: 'em_conferencia',
    });

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [
        makeEntry({
          outboxId: 3,
          endpoint: `/recebimentos/${RECEBIMENTO_ID}/encerrar`,
          method: 'PUT',
          payload: {},
          createdAt: 3000,
        }),
        makeEntry({
          outboxId: 1,
          endpoint: `/recebimentos/__offline__/checklist`,
          method: 'PUT',
          payload: { responsavelId: 1, docaId: DOCA_ID, conditions: {} },
          createdAt: 1000,
        }),
        makeEntry({
          outboxId: 2,
          endpoint: `/recebimentos/__offline__/itens`,
          method: 'POST',
          payload: { produtoId: 'SKU-1', quantidadeRecebida: 5, unidadeMedida: 'CX' },
          createdAt: 2000,
        }),
      ],
    };

    await useCase.execute({ data: input, userId: 1 });

    expect(callOrder[0]).toBe('checklist');
    expect(callOrder[1]).toBe('item');
    expect(callOrder[2]).toBe('encerrar');
  });

  it('skips already-applied entries (same exportId + entryKey)', async () => {
    mockLogRepo.findByExportAndEntryKey.mockResolvedValue({
      id: 'existing-log',
      status: 'applied',
    });
    mockRecebimentoRepo.findByPreRecebimentoId.mockResolvedValue({
      id: RECEBIMENTO_ID,
      situacao: 'em_conferencia',
    });

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [makeEntry({ outboxId: 1, createdAt: 1000 })],
    };

    const result = await useCase.execute({ data: input, userId: 1 });

    expect(result.skippedCount).toBe(1);
    expect(result.appliedCount).toBe(0);
    expect(mockConferirUC.execute).not.toHaveBeenCalled();
  });

  it('returns partial success when one entry fails with retryable error', async () => {
    mockRecebimentoRepo.findByPreRecebimentoId.mockResolvedValue({
      id: RECEBIMENTO_ID,
      situacao: 'em_conferencia',
    });

    mockConferirUC.execute
      .mockResolvedValueOnce({ item: { id: 'item-1' }, pesagem: null })
      .mockRejectedValueOnce(new Error('Server error'));

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [
        makeEntry({
          outboxId: 1,
          payload: { produtoId: 'SKU-1', quantidadeRecebida: 1, unidadeMedida: 'CX' },
          createdAt: 1000,
        }),
        makeEntry({
          outboxId: 2,
          payload: { produtoId: 'SKU-2', quantidadeRecebida: 2, unidadeMedida: 'CX' },
          createdAt: 2000,
        }),
      ],
    };

    const result = await useCase.execute({ data: input, userId: 1 });

    expect(result.appliedCount).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('treats ConflictException as skipped (idempotent)', async () => {
    mockRecebimentoRepo.findByPreRecebimentoId.mockResolvedValue({
      id: RECEBIMENTO_ID,
      situacao: 'em_conferencia',
    });
    mockConferirUC.execute.mockRejectedValue(new ConflictException('Já existe'));

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [makeEntry({ outboxId: 1, createdAt: 1000 })],
    };

    // ConflictException from conferir is idempotent → skippedCount, not error
    // Note: entry is in /itens (default makeEntry), so recebimento must exist first
    const result = await useCase.execute({ data: input, userId: null });

    expect(result.skippedCount).toBe(1);
    expect(result.appliedCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('avaria ordering: DELETE avarias (2.9) comes before POST avarias (3)', async () => {
    const callOrder: string[] = [];
    mockRecebimentoRepo.findByPreRecebimentoId.mockResolvedValue({
      id: RECEBIMENTO_ID,
      situacao: 'em_conferencia',
    });
    mockRemoverAvariasUC.execute.mockImplementation(async () => {
      callOrder.push('delete-avarias');
      return {};
    });
    mockRegistrarAvariaUC.execute.mockImplementation(async () => {
      callOrder.push('post-avaria');
      return { id: 'av-1' };
    });

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [
        makeEntry({
          outboxId: 2,
          endpoint: `/recebimentos/${RECEBIMENTO_ID}/avarias`,
          method: 'POST',
          payload: {
            tipo: 'fisica',
            natureza: 'umidade',
            causa: 'chuva',
            quantidadeCaixas: 2,
            quantidadeUnidades: 0,
          },
          createdAt: 2000,
        }),
        makeEntry({
          outboxId: 1,
          endpoint: `/recebimentos/${RECEBIMENTO_ID}/avarias`,
          method: 'DELETE',
          payload: {},
          createdAt: 1000,
        }),
      ],
    };

    await useCase.execute({ data: input, userId: null });

    expect(callOrder[0]).toBe('delete-avarias');
    expect(callOrder[1]).toBe('post-avaria');
  });

  it('rejects import when unidadeId does not match pre-recebimento unidade', async () => {
    mockPreRecebimentoRepo.findById.mockResolvedValue({
      id: PRE_RECEBIMENTO_ID,
      unidadeId: 'OTHER_UNIDADE',
      situacao: 'em_conferencia',
    });

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [makeEntry({ outboxId: 1, createdAt: 1000 })],
    };

    await expect(
      useCase.execute({ data: input, userId: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when pre-recebimento does not exist', async () => {
    mockPreRecebimentoRepo.findById.mockResolvedValue(null);

    const input: ImportOfflineRecebimentoInput = {
      demandId: 'nonexistent',
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [makeEntry({ outboxId: 1, createdAt: 1000 })],
    };

    await expect(
      useCase.execute({ data: input, userId: null }),
    ).rejects.toThrow(NotFoundException);
  });

  it('resolves __offline__ placeholder to real recebimentoId after checklist', async () => {
    mockIniciarUC.execute.mockResolvedValue({ id: 'real-rec-id' });
    // After iniciar, findById returns the real recebimento
    mockRecebimentoRepo.findById.mockResolvedValue({
      id: 'real-rec-id',
      situacao: 'em_conferencia',
    });

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [
        makeEntry({
          outboxId: 1,
          endpoint: `/recebimentos/__offline__/checklist`,
          method: 'PUT',
          payload: { responsavelId: 1, docaId: DOCA_ID, conditions: {} },
          createdAt: 1000,
        }),
        makeEntry({
          outboxId: 2,
          endpoint: `/recebimentos/__offline__/itens`,
          method: 'POST',
          payload: { produtoId: 'SKU-1', quantidadeRecebida: 5, unidadeMedida: 'CX' },
          createdAt: 2000,
        }),
      ],
    };

    await useCase.execute({ data: input, userId: 1 });

    expect(mockConferirUC.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        recebimentoId: 'real-rec-id',
      }),
    );
  });

  it('returns recebimentoId in result', async () => {
    mockRecebimentoRepo.findByPreRecebimentoId.mockResolvedValue({
      id: RECEBIMENTO_ID,
      situacao: 'em_conferencia',
    });

    const input: ImportOfflineRecebimentoInput = {
      demandId: PRE_RECEBIMENTO_ID,
      exportId: EXPORT_ID,
      unidadeId: UNIDADE_ID,
      entries: [makeEntry({ outboxId: 1, createdAt: 1000 })],
    };

    const result = await useCase.execute({ data: input, userId: null });

    expect(result.recebimentoId).toBeTruthy();
    expect(result.demandId).toBe(PRE_RECEBIMENTO_ID);
    expect(result.exportId).toBe(EXPORT_ID);
  });
});
