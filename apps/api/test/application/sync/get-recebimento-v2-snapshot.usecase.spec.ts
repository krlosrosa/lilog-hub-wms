import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetRecebimentoV2SnapshotUseCase } from '../../../src/application/usecases/sync/get-recebimento-v2-snapshot.usecase.js';
import { CONFERENCIA_REPOSITORY } from '../../../src/domain/repositories/recebimento/conferencia.repository.js';
import { PRE_RECEBIMENTO_REPOSITORY } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import { SYNC_REPOSITORY } from '../../../src/domain/repositories/sync/sync.repository.js';
import { USER_REPOSITORY } from '../../../src/domain/repositories/user/user.repository.js';

const PROCESS_ID = '11111111-1111-1111-1111-111111111111';
const UNIDADE_ID = 'ITB';

describe('GetRecebimentoV2SnapshotUseCase', () => {
  let useCase: GetRecebimentoV2SnapshotUseCase;
  let mockPreRecebimentoRepo: {
    findById: ReturnType<typeof vi.fn>;
    findDetalheById: ReturnType<typeof vi.fn>;
  };
  let mockConferenciaRepo: {
    getConferenciaContext: ReturnType<typeof vi.fn>;
  };
  let mockSyncRepo: {
    getAggregateRevision: ReturnType<typeof vi.fn>;
  };
  let mockUserRepo: {
    listAccessibleUnidades: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPreRecebimentoRepo = {
      findById: vi.fn().mockResolvedValue({
        id: PROCESS_ID,
        unidadeId: UNIDADE_ID,
        situacao: 'em_conferencia',
      }),
      findDetalheById: vi.fn().mockResolvedValue({
        preRecebimento: { id: PROCESS_ID, unidadeId: UNIDADE_ID },
        recebimento: {
          id: 'rec-1',
          docaId: null,
          dataFim: null,
          itens: [
            {
              id: 'item-aggregated',
              produtoId: 'PVAR-1',
              quantidadeRecebida: 3,
              unidadeMedida: 'CX',
              pesoRecebido: 70,
            },
          ],
        },
        checklist: null,
        avarias: [],
      }),
    };
    mockConferenciaRepo = {
      getConferenciaContext: vi.fn().mockResolvedValue({
        conferidos: [
          {
            id: 'pesagem-1',
            produtoId: 'PVAR-1',
            sku: 'SKU-PVAR',
            descricao: 'Produto PVAR',
            unidadesPorCaixa: 1,
            config: { pesoVariavel: true },
            quantidadeRecebida: 1,
            unidadeMedida: 'CX',
            loteRecebido: null,
            validade: null,
            pesoRecebido: 20,
            etiquetaCodigo: 'ETQ-1',
            pesagemId: 'pesagem-1',
            recebimentoItemId: 'item-aggregated',
            unitizadorCodigo: null,
            unitizadorId: null,
          },
          {
            id: 'pesagem-2',
            produtoId: 'PVAR-1',
            sku: 'SKU-PVAR',
            descricao: 'Produto PVAR',
            unidadesPorCaixa: 1,
            config: { pesoVariavel: true },
            quantidadeRecebida: 1,
            unidadeMedida: 'CX',
            loteRecebido: null,
            validade: null,
            pesoRecebido: 25,
            etiquetaCodigo: 'ETQ-2',
            pesagemId: 'pesagem-2',
            recebimentoItemId: 'item-aggregated',
            unitizadorCodigo: null,
            unitizadorId: null,
          },
          {
            id: 'pesagem-3',
            produtoId: 'PVAR-1',
            sku: 'SKU-PVAR',
            descricao: 'Produto PVAR',
            unidadesPorCaixa: 1,
            config: { pesoVariavel: true },
            quantidadeRecebida: 1,
            unidadeMedida: 'CX',
            loteRecebido: null,
            validade: null,
            pesoRecebido: 25,
            etiquetaCodigo: 'ETQ-3',
            pesagemId: 'pesagem-3',
            recebimentoItemId: 'item-aggregated',
            unitizadorCodigo: null,
            unitizadorId: null,
          },
        ],
      }),
    };
    mockSyncRepo = {
      getAggregateRevision: vi.fn().mockResolvedValue(7),
    };
    mockUserRepo = {
      listAccessibleUnidades: vi
        .fn()
        .mockResolvedValue([{ id: UNIDADE_ID, nome: 'ITB' }]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetRecebimentoV2SnapshotUseCase,
        { provide: PRE_RECEBIMENTO_REPOSITORY, useValue: mockPreRecebimentoRepo },
        { provide: CONFERENCIA_REPOSITORY, useValue: mockConferenciaRepo },
        { provide: SYNC_REPOSITORY, useValue: mockSyncRepo },
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    useCase = moduleRef.get(GetRecebimentoV2SnapshotUseCase);
  });

  it('returns expanded PVAR conferencias (one row per pesagem)', async () => {
    const result = await useCase.execute({
      processId: PROCESS_ID,
      userId: 1,
    });

    expect(result.conferencias).toHaveLength(3);
    expect(result.conferencias).toEqual([
      expect.objectContaining({
        id: 'pesagem-1',
        pesagemId: 'pesagem-1',
        recebimentoItemId: 'item-aggregated',
        quantidadeRecebida: 1,
        pesoRecebido: 20,
        etiquetaCodigo: 'ETQ-1',
      }),
      expect.objectContaining({
        id: 'pesagem-2',
        pesagemId: 'pesagem-2',
        quantidadeRecebida: 1,
        pesoRecebido: 25,
      }),
      expect.objectContaining({
        id: 'pesagem-3',
        pesagemId: 'pesagem-3',
        quantidadeRecebida: 1,
        pesoRecebido: 25,
      }),
    ]);
    expect(result.revision).toBe(7);
  });

  it('returns empty conferencias when recebimento has no context', async () => {
    mockConferenciaRepo.getConferenciaContext.mockResolvedValue({
      conferidos: [],
    });

    const result = await useCase.execute({
      processId: PROCESS_ID,
      userId: 1,
    });

    expect(result.conferencias).toEqual([]);
  });
});
