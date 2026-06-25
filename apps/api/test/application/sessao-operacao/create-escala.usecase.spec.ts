import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { CreateEscalaUseCase } from '../../../src/application/usecases/sessao-operacao/create-escala.usecase.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../src/domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const baseInput = {
  unidadeId: 'ITB',
  nomeEscala: 'Manhã Expedição',
  nomeEquipe: 'Equipe A',
};

const escalaResult = {
  id: 'escala-1',
  unidadeId: 'ITB',
  equipeId: 'equipe-1',
  nome: 'Manhã Expedição',
  horaInicioPlanejada: '06:00',
  horaFimPlanejada: '14:00',
  cruzaMeiaNoite: false,
  ativo: true,
  equipeNome: 'Equipe A',
  equipeArea: null,
  totalFuncionarios: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CreateEscalaUseCase', () => {
  it('creates escala diurna', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      createEscalaComEquipe: vi.fn().mockResolvedValue({
        ...escalaResult,
        horaInicioPlanejada: '06:00',
        horaFimPlanejada: '14:00',
        cruzaMeiaNoite: false,
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateEscalaUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateEscalaUseCase);
    const result = await useCase.execute({
      ...baseInput,
      horaInicio: '06:00',
      horaFim: '14:00',
    });

    expect(repository.createEscalaComEquipe).toHaveBeenCalledWith({
      ...baseInput,
      horaInicio: '06:00',
      horaFim: '14:00',
    });
    expect(result.cruzaMeiaNoite).toBe(false);
  });

  it('creates escala noturna', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      createEscalaComEquipe: vi.fn().mockResolvedValue({
        ...escalaResult,
        nome: 'Noite Picking',
        horaInicioPlanejada: '22:00',
        horaFimPlanejada: '06:00',
        cruzaMeiaNoite: true,
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateEscalaUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateEscalaUseCase);
    const result = await useCase.execute({
      ...baseInput,
      nomeEscala: 'Noite Picking',
      horaInicio: '22:00',
      horaFim: '06:00',
    });

    expect(result.cruzaMeiaNoite).toBe(true);
  });

  it('propagates validation error for equal hours', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      createEscalaComEquipe: vi.fn().mockRejectedValue(
        new Error('Hora de início e fim não podem ser iguais'),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateEscalaUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateEscalaUseCase);

    await expect(
      useCase.execute({
        ...baseInput,
        horaInicio: '08:00',
        horaFim: '08:00',
      }),
    ).rejects.toThrow('Hora de início e fim não podem ser iguais');
  });
});
