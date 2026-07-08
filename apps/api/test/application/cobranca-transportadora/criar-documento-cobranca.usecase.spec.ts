import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CriarDocumentoCobrancaUseCase } from '../../../src/application/usecases/cobranca-transportadora/criar-documento-cobranca.usecase.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../src/domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

describe('CriarDocumentoCobrancaUseCase', () => {
  const cobrancaRepository: Pick<
    ICobrancaTransportadoraRepository,
    'criarDocumentoCobranca'
  > = {
    criarDocumentoCobranca: vi.fn(),
  };

  let useCase: CriarDocumentoCobrancaUseCase;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CriarDocumentoCobrancaUseCase,
        {
          provide: COBRANCA_TRANSPORTADORA_REPOSITORY,
          useValue: cobrancaRepository,
        },
      ],
    }).compile();

    useCase = moduleRef.get(CriarDocumentoCobrancaUseCase);
  });

  it('cria documento com numero gerado pelo repositorio', async () => {
    cobrancaRepository.criarDocumentoCobranca.mockResolvedValue({
      id: 'doc-1',
      numeroDocumento: 'CD-000001',
      status: 'rascunho',
      valorTotal: 1500,
      quantidadeProcessos: 2,
      quantidadeItens: 5,
    });

    const result = await useCase.execute({
      unidadeId: 'unidade-1',
      transportadoraId: 'transp-1',
      transportadoraNome: 'Transportadora X',
      processoDebitoIds: ['proc-1', 'proc-2'],
      observacao: 'Obs teste',
    });

    expect(cobrancaRepository.criarDocumentoCobranca).toHaveBeenCalledWith({
      unidadeId: 'unidade-1',
      transportadoraId: 'transp-1',
      transportadoraNome: 'Transportadora X',
      processoDebitoIds: ['proc-1', 'proc-2'],
      observacao: 'Obs teste',
      emitidoPorUserId: null,
    });

    expect(result).toEqual({
      id: 'doc-1',
      numeroDocumento: 'CD-000001',
      status: 'rascunho',
      valorTotal: 1500,
      quantidadeProcessos: 2,
      quantidadeItens: 5,
    });
  });

  it('rejeita quando nenhum processo informado', async () => {
    await expect(
      useCase.execute({
        unidadeId: 'unidade-1',
        transportadoraNome: 'Transportadora X',
        processoDebitoIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(cobrancaRepository.criarDocumentoCobranca).not.toHaveBeenCalled();
  });

  it('propaga erro de validacao do repositorio como BadRequestException', async () => {
    cobrancaRepository.criarDocumentoCobranca.mockRejectedValue(
      new Error(
        'Todos os processos devem pertencer à mesma transportadora.',
      ),
    );

    await expect(
      useCase.execute({
        unidadeId: 'unidade-1',
        transportadoraNome: 'Transportadora X',
        processoDebitoIds: ['proc-1', 'proc-2'],
      }),
    ).rejects.toThrow(
      'Todos os processos devem pertencer à mesma transportadora.',
    );
  });
});
