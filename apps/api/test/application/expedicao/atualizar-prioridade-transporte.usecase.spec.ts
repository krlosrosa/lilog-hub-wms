import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AtualizarPrioridadeTransporteUseCase } from '../../../src/application/usecases/expedicao/atualizar-prioridade-transporte.usecase.js';
import { TRANSPORTE_REPOSITORY } from '../../../src/domain/repositories/expedicao/transporte.repository.js';

describe('AtualizarPrioridadeTransporteUseCase', () => {
  it('atualiza prioridade com nível informado', async () => {
    const atualizarPrioridade = vi.fn().mockResolvedValue({
      id: 't-1',
      rota: '101',
      isPrioridade: true,
      nivelPrioridade: 'urgente',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AtualizarPrioridadeTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: { atualizarPrioridade },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AtualizarPrioridadeTransporteUseCase);

    const result = await useCase.execute({
      id: 't-1',
      unidadeId: 'unidade-1',
      isPrioridade: true,
      nivelPrioridade: 'urgente',
    });

    expect(result).toEqual({
      id: 't-1',
      rota: '101',
      isPrioridade: true,
      nivelPrioridade: 'urgente',
    });
    expect(atualizarPrioridade).toHaveBeenCalledWith({
      id: 't-1',
      unidadeId: 'unidade-1',
      isPrioridade: true,
      nivelPrioridade: 'urgente',
    });
  });

  it('limpa nível quando prioridade é desativada', async () => {
    const atualizarPrioridade = vi.fn().mockResolvedValue({
      id: 't-1',
      rota: '101',
      isPrioridade: false,
      nivelPrioridade: null,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AtualizarPrioridadeTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: { atualizarPrioridade },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AtualizarPrioridadeTransporteUseCase);

    await useCase.execute({
      id: 't-1',
      unidadeId: 'unidade-1',
      isPrioridade: false,
    });

    expect(atualizarPrioridade).toHaveBeenCalledWith({
      id: 't-1',
      unidadeId: 'unidade-1',
      isPrioridade: false,
      nivelPrioridade: null,
    });
  });

  it('exige nível quando prioridade está ativa', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AtualizarPrioridadeTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: { atualizarPrioridade: vi.fn() },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AtualizarPrioridadeTransporteUseCase);

    await expect(
      useCase.execute({
        id: 't-1',
        unidadeId: 'unidade-1',
        isPrioridade: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna 404 quando transporte não existe', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AtualizarPrioridadeTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: {
            atualizarPrioridade: vi.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AtualizarPrioridadeTransporteUseCase);

    await expect(
      useCase.execute({
        id: 't-x',
        unidadeId: 'unidade-1',
        isPrioridade: true,
        nivelPrioridade: 'normal',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
