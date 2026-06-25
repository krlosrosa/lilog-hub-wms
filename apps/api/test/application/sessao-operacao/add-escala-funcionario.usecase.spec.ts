import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AddEscalaFuncionarioUseCase } from '../../../src/application/usecases/sessao-operacao/add-escala-funcionario.usecase.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../src/domain/repositories/funcionario/funcionario.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../src/domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const escala = {
  id: 'escala-1',
  unidadeId: 'ITB',
  equipeId: 'equipe-1',
  nome: 'Manhã',
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

describe('AddEscalaFuncionarioUseCase', () => {
  it('rejects funcionario from another unidade', async () => {
    const sessaoRepository: Partial<ISessaoOperacaoRepository> = {
      findEscalaById: vi.fn().mockResolvedValue(escala),
      addEquipeFuncionarios: vi.fn(),
    };

    const funcionarioRepository: Partial<IFuncionarioRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 10,
        unidadeId: 'OUTRA',
        matricula: '1001',
        nome: 'João',
        cargo: 'separador',
        situacao: 'ativo',
        dataAdmissao: new Date(),
        createdAt: new Date(),
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AddEscalaFuncionarioUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: sessaoRepository,
        },
        {
          provide: FUNCIONARIO_REPOSITORY,
          useValue: funcionarioRepository,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AddEscalaFuncionarioUseCase);

    await expect(useCase.execute('escala-1', [10])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(sessaoRepository.addEquipeFuncionarios).not.toHaveBeenCalled();
  });

  it('adds multiple funcionarios from same unidade', async () => {
    const members = [
      {
        id: 'membro-1',
        funcionarioId: 10,
        matricula: '1001',
        nome: 'João',
        cargo: 'separador',
        vigenciaInicio: null,
        vigenciaFim: null,
        createdAt: new Date(),
      },
      {
        id: 'membro-2',
        funcionarioId: 11,
        matricula: '1002',
        nome: 'Maria',
        cargo: 'conferente',
        vigenciaInicio: null,
        vigenciaFim: null,
        createdAt: new Date(),
      },
    ];

    const sessaoRepository: Partial<ISessaoOperacaoRepository> = {
      findEscalaById: vi.fn().mockResolvedValue(escala),
      addEquipeFuncionarios: vi.fn().mockResolvedValue(members),
    };

    const funcionarioRepository: Partial<IFuncionarioRepository> = {
      findById: vi.fn().mockImplementation(async (id: number) => ({
        id,
        unidadeId: 'ITB',
        matricula: String(1000 + id),
        nome: id === 10 ? 'João' : 'Maria',
        cargo: 'separador',
        situacao: 'ativo',
        dataAdmissao: new Date(),
        createdAt: new Date(),
      })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AddEscalaFuncionarioUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: sessaoRepository,
        },
        {
          provide: FUNCIONARIO_REPOSITORY,
          useValue: funcionarioRepository,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AddEscalaFuncionarioUseCase);
    const result = await useCase.execute('escala-1', [10, 11]);

    expect(sessaoRepository.addEquipeFuncionarios).toHaveBeenCalledWith(
      'equipe-1',
      [10, 11],
    );
    expect(result.adicionados).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('throws when escala not found', async () => {
    const sessaoRepository: Partial<ISessaoOperacaoRepository> = {
      findEscalaById: vi.fn().mockResolvedValue(null),
    };

    const funcionarioRepository: Partial<IFuncionarioRepository> = {
      findById: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AddEscalaFuncionarioUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: sessaoRepository,
        },
        {
          provide: FUNCIONARIO_REPOSITORY,
          useValue: funcionarioRepository,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AddEscalaFuncionarioUseCase);

    await expect(useCase.execute('missing', [10])).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
