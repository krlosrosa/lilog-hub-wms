import { describe, expect, it } from 'vitest';

import { DeleteEnderecoUseCase } from '../../../src/application/usecases/endereco/delete-endereco.usecase.js';
import type { IEnderecoRepository } from '../../../src/domain/repositories/endereco/endereco.repository.js';

describe('DeleteEnderecoUseCase', () => {
  it('deve bloquear exclusão quando endereço possui histórico de movimentação', async () => {
    const enderecoRepository: Partial<IEnderecoRepository> = {
      findById: async () =>
        ({
          id: 'end-1',
          enderecoMascarado: 'A-01-01-01',
        }) as never,
      hasStock: async () => false,
      hasMovementHistory: async () => true,
      delete: async () => undefined,
    };

    const useCase = new DeleteEnderecoUseCase(
      enderecoRepository as IEnderecoRepository,
    );

    await expect(useCase.execute('end-1')).rejects.toThrow(
      'Não é permitido excluir endereço utilizado em movimentações históricas',
    );
  });
});
