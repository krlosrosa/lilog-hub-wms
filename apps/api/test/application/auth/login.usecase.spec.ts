import { describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';
import { ForbiddenException } from '@nestjs/common';

import { LoginUseCase } from '../../../src/application/usecases/auth/login.usecase.js';
import { WEB_CLIENT_APP } from '../../../src/shared/constants/client-apps.js';
import { LIDERANCA_PWA_CLIENT_APP } from '../../../src/shared/constants/lideranca-permissions.js';
import type { IUserRepository } from '../../../src/domain/repositories/user/user.repository.js';

describe('LoginUseCase', () => {
  it('autentica usuário interno com email sintético usando id e senha', async () => {
    const sign = vi.fn(() => 'jwt-token');
    const passwordHash = await bcrypt.hash('123456', 10);

    const userRepository: Partial<IUserRepository> = {
      findById: async () =>
        ({
          id: 421931,
          name: 'Carlos Roberto',
          email: '421931@internal.lilog',
          passwordHash,
          role: 'admin',
          status: 'ativo',
          mustChangePassword: false,
          funcionarioId: 1,
          unidadeId: 'UN-001',
          createdAt: new Date(),
        }) as never,
    };

    const useCase = new LoginUseCase(
      userRepository as IUserRepository,
      { sign } as never,
    );

    const result = await useCase.execute({
      id: 421931,
      password: '123456',
    });

    expect(result.token).toBe('jwt-token');
    expect(result.user).toMatchObject({
      id: 421931,
      email: '421931@internal.lilog',
      role: 'admin',
      mustChangePassword: false,
    });
    expect(sign).toHaveBeenCalledWith({
      sub: '421931',
      email: '421931@internal.lilog',
      role: 'admin',
      mustChangePassword: false,
    });
  });

  it('bloqueia login no PWA de liderança para usuários sem papel de líder', async () => {
    const passwordHash = await bcrypt.hash('123456', 10);

    const userRepository: Partial<IUserRepository> = {
      findById: async () =>
        ({
          id: 10,
          name: 'Operador',
          email: '10@internal.lilog',
          passwordHash,
          role: 'operator',
          status: 'ativo',
          mustChangePassword: false,
          funcionarioId: 1,
          unidadeId: 'UN-001',
          createdAt: new Date(),
        }) as never,
    };

    const useCase = new LoginUseCase(
      userRepository as IUserRepository,
      { sign: vi.fn() } as never,
    );

    await expect(
      useCase.execute({
        id: 10,
        password: '123456',
        clientApp: LIDERANCA_PWA_CLIENT_APP,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite login no portal web para operador sem funcionário vinculado', async () => {
    const sign = vi.fn(() => 'jwt-token');
    const passwordHash = await bcrypt.hash('123456', 10);

    const userRepository: Partial<IUserRepository> = {
      findById: async () =>
        ({
          id: 10,
          name: 'Operador Portal',
          email: '10@internal.lilog',
          passwordHash,
          role: 'operator',
          status: 'ativo',
          mustChangePassword: false,
          funcionarioId: null,
          unidadeId: 'UN-001',
          createdAt: new Date(),
        }) as never,
    };

    const useCase = new LoginUseCase(
      userRepository as IUserRepository,
      { sign } as never,
    );

    const result = await useCase.execute({
      id: 10,
      password: '123456',
      clientApp: WEB_CLIENT_APP,
    });

    expect(result.token).toBe('jwt-token');
    expect(result.user.role).toBe('operator');
    expect(result.user.funcionarioId).toBeNull();
  });

  it('bloqueia login fora do portal web para operador sem funcionário vinculado', async () => {
    const passwordHash = await bcrypt.hash('123456', 10);

    const userRepository: Partial<IUserRepository> = {
      findById: async () =>
        ({
          id: 10,
          name: 'Operador',
          email: '10@internal.lilog',
          passwordHash,
          role: 'operator',
          status: 'ativo',
          mustChangePassword: false,
          funcionarioId: null,
          unidadeId: 'UN-001',
          createdAt: new Date(),
        }) as never,
    };

    const useCase = new LoginUseCase(
      userRepository as IUserRepository,
      { sign: vi.fn() } as never,
    );

    await expect(
      useCase.execute({
        id: 10,
        password: '123456',
      }),
    ).rejects.toMatchObject({
      message: 'Conta operador sem funcionário vinculado. Contate o administrador.',
    });
  });
});
