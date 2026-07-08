import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { BloquearSaldoEnderecoUseCase } from '../../../src/application/usecases/estoque/bloquear-saldo-endereco.usecase.js';
import type { IEstoqueRepository } from '../../../src/domain/repositories/estoque/estoque.repository.js';
import type { IMotivoBloqueioSaldoRepository } from '../../../src/domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

describe('BloquearSaldoEnderecoUseCase', () => {
  it('deve bloquear saldo quando motivo existe e está ativo', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      bloquearSaldoEndereco: vi.fn().mockResolvedValue({
        id: 'saldo-1',
        status: 'bloqueado',
      }),
    };

    const motivoRepository: Partial<IMotivoBloqueioSaldoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'motivo-1',
        ativo: true,
      }),
    };

    const useCase = new BloquearSaldoEnderecoUseCase(
      estoqueRepository as IEstoqueRepository,
      motivoRepository as IMotivoBloqueioSaldoRepository,
    );

    const result = await useCase.execute({
      saldoEnderecoId: 'saldo-1',
      motivoBloqueioId: 'motivo-1',
      operatorId: 10,
    });

    expect(estoqueRepository.bloquearSaldoEndereco).toHaveBeenCalledWith({
      saldoEnderecoId: 'saldo-1',
      motivoBloqueioId: 'motivo-1',
      observacao: undefined,
      operatorId: 10,
    });
    expect(result).toMatchObject({ id: 'saldo-1', status: 'bloqueado' });
  });

  it('deve rejeitar motivo inativo', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      bloquearSaldoEndereco: vi.fn(),
    };

    const motivoRepository: Partial<IMotivoBloqueioSaldoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'motivo-1',
        ativo: false,
      }),
    };

    const useCase = new BloquearSaldoEnderecoUseCase(
      estoqueRepository as IEstoqueRepository,
      motivoRepository as IMotivoBloqueioSaldoRepository,
    );

    await expect(
      useCase.execute({
        saldoEnderecoId: 'saldo-1',
        motivoBloqueioId: 'motivo-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve lançar NotFoundException quando motivo não existe', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      bloquearSaldoEndereco: vi.fn(),
    };

    const motivoRepository: Partial<IMotivoBloqueioSaldoRepository> = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const useCase = new BloquearSaldoEnderecoUseCase(
      estoqueRepository as IEstoqueRepository,
      motivoRepository as IMotivoBloqueioSaldoRepository,
    );

    await expect(
      useCase.execute({
        saldoEnderecoId: 'saldo-1',
        motivoBloqueioId: 'motivo-inexistente',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
