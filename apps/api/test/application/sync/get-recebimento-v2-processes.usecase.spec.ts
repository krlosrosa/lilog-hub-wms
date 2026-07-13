import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetRecebimentoV2ProcessesUseCase } from '../../../src/application/usecases/sync/get-recebimento-v2-processes.usecase.js';
import { CONFERENCIA_REPOSITORY } from '../../../src/domain/repositories/recebimento/conferencia.repository.js';
import { SYNC_REPOSITORY } from '../../../src/domain/repositories/sync/sync.repository.js';
import { USER_REPOSITORY } from '../../../src/domain/repositories/user/user.repository.js';

const DEMAND_ID = '11111111-1111-1111-1111-111111111111';
const UNIDADE_ID = 'ITB';
const HORARIO = new Date('2026-07-10T14:30:00.000Z');

describe('GetRecebimentoV2ProcessesUseCase', () => {
  let useCase: GetRecebimentoV2ProcessesUseCase;
  let mockConferenciaRepo: {
    listOperadorDemandas: ReturnType<typeof vi.fn>;
  };
  let mockSyncRepo: {
    getAggregateRevision: ReturnType<typeof vi.fn>;
  };
  let mockUserRepo: {
    listAccessibleUnidades: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockConferenciaRepo = {
      listOperadorDemandas: vi.fn(),
    };
    mockSyncRepo = {
      getAggregateRevision: vi.fn().mockResolvedValue(3),
    };
    mockUserRepo = {
      listAccessibleUnidades: vi
        .fn()
        .mockResolvedValue([{ id: UNIDADE_ID, nome: 'ITB' }]),
      findById: vi.fn().mockResolvedValue({
        id: 1,
        role: 'operator',
        funcionarioId: 10,
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetRecebimentoV2ProcessesUseCase,
        { provide: CONFERENCIA_REPOSITORY, useValue: mockConferenciaRepo },
        { provide: SYNC_REPOSITORY, useValue: mockSyncRepo },
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    useCase = moduleRef.get(GetRecebimentoV2ProcessesUseCase);
  });

  it('maps placa and conferente when available', async () => {
    mockConferenciaRepo.listOperadorDemandas.mockResolvedValue([
      {
        preRecebimentoId: DEMAND_ID,
        recebimentoId: '22222222-2222-2222-2222-222222222222',
        unidadeId: UNIDADE_ID,
        placa: 'BRA2E19',
        transportadoraNome: 'Transportadora X',
        situacao: 'em_conferencia',
        dock: '5',
        skuCount: 12,
        horarioPrevisto: HORARIO,
        conferente: 'João Silva',
      },
    ]);

    const result = await useCase.execute({
      unidadeId: UNIDADE_ID,
      limit: 50,
      userId: 1,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      demandId: DEMAND_ID,
      supplier: 'Transportadora X',
      dock: '5',
      placa: 'BRA2E19',
      conferente: 'João Silva',
    });
  });

  it('omits conferente when recebimento has no responsavel', async () => {
    mockConferenciaRepo.listOperadorDemandas.mockResolvedValue([
      {
        preRecebimentoId: DEMAND_ID,
        recebimentoId: null,
        unidadeId: UNIDADE_ID,
        placa: 'ABC1D23',
        transportadoraNome: 'Transportadora Y',
        situacao: 'liberado_para_conferencia',
        dock: '2',
        skuCount: 4,
        horarioPrevisto: HORARIO,
        conferente: null,
      },
    ]);

    const result = await useCase.execute({
      unidadeId: UNIDADE_ID,
      limit: 50,
      userId: 1,
    });

    expect(result.items[0]?.placa).toBe('ABC1D23');
    expect(result.items[0]?.conferente).toBeUndefined();
  });

  it('passes responsavelId from user funcionarioId when listing demandas', async () => {
    mockConferenciaRepo.listOperadorDemandas.mockResolvedValue([]);

    await useCase.execute({
      unidadeId: UNIDADE_ID,
      limit: 50,
      userId: 1,
    });

    expect(mockUserRepo.findById).toHaveBeenCalledWith(1);
    expect(mockConferenciaRepo.listOperadorDemandas).toHaveBeenCalledWith({
      unidadeId: UNIDADE_ID,
      responsavelId: 10,
    });
  });

  it('throws when operator user has no funcionarioId', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 1,
      role: 'operator',
      funcionarioId: null,
    });

    await expect(
      useCase.execute({
        unidadeId: UNIDADE_ID,
        limit: 50,
        userId: 1,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockConferenciaRepo.listOperadorDemandas).not.toHaveBeenCalled();
  });

  it('omits responsavelId when manager has no funcionarioId', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 1,
      role: 'manager',
      funcionarioId: null,
    });
    mockConferenciaRepo.listOperadorDemandas.mockResolvedValue([]);

    await useCase.execute({
      unidadeId: UNIDADE_ID,
      limit: 50,
      userId: 1,
    });

    expect(mockConferenciaRepo.listOperadorDemandas).toHaveBeenCalledWith({
      unidadeId: UNIDADE_ID,
      responsavelId: undefined,
    });
  });

  it('maps atribuidoAMim when alocacao matches operator', async () => {
    mockConferenciaRepo.listOperadorDemandas.mockResolvedValue([
      {
        preRecebimentoId: DEMAND_ID,
        recebimentoId: null,
        unidadeId: UNIDADE_ID,
        placa: 'ABC1D23',
        transportadoraNome: 'Transportadora Y',
        situacao: 'liberado_para_conferencia',
        dock: '2',
        skuCount: 4,
        horarioPrevisto: HORARIO,
        conferente: null,
        alocacaoFuncionarioId: 10,
      },
    ]);

    const result = await useCase.execute({
      unidadeId: UNIDADE_ID,
      limit: 50,
      userId: 1,
    });

    expect(result.items[0]?.atribuidoAMim).toBe(true);
  });

  it('omits atribuidoAMim when demand is not allocated to operator', async () => {
    mockConferenciaRepo.listOperadorDemandas.mockResolvedValue([
      {
        preRecebimentoId: DEMAND_ID,
        recebimentoId: null,
        unidadeId: UNIDADE_ID,
        placa: 'ABC1D23',
        transportadoraNome: 'Transportadora Y',
        situacao: 'liberado_para_conferencia',
        dock: '2',
        skuCount: 4,
        horarioPrevisto: HORARIO,
        conferente: null,
        alocacaoFuncionarioId: null,
      },
    ]);

    const result = await useCase.execute({
      unidadeId: UNIDADE_ID,
      limit: 50,
      userId: 1,
    });

    expect(result.items[0]?.atribuidoAMim).toBeUndefined();
  });

  it('returns empty list when user has no access to unidade', async () => {
    mockUserRepo.listAccessibleUnidades.mockResolvedValue([
      { id: 'OTHER', nome: 'Outra' },
    ]);

    const result = await useCase.execute({
      unidadeId: UNIDADE_ID,
      limit: 50,
      userId: 1,
    });

    expect(result).toEqual({ items: [], nextCursor: null, hasMore: false });
    expect(mockConferenciaRepo.listOperadorDemandas).not.toHaveBeenCalled();
  });
});
