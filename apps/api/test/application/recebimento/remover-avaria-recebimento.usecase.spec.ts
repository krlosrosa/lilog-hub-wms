import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RemoverAvariaRecebimentoUseCase } from '../../../src/application/usecases/recebimento/remover-avaria-recebimento.usecase.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type IRecebimentoAvariaRepository,
} from '../../../src/domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../src/domain/repositories/recebimento/recebimento.repository.js';

describe('RemoverAvariaRecebimentoUseCase', () => {
  let useCase: RemoverAvariaRecebimentoUseCase;
  let recebimentoRepository: Pick<IRecebimentoRepository, 'findById'>;
  let avariaRepository: Pick<IRecebimentoAvariaRepository, 'deleteById'>;

  beforeEach(async () => {
    recebimentoRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'em_conferencia',
      }),
    };

    avariaRepository = {
      deleteById: vi.fn().mockResolvedValue({ removed: true }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RemoverAvariaRecebimentoUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        { provide: RECEBIMENTO_AVARIA_REPOSITORY, useValue: avariaRepository },
      ],
    }).compile();

    useCase = moduleRef.get(RemoverAvariaRecebimentoUseCase);
  });

  it('removes avaria when recebimento is em_conferencia', async () => {
    const result = await useCase.execute({
      recebimentoId: 'rec-1',
      avariaId: 'avaria-1',
    });

    expect(avariaRepository.deleteById).toHaveBeenCalledWith('rec-1', 'avaria-1');
    expect(result).toEqual({ removed: true });
  });

  it('throws NotFoundException when recebimento does not exist', async () => {
    recebimentoRepository.findById = vi.fn().mockResolvedValue(null);

    await expect(
      useCase.execute({ recebimentoId: 'rec-1', avariaId: 'avaria-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when recebimento is not em_conferencia', async () => {
    recebimentoRepository.findById = vi.fn().mockResolvedValue({
      id: 'rec-1',
      situacao: 'conferencia_encerrada',
    });

    await expect(
      useCase.execute({ recebimentoId: 'rec-1', avariaId: 'avaria-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when avaria does not exist', async () => {
    avariaRepository.deleteById = vi.fn().mockResolvedValue({ removed: false });

    await expect(
      useCase.execute({ recebimentoId: 'rec-1', avariaId: 'avaria-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
