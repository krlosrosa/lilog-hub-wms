import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { MovimentarEstoqueUseCase } from '../../../src/application/usecases/estoque/movimentar-estoque.usecase.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../src/domain/repositories/estoque/estoque.repository.js';

describe('MovimentarEstoqueUseCase', () => {
  it('registers entrada through repository', async () => {
    const repository: Partial<IEstoqueRepository> = {
      registrarEntrada: vi.fn().mockResolvedValue({ id: 'mov-1' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MovimentarEstoqueUseCase,
        { provide: ESTOQUE_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(MovimentarEstoqueUseCase);
    const result = await useCase.registrarEntrada({
      unidadeId: 'UN-1',
      depositoId: 'dep-1',
      produtoId: '00000000-0000-4000-8000-000000000010',
      quantidade: 5,
      unidadeMedida: 'UN',
      motivo: 'teste',
    });

    expect(result).toEqual({ id: 'mov-1' });
    expect(repository.registrarEntrada).toHaveBeenCalledOnce();
  });

  it('wraps repository errors as BadRequestException', async () => {
    const repository: Partial<IEstoqueRepository> = {
      ajustarSaldo: vi
        .fn()
        .mockRejectedValue(new Error('Saldo físico não pode ficar negativo')),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MovimentarEstoqueUseCase,
        { provide: ESTOQUE_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(MovimentarEstoqueUseCase);

    await expect(
      useCase.ajustarSaldo({
        unidadeId: 'UN-1',
        depositoId: 'dep-1',
        produtoId: '00000000-0000-4000-8000-000000000010',
        delta: -99,
        unidadeMedida: 'UN',
        motivo: 'teste',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
