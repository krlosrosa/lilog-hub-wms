import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ConferirItemUseCase } from '../../../src/application/usecases/recebimento/conferir-item.usecase.js';
import { EncerrarConferenciaUseCase } from '../../../src/application/usecases/recebimento/encerrar-conferencia.usecase.js';
import { FinalizarRecebimentoUseCase } from '../../../src/application/usecases/recebimento/finalizar-recebimento.usecase.js';
import { GetConferenciaContextUseCase } from '../../../src/application/usecases/recebimento/get-conferencia-context.usecase.js';
import { ListOperadorDemandasUseCase } from '../../../src/application/usecases/recebimento/list-operador-demandas.usecase.js';
import { RegistrarAvariaUseCase } from '../../../src/application/usecases/recebimento/registrar-avaria.usecase.js';
import { CncEventPublisher } from '../../../src/application/services/cnc-event.publisher.js';
import { RecebimentoEventPublisher } from '../../../src/application/services/recebimento-event.publisher.js';
import { DistribuirSaldoRecebimentoFinalizadoUseCase } from '../../../src/application/usecases/estoque/distribuir-saldo-recebimento-finalizado.usecase.js';
import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../src/domain/repositories/recebimento/conferencia.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../src/domain/repositories/produto/produto.repository.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type IRecebimentoAvariaRepository,
} from '../../../src/domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../src/domain/repositories/user/user.repository.js';

describe('ListOperadorDemandasUseCase', () => {
  it('does not expose expected quantities in operator demands', async () => {
    const repository: Partial<IConferenciaRepository> = {
      listOperadorDemandas: vi.fn().mockResolvedValue([
        {
          preRecebimentoId: 'pre-1',
          recebimentoId: null,
          unidadeId: 'ITB',
          placa: 'ABC1D23',
          transportadoraId: 'trans-1',
          situacao: 'veiculo_chegou',
          dock: '04',
          skuCount: 3,
          horarioPrevisto: new Date('2026-06-07T10:00:00.000Z'),
        },
      ]),
    };

    const userRepository: Partial<IUserRepository> = {
      findById: vi.fn(),
      listAccessibleUnidades: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListOperadorDemandasUseCase,
        { provide: CONFERENCIA_REPOSITORY, useValue: repository },
        { provide: USER_REPOSITORY, useValue: userRepository },
      ],
    }).compile();

    const useCase = moduleRef.get(ListOperadorDemandasUseCase);
    const result = await useCase.execute({ unidadeId: 'ITB', userId: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).not.toHaveProperty('quantidadeEsperada');
    expect(result.items[0]?.skuCount).toBe(3);
    expect(result.items[0]?.horarioPrevisto).toBe('2026-06-07T10:00:00.000Z');
  });
});

describe('GetConferenciaContextUseCase', () => {
  it('returns blind items without expected qty fields', async () => {
    const repository: Partial<IConferenciaRepository> = {
      getConferenciaContext: vi.fn().mockResolvedValue({
        preRecebimentoId: 'pre-1',
        recebimentoId: 'rec-1',
        unidadeId: 'ITB',
        placa: 'ABC1D23',
        transportadoraId: 'trans-1',
        situacao: 'em_recebimento',
        recebimentoSituacao: 'em_recebimento',
        dock: '04',
        checklistPreenchido: true,
        itens: [
          {
            produtoId: 'prod-1',
            sku: 'SKU-1',
            descricao: 'Produto 1',
            unidadeMedida: 'UN',
            unidadesPorCaixa: 12,
            config: {
              controlaLote: false,
              controlaValidade: false,
              controlaPeso: false,
              pesoVariavel: false,
              controlaNumeroSerie: false,
            },
          },
        ],
        conferidos: [],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetConferenciaContextUseCase,
        { provide: CONFERENCIA_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(GetConferenciaContextUseCase);
    const result = await useCase.execute('pre-1');

    expect(result.itens[0]).not.toHaveProperty('quantidadeEsperada');
    expect(result.conferidos).toEqual([]);
  });

  it('rejects conference for finalized pre-recebimento', async () => {
    const repository: Partial<IConferenciaRepository> = {
      getConferenciaContext: vi.fn().mockResolvedValue({
        preRecebimentoId: 'pre-1',
        recebimentoId: null,
        unidadeId: 'ITB',
        placa: 'ABC1D23',
        transportadoraId: 'trans-1',
        situacao: 'finalizado',
        recebimentoSituacao: null,
        dock: null,
        checklistPreenchido: false,
        itens: [],
        conferidos: [],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetConferenciaContextUseCase,
        { provide: CONFERENCIA_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(GetConferenciaContextUseCase);

    await expect(useCase.execute('pre-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ConferirItemUseCase', () => {
  it('rejects conferir when recebimento is not em_recebimento', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'aguardando_aprovacao',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConferirItemUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        { provide: PRE_RECEBIMENTO_REPOSITORY, useValue: {} },
        { provide: PRODUTO_REPOSITORY, useValue: {} },
        {
          provide: RecebimentoEventPublisher,
          useValue: { publish: vi.fn() },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ConferirItemUseCase);

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        data: {
          produtoId: '00000000-0000-4000-8000-000000000001',
          quantidadeRecebida: 1,
          unidadeMedida: 'UN',
        },
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('EncerrarConferenciaUseCase', () => {
  it('calculates divergencias and updates status', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'rec-1',
          preRecebimentoId: 'pre-1',
          situacao: 'em_recebimento',
          responsavelId: 10,
        })
        .mockResolvedValueOnce({
          id: 'rec-1',
          preRecebimentoId: 'pre-1',
          situacao: 'aguardando_aprovacao',
          divergencias: [{ id: 'div-1' }],
        }),
      findItemsByRecebimento: vi.fn().mockResolvedValue([
        {
          id: 'item-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 8,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          recebimentoId: 'rec-1',
          createdAt: new Date(),
        },
      ]),
      clearDivergencias: vi.fn(),
      createDivergencia: vi.fn().mockResolvedValue({
        id: 'div-1',
        tipoDivergencia: 'quantidade_menor',
        produtoId: 'prod-1',
      }),
      updateStatus: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'aguardando_aprovacao',
      }),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
        transportadoraId: 'transp-1',
        itens: [
          {
            id: 'pre-item-1',
            produtoId: 'prod-1',
            quantidadeEsperada: 10,
            unidadeMedida: 'UN',
            unidadesPorCaixa: 1,
            loteEsperado: null,
            pesoEsperado: null,
            validadeEsperada: null,
            preRecebimentoId: 'pre-1',
            createdAt: new Date(),
          },
        ],
      }),
      updateSituacao: vi.fn(),
    };

    const publish = vi.fn().mockResolvedValue(undefined);
    const eventPublisher = { publish } as unknown as RecebimentoEventPublisher;

    const useCase = new EncerrarConferenciaUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      eventPublisher,
    );
    const result = await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(recebimentoRepository.createDivergencia).toHaveBeenCalled();
    expect(publish).toHaveBeenCalled();
    expect(recebimentoRepository.updateStatus).toHaveBeenCalledWith(
      'rec-1',
      'aguardando_aprovacao',
      expect.any(Date),
    );
    expect(result?.situacao).toBe('aguardando_aprovacao');
  });
});

describe('FinalizarRecebimentoUseCase', () => {
  it('publishes CNC event when finalizing with divergencias or avarias', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'aprovado',
        dataFim: new Date(),
        responsavelId: 10,
        itens: [{ produtoId: 'prod-1' }],
        divergencias: [
          {
            id: 'div-1',
            tipoDivergencia: 'quantidade_menor',
            produtoId: 'prod-1',
          },
        ],
      }),
      updateStatus: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'finalizado',
      }),
      findItemsByRecebimento: vi.fn().mockResolvedValue([
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 8,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          createdAt: new Date(),
        },
      ]),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
        transportadoraId: 'transp-1',
        itens: [{ produtoId: 'prod-1' }],
      }),
      updateSituacao: vi.fn(),
    };

    const avariaRepository: Partial<IRecebimentoAvariaRepository> = {
      listByRecebimento: vi.fn().mockResolvedValue([]),
    };

    const publish = vi.fn().mockResolvedValue(undefined);
    const eventPublisher = { publish } as unknown as RecebimentoEventPublisher;
    const cncPublish = vi.fn().mockResolvedValue(undefined);
    const cncEventPublisher = {
      publish: cncPublish,
    } as unknown as CncEventPublisher;

    const distribuirSaldo = {
      execute: vi.fn().mockResolvedValue({ itensAguardandoArmazenagem: [] }),
    } as unknown as DistribuirSaldoRecebimentoFinalizadoUseCase;

    const useCase = new FinalizarRecebimentoUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      avariaRepository as IRecebimentoAvariaRepository,
      eventPublisher,
      cncEventPublisher,
      distribuirSaldo,
    );

    await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(distribuirSaldo.execute).toHaveBeenCalled();
    expect(recebimentoRepository.updateStatus).toHaveBeenCalledWith(
      'rec-1',
      'finalizado',
    );
    expect(cncPublish).toHaveBeenCalled();
  });
});

describe('RegistrarAvariaUseCase', () => {
  it('rejects when no quantities are informed', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrarAvariaUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: {} },
        { provide: RECEBIMENTO_AVARIA_REPOSITORY, useValue: {} },
        { provide: PRODUTO_REPOSITORY, useValue: {} },
      ],
    }).compile();

    const useCase = moduleRef.get(RegistrarAvariaUseCase);

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        tipo: 'fisica',
        natureza: 'parcial',
        causa: 'transporte',
        quantidadeCaixas: 0,
        quantidadeUnidades: 0,
        operatorId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replicates avaria for conferidos when requested', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'em_recebimento',
      }),
      findItemsByRecebimento: vi.fn().mockResolvedValue([
        { id: 'item-1', produtoId: 'prod-1', quantidadeRecebida: 5, unidadeMedida: 'UN' },
        { id: 'item-2', produtoId: 'prod-2', quantidadeRecebida: 2, unidadeMedida: 'UN' },
      ]),
    };

    const produtoRepository: Partial<IProdutoRepository> = {
      findById: vi
        .fn()
        .mockImplementation(async (id: string) => ({
          id,
          sku: id === 'prod-1' ? 'SKU-1' : 'SKU-2',
          descricao: 'Produto',
          empresa: 'ITB',
          categoria: 'seco',
          tipo: 'PNOR',
          ean: null,
          dum: null,
          shelfLife: null,
          pesoBrutoUnidade: null,
          pesoBrutoCaixa: null,
          pesoBrutoPalete: null,
          unidadesPorCaixa: 12,
          caixasPorPalete: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          produtoId: id,
        })),
    };

    const createdAt = new Date('2026-06-07T12:00:00.000Z');
    const avariaRepository: Partial<IRecebimentoAvariaRepository> = {
      createMany: vi.fn().mockResolvedValue([
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          tipo: 'fisica',
          natureza: 'parcial',
          causa: 'transporte',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 0,
          replicado: true,
          operatorId: 1,
          createdAt,
        },
        {
          id: 'av-2',
          recebimentoId: 'rec-1',
          produtoId: 'prod-2',
          tipo: 'fisica',
          natureza: 'parcial',
          causa: 'transporte',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 0,
          replicado: true,
          operatorId: 1,
          createdAt,
        },
      ]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrarAvariaUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        { provide: RECEBIMENTO_AVARIA_REPOSITORY, useValue: avariaRepository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
      ],
    }).compile();

    const useCase = moduleRef.get(RegistrarAvariaUseCase);
    const result = await useCase.execute({
      recebimentoId: 'rec-1',
      tipo: 'fisica',
      natureza: 'parcial',
      causa: 'transporte',
      quantidadeCaixas: 1,
      quantidadeUnidades: 0,
      replicarParaTodos: true,
      skusAlvo: ['SKU-1', 'SKU-2'],
      operatorId: 1,
    });

    expect(avariaRepository.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ produtoId: 'prod-1', replicado: true }),
        expect.objectContaining({ produtoId: 'prod-2', replicado: true }),
      ]),
    );
    expect(result.items).toHaveLength(2);
  });

  it('throws when recebimento does not exist', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrarAvariaUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        { provide: RECEBIMENTO_AVARIA_REPOSITORY, useValue: {} },
        { provide: PRODUTO_REPOSITORY, useValue: {} },
      ],
    }).compile();

    const useCase = moduleRef.get(RegistrarAvariaUseCase);

    await expect(
      useCase.execute({
        recebimentoId: 'missing',
        tipo: 'fisica',
        natureza: 'parcial',
        causa: 'transporte',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
        operatorId: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
