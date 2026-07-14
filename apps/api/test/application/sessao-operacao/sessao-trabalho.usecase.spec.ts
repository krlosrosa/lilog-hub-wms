import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AbrirSessaoUseCase } from '../../../src/application/usecases/sessao-operacao/abrir-sessao.usecase.js';
import { CreateSessaoUseCase } from '../../../src/application/usecases/sessao-operacao/create-sessao.usecase.js';
import { EncerrarSessaoUseCase } from '../../../src/application/usecases/sessao-operacao/encerrar-sessao.usecase.js';
import { FinalizarSessaoFuncionarioPausaUseCase } from '../../../src/application/usecases/sessao-operacao/finalizar-sessao-funcionario-pausa.usecase.js';
import { IniciarSessaoFuncionarioPausaUseCase } from '../../../src/application/usecases/sessao-operacao/iniciar-sessao-funcionario-pausa.usecase.js';
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
  totalFuncionarios: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sessaoPlanejada = {
  id: 'sessao-1',
  unidadeId: 'ITB',
  escalaId: 'escala-1',
  equipeId: 'equipe-1',
  dataReferencia: '2026-06-20',
  inicioPlanejado: new Date('2026-06-20T09:00:00.000Z'),
  fimPlanejado: new Date('2026-06-20T17:00:00.000Z'),
  inicioReal: null,
  fimReal: null,
  status: 'planejada' as const,
  escalaNome: 'Manhã',
  equipeNome: 'Equipe A',
  horaInicioPlanejada: '06:00',
  horaFimPlanejada: '14:00',
  cruzaMeiaNoite: false,
  totalFuncionarios: 2,
  abertaPorUserId: null,
  encerradaPorUserId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CreateSessaoUseCase', () => {
  it('creates sessao when escala is active', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findEscalaById: vi.fn().mockResolvedValue(escala),
      findSessaoAbertaByEscalaId: vi.fn().mockResolvedValue(null),
      createSessao: vi.fn().mockResolvedValue(sessaoPlanejada),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateSessaoUseCase);
    const result = await useCase.execute({
      escalaId: 'escala-1',
      dataReferencia: '2026-06-20',
    });

    expect(repository.createSessao).toHaveBeenCalled();
    expect(result.status).toBe('planejada');
  });

  it('throws when escala not found', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findEscalaById: vi.fn().mockResolvedValue(null),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateSessaoUseCase);

    await expect(
      useCase.execute({ escalaId: 'missing', dataReferencia: '2026-06-20' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws conflict on duplicate escala and date', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findEscalaById: vi.fn().mockResolvedValue(escala),
      findSessaoAbertaByEscalaId: vi.fn().mockResolvedValue(null),
      createSessao: vi
        .fn()
        .mockRejectedValue(
          new Error('duplicate key value violates unique constraint'),
        ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateSessaoUseCase);

    await expect(
      useCase.execute({ escalaId: 'escala-1', dataReferencia: '2026-06-20' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws conflict when escala already has open sessao', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findEscalaById: vi.fn().mockResolvedValue(escala),
      findSessaoAbertaByEscalaId: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      createSessao: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateSessaoUseCase);

    await expect(
      useCase.execute({ escalaId: 'escala-1', dataReferencia: '2026-06-21' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createSessao).not.toHaveBeenCalled();
  });
});

describe('AbrirSessaoUseCase', () => {
  it('opens planned sessao', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue(sessaoPlanejada),
      abrirSessao: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AbrirSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(AbrirSessaoUseCase);
    const result = await useCase.execute('sessao-1', 1);

    expect(repository.abrirSessao).toHaveBeenCalledWith('sessao-1', 1);
    expect(result.status).toBe('aberta');
  });

  it('rejects opening non-planned sessao', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AbrirSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(AbrirSessaoUseCase);

    await expect(useCase.execute('sessao-1', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('EncerrarSessaoUseCase', () => {
  it('closes open sessao when all presences are marked', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      listSessaoFuncionarios: vi.fn().mockResolvedValue([
        { status: 'presente' },
        { status: 'falta' },
      ]),
      countPausasAbertasBySessaoId: vi.fn().mockResolvedValue(0),
      encerrarSessao: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'encerrada',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EncerrarSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(EncerrarSessaoUseCase);
    const result = await useCase.execute('sessao-1', 1);

    expect(repository.encerrarSessao).toHaveBeenCalledWith('sessao-1', 1);
    expect(result.status).toBe('encerrada');
  });

  it('rejects closing non-open sessao', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue(sessaoPlanejada),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EncerrarSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(EncerrarSessaoUseCase);

    await expect(useCase.execute('sessao-1', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects closing sessao with pending funcionarios', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      listSessaoFuncionarios: vi.fn().mockResolvedValue([
        { status: 'presente' },
        { status: 'esperado' },
      ]),
      encerrarSessao: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EncerrarSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(EncerrarSessaoUseCase);

    await expect(useCase.execute('sessao-1', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.encerrarSessao).not.toHaveBeenCalled();
  });

  it('rejects closing sessao with open pausas', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      listSessaoFuncionarios: vi.fn().mockResolvedValue([
        { status: 'presente' },
        { status: 'presente' },
      ]),
      countPausasAbertasBySessaoId: vi.fn().mockResolvedValue(2),
      encerrarSessao: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EncerrarSessaoUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(EncerrarSessaoUseCase);

    await expect(useCase.execute('sessao-1', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.encerrarSessao).not.toHaveBeenCalled();
  });
});

describe('IniciarSessaoFuncionarioPausaUseCase', () => {
  it('starts pausa when sessao is open and funcionario is presente', async () => {
    const pausa = {
      id: 'pausa-1',
      tipo: 'termica' as const,
      inicio: new Date(),
      fim: null,
      observacao: null,
      registradoPorUserId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      findSessaoFuncionario: vi.fn().mockResolvedValue({ status: 'presente' }),
      listSessaoFuncionarioPausas: vi.fn().mockResolvedValue({
        pausas: [],
        emPausaAgora: false,
        totalMinutosPausados: 0,
      }),
      iniciarSessaoFuncionarioPausa: vi.fn().mockResolvedValue(pausa),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IniciarSessaoFuncionarioPausaUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(IniciarSessaoFuncionarioPausaUseCase);
    const result = await useCase.execute('sessao-1', 10, 1, { tipo: 'termica' });

    expect(repository.iniciarSessaoFuncionarioPausa).toHaveBeenCalledWith(
      'sessao-1',
      10,
      1,
      { tipo: 'termica' },
    );
    expect(result.tipo).toBe('termica');
  });

  it('rejects when funcionario already has open pausa', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      findSessaoFuncionario: vi.fn().mockResolvedValue({ status: 'presente' }),
      listSessaoFuncionarioPausas: vi.fn().mockResolvedValue({
        pausas: [],
        emPausaAgora: true,
        totalMinutosPausados: 5,
      }),
      iniciarSessaoFuncionarioPausa: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IniciarSessaoFuncionarioPausaUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(IniciarSessaoFuncionarioPausaUseCase);

    await expect(
      useCase.execute('sessao-1', 10, 1, { tipo: 'refeicao' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.iniciarSessaoFuncionarioPausa).not.toHaveBeenCalled();
  });
});

describe('FinalizarSessaoFuncionarioPausaUseCase', () => {
  it('finalizes open pausa', async () => {
    const pausa = {
      id: 'pausa-1',
      tipo: 'termica' as const,
      inicio: new Date('2026-06-20T10:00:00.000Z'),
      fim: new Date('2026-06-20T10:15:00.000Z'),
      observacao: null,
      registradoPorUserId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      findSessaoFuncionario: vi.fn().mockResolvedValue({ status: 'presente' }),
      listSessaoFuncionarioPausas: vi.fn().mockResolvedValue({
        pausas: [pausa],
        emPausaAgora: true,
        totalMinutosPausados: 0,
      }),
      finalizarSessaoFuncionarioPausa: vi.fn().mockResolvedValue({
        ...pausa,
        fim: new Date('2026-06-20T10:15:00.000Z'),
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FinalizarSessaoFuncionarioPausaUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(FinalizarSessaoFuncionarioPausaUseCase);
    const result = await useCase.execute('sessao-1', 10, 1);

    expect(repository.finalizarSessaoFuncionarioPausa).toHaveBeenCalledWith(
      'sessao-1',
      10,
      1,
    );
    expect(result.fim).not.toBeNull();
  });

  it('rejects when no open pausa', async () => {
    const repository: Partial<ISessaoOperacaoRepository> = {
      findSessaoById: vi.fn().mockResolvedValue({
        ...sessaoPlanejada,
        status: 'aberta',
      }),
      findSessaoFuncionario: vi.fn().mockResolvedValue({ status: 'presente' }),
      listSessaoFuncionarioPausas: vi.fn().mockResolvedValue({
        pausas: [],
        emPausaAgora: false,
        totalMinutosPausados: 0,
      }),
      finalizarSessaoFuncionarioPausa: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FinalizarSessaoFuncionarioPausaUseCase,
        { provide: SESSAO_OPERACAO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(FinalizarSessaoFuncionarioPausaUseCase);

    await expect(useCase.execute('sessao-1', 10, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.finalizarSessaoFuncionarioPausa).not.toHaveBeenCalled();
  });
});
