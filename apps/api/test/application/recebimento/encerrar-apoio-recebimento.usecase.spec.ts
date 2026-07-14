import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { EncerrarApoioRecebimentoUseCase } from '../../../src/application/usecases/recebimento/encerrar-apoio-recebimento.usecase.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
  type IRecebimentoAlocacaoRepository,
} from '../../../src/domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../src/domain/repositories/user/user.repository.js';

describe('EncerrarApoioRecebimentoUseCase', () => {
  const recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository = {
    encerrarApoio: vi.fn(),
  } as unknown as IRecebimentoAlocacaoRepository;

  const userRepository: IUserRepository = {
    findById: vi.fn(),
  } as unknown as IUserRepository;

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EncerrarApoioRecebimentoUseCase,
        {
          provide: RECEBIMENTO_ALOCACAO_REPOSITORY,
          useValue: recebimentoAlocacaoRepository,
        },
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
      ],
    }).compile();

    return moduleRef.get(EncerrarApoioRecebimentoUseCase);
  }

  it('encerra apoio do operador autenticado', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: 1,
      role: 'operator',
      funcionarioId: 42,
    } as never);
    vi.mocked(recebimentoAlocacaoRepository.encerrarApoio).mockResolvedValue({
      id: 'apoio-1',
      preRecebimentoId: 'pre-1',
      sessaoId: 'sessao-1',
      sessaoFuncionarioId: 'sf-1',
      funcionarioId: 42,
      papel: 'apoio',
      status: 'encerrada',
      atribuidoEm: new Date('2026-07-14T12:00:00.000Z'),
      inicioEm: new Date('2026-07-14T12:05:00.000Z'),
      canceladoEm: null,
      encerradoEm: new Date('2026-07-14T13:00:00.000Z'),
    });

    const useCase = await createUseCase();
    const result = await useCase.execute('apoio-1', 1);

    expect(result.status).toBe('encerrada');
    expect(recebimentoAlocacaoRepository.encerrarApoio).toHaveBeenCalledWith(
      'apoio-1',
      42,
    );
  });

  it('rejeita quando apoio não é encontrado', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: 1,
      role: 'operator',
      funcionarioId: 42,
    } as never);
    vi.mocked(recebimentoAlocacaoRepository.encerrarApoio).mockRejectedValue(
      new Error('Apoio não encontrado'),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute('apoio-1', 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejeita quando operador tenta encerrar apoio de outro funcionário', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: 1,
      role: 'operator',
      funcionarioId: 42,
    } as never);
    vi.mocked(recebimentoAlocacaoRepository.encerrarApoio).mockRejectedValue(
      new Error('Somente o operador de apoio pode encerrar esta participação'),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute('apoio-1', 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejeita apoio inativo', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: 1,
      role: 'operator',
      funcionarioId: 42,
    } as never);
    vi.mocked(recebimentoAlocacaoRepository.encerrarApoio).mockRejectedValue(
      new Error('Só é possível encerrar apoios ativos'),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute('apoio-1', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
