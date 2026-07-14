import { describe, expect, it, vi } from 'vitest';

import { UpdateFuncionarioUseCase } from '../../../src/application/usecases/funcionario/update-funcionario.usecase.js';
import type { IFuncionarioRepository } from '../../../src/domain/repositories/funcionario/funcionario.repository.js';
import type { IUserRepository } from '../../../src/domain/repositories/user/user.repository.js';
import type { IUnidadeRepository } from '../../../src/domain/repositories/unidade/unidade.repository.js';

describe('UpdateFuncionarioUseCase', () => {
  it('normaliza o nome e sincroniza users.name do usuário vinculado', async () => {
    const updateUser = vi.fn(async () => null);
    const updateFuncionario = vi.fn(async () => ({
      id: 10,
      nome: 'João da Silva',
    }));

    const funcionarioRepository: Partial<IFuncionarioRepository> = {
      findById: async () =>
        ({
          id: 10,
          unidadeId: 'UN-001',
          matricula: '100',
        }) as never,
      update: updateFuncionario,
    };

    const userRepository: Partial<IUserRepository> = {
      list: async () => ({
        items: [{ id: 99, name: 'JOÃO SILVA' } as never],
        total: 1,
        page: 1,
        limit: 1,
      }),
      update: updateUser,
    };

    const unidadeRepository: Partial<IUnidadeRepository> = {};

    const useCase = new UpdateFuncionarioUseCase(
      funcionarioRepository as IFuncionarioRepository,
      unidadeRepository as IUnidadeRepository,
      userRepository as IUserRepository,
    );

    await useCase.execute(10, { nome: '  joão   DA  silva  ' });

    expect(updateFuncionario).toHaveBeenCalledWith(10, {
      nome: 'João da Silva',
    });
    expect(updateUser).toHaveBeenCalledWith(99, { name: 'João da Silva' });
  });
});
