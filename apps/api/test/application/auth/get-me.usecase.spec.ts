import { describe, expect, it } from 'vitest';

import { GetMeUseCase } from '../../../src/application/usecases/auth/get-me.usecase.js';
import type { IUserRepository } from '../../../src/domain/repositories/user/user.repository.js';

describe('GetMeUseCase', () => {
  it('retorna usuário interno com email sintético', async () => {
    const userRepository: Partial<IUserRepository> = {
      findById: async () =>
        ({
          id: 421931,
          name: 'Carlos Roberto',
          email: '421931@internal.lilog',
          passwordHash: 'hash',
          role: 'admin',
          status: 'ativo',
          funcionarioId: 1,
          unidadeId: 'UN-001',
          createdAt: new Date(),
        }) as never,
    };

    const useCase = new GetMeUseCase(userRepository as IUserRepository);

    const result = await useCase.execute(421931);

    expect(result).toEqual({
      id: 421931,
      name: 'Carlos Roberto',
      email: '421931@internal.lilog',
      role: 'admin',
      funcionarioId: 1,
      unidadeId: 'UN-001',
    });
  });
});
