import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { DeleteMotivoBloqueioSaldoUseCase } from '../../../src/application/usecases/estoque/delete-motivo-bloqueio-saldo.usecase.js';
import type { IMotivoBloqueioSaldoRepository } from '../../../src/domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

describe('DeleteMotivoBloqueioSaldoUseCase', () => {
  it('deve impedir remoção de motivo de sistema', async () => {
    const repository: Partial<IMotivoBloqueioSaldoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'motivo-1',
        sistema: true,
      }),
      delete: vi.fn(),
    };

    const useCase = new DeleteMotivoBloqueioSaldoUseCase(
      repository as IMotivoBloqueioSaldoRepository,
    );

    await expect(useCase.execute('motivo-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('deve remover motivo customizado', async () => {
    const repository: Partial<IMotivoBloqueioSaldoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'motivo-2',
        sistema: false,
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new DeleteMotivoBloqueioSaldoUseCase(
      repository as IMotivoBloqueioSaldoRepository,
    );

    await useCase.execute('motivo-2');

    expect(repository.delete).toHaveBeenCalledWith('motivo-2');
  });

  it('deve lançar NotFoundException quando motivo não existe', async () => {
    const repository: Partial<IMotivoBloqueioSaldoRepository> = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const useCase = new DeleteMotivoBloqueioSaldoUseCase(
      repository as IMotivoBloqueioSaldoRepository,
    );

    await expect(useCase.execute('inexistente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
