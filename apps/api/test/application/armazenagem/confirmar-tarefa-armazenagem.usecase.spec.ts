import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmarTarefaArmazenagemUseCase } from '../../../src/application/usecases/armazenagem/confirmar-tarefa-armazenagem.usecase.js';
import { ARMAZENAGEM_REPOSITORY } from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';
import { ENDERECO_REPOSITORY } from '../../../src/domain/repositories/endereco/endereco.repository.js';

describe('ConfirmarTarefaArmazenagemUseCase', () => {
  const armazenagemRepository = {
    findDemandaById: vi.fn(),
    findTarefaById: vi.fn(),
    getPoliticaArmazenagem: vi.fn(),
    findUnitizadorByCodigo: vi.fn(),
    updateUnitizadorStatus: vi.fn(),
    updateStatusItem: vi.fn(),
    updateStatusTarefa: vi.fn(),
    updateStatusDemanda: vi.fn(),
  };
  const enderecoRepository = {
    findById: vi.fn(),
  };

  let useCase: ConfirmarTarefaArmazenagemUseCase;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConfirmarTarefaArmazenagemUseCase,
        { provide: ARMAZENAGEM_REPOSITORY, useValue: armazenagemRepository },
        { provide: ENDERECO_REPOSITORY, useValue: enderecoRepository },
      ],
    }).compile();

    useCase = moduleRef.get(ConfirmarTarefaArmazenagemUseCase);
  });

  it('throws when demanda is not found', async () => {
    armazenagemRepository.findDemandaById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        demandaId: '00000000-0000-4000-8000-000000000001',
        tarefaId: '00000000-0000-4000-8000-000000000002',
        data: {
          enderecoConfirmadoId: '00000000-0000-4000-8000-000000000003',
        },
        operatorId: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when tarefa already stored', async () => {
    armazenagemRepository.findDemandaById.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      unidadeId: 'UN-1',
      status: 'em_andamento',
      tarefas: [
        {
          id: '00000000-0000-4000-8000-000000000002',
          demandaId: '00000000-0000-4000-8000-000000000001',
          status: 'armazenada',
          itens: [],
        },
      ],
    });

    await expect(
      useCase.execute({
        demandaId: '00000000-0000-4000-8000-000000000001',
        tarefaId: '00000000-0000-4000-8000-000000000002',
        data: {
          enderecoConfirmadoId: '00000000-0000-4000-8000-000000000003',
        },
        operatorId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when unitizadorCodigo does not match tarefa unitizador', async () => {
    const demandaId = '00000000-0000-4000-8000-000000000001';
    const tarefaId = '00000000-0000-4000-8000-000000000002';
    const enderecoId = '00000000-0000-4000-8000-000000000003';
    const unitizadorEsperado = '00000000-0000-4000-8000-000000000004';
    const unitizadorInformado = '00000000-0000-4000-8000-000000000005';

    armazenagemRepository.findDemandaById.mockResolvedValue({
      id: demandaId,
      unidadeId: 'UN-1',
      status: 'em_andamento',
      tarefas: [
        {
          id: tarefaId,
          demandaId,
          unitizadorId: unitizadorEsperado,
          status: 'pendente',
          enderecoSugeridoId: null,
          itens: [],
        },
      ],
    });
    enderecoRepository.findById.mockResolvedValue({
      id: enderecoId,
      unidadeId: 'UN-1',
    });
    armazenagemRepository.getPoliticaArmazenagem.mockResolvedValue({
      enderecoDivergente: 'bloquear',
    });
    armazenagemRepository.findUnitizadorByCodigo.mockResolvedValue({
      id: unitizadorInformado,
      codigo: 'PAL-WRONG',
    });

    await expect(
      useCase.execute({
        demandaId,
        tarefaId,
        data: {
          enderecoConfirmadoId: enderecoId,
          unitizadorCodigo: 'PAL-WRONG',
        },
        operatorId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
