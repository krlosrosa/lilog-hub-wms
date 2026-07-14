import { describe, expect, it, vi } from 'vitest';

import { CreateUserUseCase } from '../../../src/application/usecases/user/create-user.usecase.js';
import type { IFuncionarioRepository } from '../../../src/domain/repositories/funcionario/funcionario.repository.js';
import type { IUserRepository } from '../../../src/domain/repositories/user/user.repository.js';

describe('CreateUserUseCase', () => {
  it('gera email sintético quando email não é informado', async () => {
    const create = vi.fn(async (data) => ({ ...data, createdAt: new Date() }));

    const userRepository: Partial<IUserRepository> = {
      findById: async () => null,
      findByEmail: async () => null,
      findActiveByFuncionarioId: async () => null,
      create,
      syncUserUnidades: async () => undefined,
    };

    const funcionarioRepository: Partial<IFuncionarioRepository> = {
      findById: async () =>
        ({
          id: 1,
          unidadeId: 'UN-001',
        }) as never,
    };

    const useCase = new CreateUserUseCase(
      userRepository as IUserRepository,
      funcionarioRepository as IFuncionarioRepository,
    );

    await useCase.execute({
      id: 421931,
      name: 'Carlos Roberto',
      password: '123456',
      role: 'admin',
      status: 'ativo',
      funcionarioId: 1,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 421931,
        email: '421931@internal.lilog',
      }),
    );
  });

  it('normaliza o nome antes de persistir', async () => {
    const create = vi.fn(async (data) => ({ ...data, createdAt: new Date() }));

    const userRepository: Partial<IUserRepository> = {
      findById: async () => null,
      findByEmail: async () => null,
      findActiveByFuncionarioId: async () => null,
      create,
      syncUserUnidades: async () => undefined,
    };

    const funcionarioRepository: Partial<IFuncionarioRepository> = {
      findById: async () =>
        ({
          id: 1,
          unidadeId: 'UN-001',
        }) as never,
    };

    const useCase = new CreateUserUseCase(
      userRepository as IUserRepository,
      funcionarioRepository as IFuncionarioRepository,
    );

    await useCase.execute({
      id: 421931,
      name: '  carlos   ROBERTO  ',
      password: '123456',
      role: 'admin',
      status: 'ativo',
      funcionarioId: 1,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Carlos Roberto',
      }),
    );
  });

  it('persiste mustChangePassword quando informado', async () => {
    const create = vi.fn(async (data) => ({ ...data, createdAt: new Date() }));

    const userRepository: Partial<IUserRepository> = {
      findById: async () => null,
      findByEmail: async () => null,
      findActiveByFuncionarioId: async () => null,
      create,
      syncUserUnidades: async () => undefined,
    };

    const funcionarioRepository: Partial<IFuncionarioRepository> = {
      findById: async () =>
        ({
          id: 1,
          unidadeId: 'UN-001',
        }) as never,
    };

    const useCase = new CreateUserUseCase(
      userRepository as IUserRepository,
      funcionarioRepository as IFuncionarioRepository,
    );

    await useCase.execute({
      id: 421931,
      name: 'Carlos Roberto',
      password: '123456',
      role: 'operator',
      status: 'ativo',
      funcionarioId: 1,
      mustChangePassword: true,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mustChangePassword: true,
      }),
    );
  });
});
