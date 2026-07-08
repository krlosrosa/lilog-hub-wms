import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListarProcessosDebitoUseCase } from '../../../src/application/usecases/cobranca-transportadora/listar-processos-debito.usecase.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../src/domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

describe('ListarProcessosDebitoUseCase', () => {
  const cobrancaRepository: Pick<
    ICobrancaTransportadoraRepository,
    'listarProcessos'
  > = {
    listarProcessos: vi.fn(),
  };

  let useCase: ListarProcessosDebitoUseCase;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListarProcessosDebitoUseCase,
        {
          provide: COBRANCA_TRANSPORTADORA_REPOSITORY,
          useValue: cobrancaRepository,
        },
      ],
    }).compile();

    useCase = moduleRef.get(ListarProcessosDebitoUseCase);
  });

  it('mapeia processos com contagem por tipo', async () => {
    const createdAt = new Date('2026-01-15T10:00:00.000Z');
    const updatedAt = new Date('2026-01-16T10:00:00.000Z');

    cobrancaRepository.listarProcessos.mockResolvedValue([
      {
        id: 'proc-1',
        unidadeId: 'unidade-1',
        demandaId: 'demanda-1',
        codigoDemanda: 'DEV-001',
        transporteId: 'TR-1',
        transportadoraId: null,
        transportadoraNome: 'Transportadora X',
        status: 'aberto',
        valorTotal: 1500,
        quantidadeItens: 3,
        quantidadeItensFalta: 2,
        quantidadeItensAvaria: 1,
        createdAt,
        updatedAt,
      },
    ]);

    const result = await useCase.execute({ unidadeId: 'unidade-1' });

    expect(cobrancaRepository.listarProcessos).toHaveBeenCalledWith({
      unidadeId: 'unidade-1',
    });
    expect(result.processos).toEqual([
      {
        id: 'proc-1',
        unidadeId: 'unidade-1',
        demandaId: 'demanda-1',
        codigoDemanda: 'DEV-001',
        transporteId: 'TR-1',
        transportadoraId: null,
        transportadoraNome: 'Transportadora X',
        status: 'aberto',
        valorTotal: 1500,
        quantidadeItens: 3,
        quantidadeItensFalta: 2,
        quantidadeItensAvaria: 1,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
  });

  it('retorna lista vazia quando não há processos', async () => {
    cobrancaRepository.listarProcessos.mockResolvedValue([]);

    const result = await useCase.execute({ unidadeId: 'unidade-1' });

    expect(result).toEqual({ processos: [] });
  });
});
