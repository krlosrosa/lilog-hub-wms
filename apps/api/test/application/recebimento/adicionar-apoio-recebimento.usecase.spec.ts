import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AdicionarApoioRecebimentoUseCase } from '../../../src/application/usecases/recebimento/adicionar-apoio-recebimento.usecase.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
  type IRecebimentoAlocacaoRepository,
} from '../../../src/domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../src/domain/repositories/sessao-operacao/sessao-operacao.repository.js';

describe('AdicionarApoioRecebimentoUseCase', () => {
  const sessaoOperacaoRepository: ISessaoOperacaoRepository = {
    findSessaoById: vi.fn(),
    findSessaoFuncionarioById: vi.fn(),
  } as unknown as ISessaoOperacaoRepository;

  const recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository = {
    criarApoio: vi.fn(),
  } as unknown as IRecebimentoAlocacaoRepository;

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdicionarApoioRecebimentoUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: sessaoOperacaoRepository,
        },
        {
          provide: RECEBIMENTO_ALOCACAO_REPOSITORY,
          useValue: recebimentoAlocacaoRepository,
        },
      ],
    }).compile();

    return moduleRef.get(AdicionarApoioRecebimentoUseCase);
  }

  it('rejeita sessão fechada', async () => {
    vi.mocked(sessaoOperacaoRepository.findSessaoById).mockResolvedValue({
      id: 'sessao-1',
      status: 'fechada',
      unidadeId: 'u1',
    } as never);

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        preRecebimentoId: 'pre-1',
        sessaoId: 'sessao-1',
        sessaoFuncionarioId: 'sf-1',
        unidadeId: 'u1',
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adiciona apoio com operador presente', async () => {
    vi.mocked(sessaoOperacaoRepository.findSessaoById).mockResolvedValue({
      id: 'sessao-1',
      status: 'aberta',
      unidadeId: 'u1',
    } as never);
    vi.mocked(sessaoOperacaoRepository.findSessaoFuncionarioById).mockResolvedValue({
      id: 'sf-1',
      funcionarioId: 42,
      status: 'presente',
    } as never);
    vi.mocked(recebimentoAlocacaoRepository.criarApoio).mockResolvedValue({
      id: 'apoio-1',
      preRecebimentoId: 'pre-1',
      sessaoId: 'sessao-1',
      sessaoFuncionarioId: 'sf-1',
      funcionarioId: 42,
      papel: 'apoio',
      status: 'iniciada',
      atribuidoEm: new Date('2026-07-14T12:00:00.000Z'),
      inicioEm: new Date('2026-07-14T12:00:00.000Z'),
      canceladoEm: null,
    });

    const useCase = await createUseCase();
    const result = await useCase.execute({
      preRecebimentoId: 'pre-1',
      sessaoId: 'sessao-1',
      sessaoFuncionarioId: 'sf-1',
      unidadeId: 'u1',
      userId: 1,
    });

    expect(result.papel).toBe('apoio');
    expect(recebimentoAlocacaoRepository.criarApoio).toHaveBeenCalledWith(
      expect.objectContaining({ funcionarioId: 42 }),
    );
  });

  it('rejeita funcionário ausente', async () => {
    vi.mocked(sessaoOperacaoRepository.findSessaoById).mockResolvedValue({
      id: 'sessao-1',
      status: 'aberta',
      unidadeId: 'u1',
    } as never);
    vi.mocked(sessaoOperacaoRepository.findSessaoFuncionarioById).mockResolvedValue(
      null,
    );

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        preRecebimentoId: 'pre-1',
        sessaoId: 'sessao-1',
        sessaoFuncionarioId: 'sf-1',
        unidadeId: 'u1',
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
