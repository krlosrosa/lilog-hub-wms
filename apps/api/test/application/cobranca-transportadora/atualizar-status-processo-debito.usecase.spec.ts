import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';

import { AtualizarStatusProcessoDebitoUseCase } from '../../../src/application/usecases/cobranca-transportadora/atualizar-status-processo-debito.usecase.js';
import { COBRANCA_TRANSPORTADORA_REPOSITORY } from '../../../src/domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

describe('AtualizarStatusProcessoDebitoUseCase', () => {
  const cobrancaRepository = {
    buscarProcessoDetalhe: vi.fn(),
    atualizarStatusProcesso: vi.fn(),
  };

  let useCase: AtualizarStatusProcessoDebitoUseCase;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AtualizarStatusProcessoDebitoUseCase,
        {
          provide: COBRANCA_TRANSPORTADORA_REPOSITORY,
          useValue: cobrancaRepository,
        },
      ],
    }).compile();

    useCase = moduleRef.get(AtualizarStatusProcessoDebitoUseCase);
  });

  it('bloqueia alteração quando processo já está incluído em documento', async () => {
    cobrancaRepository.buscarProcessoDetalhe.mockResolvedValue({
      id: 'processo-1',
      status: 'incluido_em_documento',
    });

    await expect(
      useCase.execute({
        processoId: 'processo-1',
        unidadeId: 'unidade-1',
        status: 'cancelado',
      }),
    ).rejects.toThrow(
      'Não é possível alterar status de processo já incluído em documento.',
    );
  });

  it('atualiza status com sucesso', async () => {
    cobrancaRepository.buscarProcessoDetalhe.mockResolvedValue({
      id: 'processo-1',
      status: 'aberto',
    });
    cobrancaRepository.atualizarStatusProcesso.mockResolvedValue({
      id: 'processo-1',
      status: 'aprovado',
      statusAnterior: 'aberto',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await useCase.execute({
      processoId: 'processo-1',
      unidadeId: 'unidade-1',
      status: 'aprovado',
    });

    expect(result.status).toBe('aprovado');
    expect(result.statusAnterior).toBe('aberto');
  });
});
