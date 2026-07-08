import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidarDemandaArmazenagemUseCase } from '../../../src/application/usecases/armazenagem/validar-demanda-armazenagem.usecase.js';
import { ARMAZENAGEM_REPOSITORY } from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';

describe('ValidarDemandaArmazenagemUseCase', () => {
  const armazenagemRepository = {
    findDemandaById: vi.fn(),
    updateUnitizadorStatus: vi.fn(),
    updateStatusDemanda: vi.fn(),
  };

  let useCase: ValidarDemandaArmazenagemUseCase;

  const demandaId = '00000000-0000-4000-8000-000000000001';
  const unitizadorId = '00000000-0000-4000-8000-000000000002';
  const enderecoSugeridoId = '00000000-0000-4000-8000-000000000003';

  const demandaValidacao = {
    id: demandaId,
    unidadeId: 'UN-1',
    recebimentoId: '00000000-0000-4000-8000-000000000004',
    modoUnitizacao: 'bipar_palete_no_recebimento',
    status: 'aguardando_validacao' as const,
    responsavelId: null,
    startedAt: null,
    finishedAt: null,
    validadoPor: null,
    validadoEm: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    itens: [
      {
        id: '00000000-0000-4000-8000-000000000005',
        demandaId,
        tarefaId: null,
        unitizadorId,
        produtoId: 'PROD-1',
        quantidade: 10,
        unidadeMedida: 'UN',
        lote: null,
        validade: null,
        numeroSerie: null,
        enderecoSugeridoId,
        enderecoConfirmadoId: null,
        status: 'pendente' as const,
        produtoSku: 'SKU-1',
        produtoNome: 'Produto',
        enderecoSugeridoLabel: 'A-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    tarefas: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ValidarDemandaArmazenagemUseCase,
        { provide: ARMAZENAGEM_REPOSITORY, useValue: armazenagemRepository },
      ],
    }).compile();

    useCase = moduleRef.get(ValidarDemandaArmazenagemUseCase);
  });

  it('throws when demanda is not found', async () => {
    armazenagemRepository.findDemandaById.mockResolvedValue(null);

    await expect(
      useCase.execute({ demandaId, userId: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when demanda is not awaiting validation', async () => {
    armazenagemRepository.findDemandaById.mockResolvedValue({
      ...demandaValidacao,
      status: 'aguardando_inicio',
    });

    await expect(
      useCase.execute({ demandaId, userId: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when item has no suggested address', async () => {
    armazenagemRepository.findDemandaById.mockResolvedValue({
      ...demandaValidacao,
      itens: [
        {
          ...demandaValidacao.itens[0],
          enderecoSugeridoId: null,
        },
      ],
    });

    await expect(
      useCase.execute({ demandaId, userId: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('promotes unitizadores and updates demanda status on success', async () => {
    armazenagemRepository.findDemandaById
      .mockResolvedValueOnce(demandaValidacao)
      .mockResolvedValueOnce({
        ...demandaValidacao,
        status: 'aguardando_inicio',
        validadoPor: 1,
        validadoEm: new Date(),
      });

    const result = await useCase.execute({ demandaId, userId: 1 });

    expect(armazenagemRepository.updateUnitizadorStatus).toHaveBeenCalledWith(
      unitizadorId,
      'aguardando_armazenagem',
    );
    expect(armazenagemRepository.updateStatusDemanda).toHaveBeenCalledWith(
      demandaId,
      'aguardando_inicio',
      expect.objectContaining({
        validadoPor: 1,
        validadoEm: expect.any(Date),
      }),
    );
    expect(result.status).toBe('aguardando_inicio');
  });
});
