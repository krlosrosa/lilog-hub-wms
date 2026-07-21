import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ConferirItemUseCase } from '../../../src/application/usecases/recebimento/conferir-item.usecase.js';
import { RemoverConferenciaItemUseCase } from '../../../src/application/usecases/recebimento/remover-conferencia-item.usecase.js';
import { RemoverLinhaConferenciaRecebimentoUseCase } from '../../../src/application/usecases/recebimento/remover-linha-conferencia-recebimento.usecase.js';
import { RemoverPaleteConferenciaRecebimentoUseCase } from '../../../src/application/usecases/recebimento/remover-palete-conferencia-recebimento.usecase.js';
import { EncerrarConferenciaUseCase } from '../../../src/application/usecases/recebimento/encerrar-conferencia.usecase.js';
import { ReabrirConferenciaUseCase } from '../../../src/application/usecases/recebimento/reabrir-conferencia.usecase.js';
import { FinalizarRecebimentoUseCase } from '../../../src/application/usecases/recebimento/finalizar-recebimento.usecase.js';
import { GetConferenciaContextUseCase } from '../../../src/application/usecases/recebimento/get-conferencia-context.usecase.js';
import { ListOperadorDemandasUseCase } from '../../../src/application/usecases/recebimento/list-operador-demandas.usecase.js';
import { RegistrarAvariaUseCase } from '../../../src/application/usecases/recebimento/registrar-avaria.usecase.js';
import { CncEventPublisher } from '../../../src/application/services/cnc-event.publisher.js';
import { RecebimentoEventPublisher } from '../../../src/application/services/recebimento-event.publisher.js';
import { RecebimentoSaldoEventPublisher } from '../../../src/application/services/recebimento-saldo-event.publisher.js';
import { GerarDemandaArmazenagemUseCase } from '../../../src/application/usecases/armazenagem/gerar-demanda-armazenagem.usecase.js';
import { ExecutarRegrasProcessoUseCase } from '../../../src/application/usecases/regra-processo/executar-regras-processo.usecase.js';
import {
  ARMAZENAGEM_REPOSITORY,
} from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../src/domain/repositories/estoque/estoque.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../src/domain/repositories/produto/produto.repository.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
} from '../../../src/domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
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
          transportadoraNome: 'trans-1',
          situacao: 'liberado_para_conferencia',
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
        transportadoraNome: 'trans-1',
        situacao: 'em_conferencia',
        recebimentoSituacao: 'em_conferencia',
        dock: '04',
        checklistPreenchido: true,
        modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
        exigePaleteConferencia: false,
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
              exigirEtiquetaPesoVariavel: false,
              controlaNumeroSerie: false,
            },
          },
        ],
        conferidos: [],
        resumoConferido: [],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetConferenciaContextUseCase,
        { provide: CONFERENCIA_REPOSITORY, useValue: repository },
        {
          provide: CONFIGURACAO_OPERACIONAL_REPOSITORY,
          useValue: { list: vi.fn().mockResolvedValue([]) },
        },
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
        transportadoraNome: 'trans-1',
        situacao: 'finalizado',
        recebimentoSituacao: null,
        dock: null,
        checklistPreenchido: false,
        modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
        exigePaleteConferencia: false,
        itens: [],
        conferidos: [],
        resumoConferido: [],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetConferenciaContextUseCase,
        { provide: CONFERENCIA_REPOSITORY, useValue: repository },
        {
          provide: CONFIGURACAO_OPERACIONAL_REPOSITORY,
          useValue: { list: vi.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(GetConferenciaContextUseCase);

    await expect(useCase.execute('pre-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ConferirItemUseCase', () => {
  it('rejects conferir when recebimento is not em_conferencia', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'conferido',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConferirItemUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        { provide: PRE_RECEBIMENTO_REPOSITORY, useValue: {} },
        { provide: PRODUTO_REPOSITORY, useValue: {} },
        {
          provide: CONFIGURACAO_OPERACIONAL_REPOSITORY,
          useValue: { list: vi.fn().mockResolvedValue([]) },
        },
        { provide: ARMAZENAGEM_REPOSITORY, useValue: {} },
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
          produtoId: 'PROD-001',
          quantidadeRecebida: 1,
          unidadeMedida: 'UN',
        },
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('RemoverConferenciaItemUseCase', () => {
  it('removes conferencia rows for a product during active conference', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'em_conferencia',
      }),
      removeItemsByProduto: vi.fn().mockResolvedValue({
        produtoId: 'PROD-001',
        removedCount: 2,
      }),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
      }),
    };

    const publish = vi.fn().mockResolvedValue(undefined);
    const eventPublisher = { publish } as unknown as RecebimentoEventPublisher;

    const useCase = new RemoverConferenciaItemUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      eventPublisher,
    );
    const result = await useCase.execute({
      recebimentoId: 'rec-1',
      produtoId: 'PROD-001',
      userId: 1,
    });

    expect(result.removedCount).toBe(2);
    expect(recebimentoRepository.removeItemsByProduto).toHaveBeenCalledWith(
      'rec-1',
      'PROD-001',
    );
    expect(publish).toHaveBeenCalled();
  });

  it('rejects removal when recebimento is not in conference', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'conferido',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RemoverConferenciaItemUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        {
          provide: PRE_RECEBIMENTO_REPOSITORY,
          useValue: { findById: vi.fn() },
        },
        {
          provide: RecebimentoEventPublisher,
          useValue: { publish: vi.fn() },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(RemoverConferenciaItemUseCase);

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        produtoId: 'PROD-001',
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('RemoverLinhaConferenciaRecebimentoUseCase', () => {
  it('removes a single conferencia row during active conference', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'em_conferencia',
      }),
      removeItemConferenciaById: vi.fn().mockResolvedValue({
        itemId: 'item-1',
        removed: true,
        produtoId: 'PROD-001',
      }),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
      }),
    };

    const publish = vi.fn().mockResolvedValue(undefined);
    const eventPublisher = { publish } as unknown as RecebimentoEventPublisher;

    const useCase = new RemoverLinhaConferenciaRecebimentoUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      eventPublisher,
    );

    const result = await useCase.execute({
      recebimentoId: 'rec-1',
      itemId: 'item-1',
      userId: 1,
    });

    expect(result.removed).toBe(true);
    expect(recebimentoRepository.removeItemConferenciaById).toHaveBeenCalledWith(
      'rec-1',
      'item-1',
    );
    expect(publish).toHaveBeenCalled();
  });

  it('throws when conferencia row is not found', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'em_conferencia',
      }),
      removeItemConferenciaById: vi.fn().mockResolvedValue({
        itemId: 'item-1',
        removed: false,
      }),
    };

    const useCase = new RemoverLinhaConferenciaRecebimentoUseCase(
      recebimentoRepository as IRecebimentoRepository,
      {
        findById: vi.fn().mockResolvedValue({ id: 'pre-1', unidadeId: 'ITB' }),
      } as IPreRecebimentoRepository,
      { publish: vi.fn() } as unknown as RecebimentoEventPublisher,
    );

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        itemId: 'item-1',
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('RemoverPaleteConferenciaRecebimentoUseCase', () => {
  it('removes conferencia rows for a palete during active conference', async () => {
    const unitizadorId = '00000000-0000-4000-8000-000000000010';

    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'em_conferencia',
      }),
      removeItensConferenciaByUnitizador: vi.fn().mockResolvedValue({
        unitizadorId,
        removedCount: 3,
      }),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
      }),
    };

    const armazenagemRepository = {
      findUnitizadorByCodigo: vi.fn().mockResolvedValue({
        id: unitizadorId,
        codigo: 'PLT-001',
      }),
    };

    const publish = vi.fn().mockResolvedValue(undefined);
    const eventPublisher = { publish } as unknown as RecebimentoEventPublisher;

    const useCase = new RemoverPaleteConferenciaRecebimentoUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      armazenagemRepository as never,
      eventPublisher,
    );

    const result = await useCase.execute({
      recebimentoId: 'rec-1',
      unitizadorCodigo: 'PLT-001',
      produtoId: 'PROD-001',
      userId: 1,
    });

    expect(result.removedCount).toBe(3);
    expect(
      recebimentoRepository.removeItensConferenciaByUnitizador,
    ).toHaveBeenCalledWith('rec-1', unitizadorId, 'PROD-001');
    expect(publish).toHaveBeenCalled();
  });

  it('throws when palete has no conferencia rows', async () => {
    const unitizadorId = '00000000-0000-4000-8000-000000000010';

    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'em_conferencia',
      }),
      removeItensConferenciaByUnitizador: vi.fn().mockResolvedValue({
        unitizadorId,
        removedCount: 0,
      }),
    };

    const useCase = new RemoverPaleteConferenciaRecebimentoUseCase(
      recebimentoRepository as IRecebimentoRepository,
      {
        findById: vi.fn().mockResolvedValue({ id: 'pre-1', unidadeId: 'ITB' }),
      } as IPreRecebimentoRepository,
      {
        findUnitizadorByCodigo: vi.fn().mockResolvedValue({
          id: unitizadorId,
          codigo: 'PLT-001',
        }),
      } as never,
      { publish: vi.fn() } as unknown as RecebimentoEventPublisher,
    );

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        unitizadorCodigo: 'PLT-001',
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
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
          situacao: 'em_conferencia',
          responsavelId: 10,
        })
        .mockResolvedValueOnce({
          id: 'rec-1',
          preRecebimentoId: 'pre-1',
          situacao: 'conferido',
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
        situacao: 'conferido',
      }),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
        transportadoraNome: 'transp-1',
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

    const produtoRepository: Partial<IProdutoRepository> = {
      findByProdutoId: vi.fn().mockResolvedValue({
        produtoId: 'prod-1',
        sku: 'SKU-001',
        descricao: 'Produto teste',
        empresa: 'lilog',
        categoria: 'seco',
        grupo: null,
        tipo: 'PPAD',
        ean: null,
        dum: null,
        shelfLife: null,
        pesoBrutoUnidade: '1',
        pesoBrutoCaixa: null,
        pesoBrutoPalete: null,
        pesoLiquidoUnidade: null,
        pesoLiquidoCaixa: null,
        pesoLiquidoPalete: null,
        unidadesPorCaixa: 1,
        caixasPorPalete: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const conferenciaRepository: Partial<IConferenciaRepository> = {
      listTemperaturasProduto: vi.fn().mockResolvedValue([
        { etapa: 'inicio', temperatura: -18, medidoEm: new Date() },
        { etapa: 'meio', temperatura: -17.5, medidoEm: new Date() },
        { etapa: 'fim', temperatura: -18.2, medidoEm: new Date() },
      ]),
    };

    const useCase = new EncerrarConferenciaUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      conferenciaRepository as IConferenciaRepository,
      produtoRepository as IProdutoRepository,
      eventPublisher,
    );
    const result = await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(recebimentoRepository.createDivergencia).toHaveBeenCalled();
    expect(publish).toHaveBeenCalled();
    expect(recebimentoRepository.updateStatus).toHaveBeenCalledWith(
      'rec-1',
      'conferido',
      expect.any(Date),
      undefined,
      undefined,
    );
    expect(result?.situacao).toBe('conferido');
  });

  it('returns idempotently when recebimento is already conferido', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'conferido',
        responsavelId: 10,
      }),
    };

    const useCase = new EncerrarConferenciaUseCase(
      recebimentoRepository as IRecebimentoRepository,
      {} as IPreRecebimentoRepository,
      {} as IConferenciaRepository,
      {} as IProdutoRepository,
      eventPublisher,
    );

    const result = await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(result?.situacao).toBe('conferido');
    expect(recebimentoRepository.findById).toHaveBeenCalledTimes(2);
  });

  it('rejects encerramento when temperaturas do baú are incomplete', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'em_conferencia',
        responsavelId: 10,
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
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
        transportadoraNome: 'transp-1',
        itens: [],
      }),
    };

    const conferenciaRepository: Partial<IConferenciaRepository> = {
      listTemperaturasProduto: vi.fn().mockResolvedValue([
        { etapa: 'inicio', temperatura: -18, medidoEm: new Date() },
      ]),
    };

    const useCase = new EncerrarConferenciaUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      conferenciaRepository as IConferenciaRepository,
      {} as IProdutoRepository,
      { publish: vi.fn() } as unknown as RecebimentoEventPublisher,
    );

    await expect(
      useCase.execute({ recebimentoId: 'rec-1', userId: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ReabrirConferenciaUseCase', () => {
  it('reopens conferencia from conferido to em_conferencia', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'rec-1',
          preRecebimentoId: 'pre-1',
          situacao: 'conferido',
          dataFim: new Date(),
          itens: [{ produtoId: 'prod-1' }],
          divergencias: [{ id: 'div-1' }],
        })
        .mockResolvedValueOnce({
          id: 'rec-1',
          preRecebimentoId: 'pre-1',
          situacao: 'em_conferencia',
          dataFim: null,
          itens: [{ produtoId: 'prod-1' }],
          divergencias: [],
        }),
      clearDivergencias: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'em_conferencia',
      }),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
        situacao: 'conferido',
      }),
      updateSituacao: vi.fn(),
    };

    const publish = vi.fn().mockResolvedValue(undefined);
    const eventPublisher = { publish } as unknown as RecebimentoEventPublisher;

    const useCase = new ReabrirConferenciaUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      eventPublisher,
    );

    const result = await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(recebimentoRepository.clearDivergencias).toHaveBeenCalledWith('rec-1');
    expect(recebimentoRepository.updateStatus).toHaveBeenCalledWith(
      'rec-1',
      'em_conferencia',
      null,
    );
    expect(preRecebimentoRepository.updateSituacao).toHaveBeenCalledWith(
      'pre-1',
      'em_conferencia',
    );
    expect(publish).toHaveBeenCalled();
    expect(result?.situacao).toBe('em_conferencia');
  });

  it('rejects reopen when recebimento is not conferido', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'em_conferencia',
      }),
    };

    const useCase = new ReabrirConferenciaUseCase(
      recebimentoRepository as IRecebimentoRepository,
      {} as IPreRecebimentoRepository,
      { publish: vi.fn() } as unknown as RecebimentoEventPublisher,
    );

    await expect(
      useCase.execute({ recebimentoId: 'rec-1', userId: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when recebimento is not found', async () => {
    const useCase = new ReabrirConferenciaUseCase(
      { findById: vi.fn().mockResolvedValue(null) } as IRecebimentoRepository,
      {} as IPreRecebimentoRepository,
      { publish: vi.fn() } as unknown as RecebimentoEventPublisher,
    );

    await expect(
      useCase.execute({ recebimentoId: 'missing', userId: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('FinalizarRecebimentoUseCase', () => {
  const unitizadorId = '00000000-0000-4000-8000-000000000010';

  const conferidoComUnitizador = {
    id: 'item-1',
    recebimentoId: 'rec-1',
    produtoId: 'prod-1',
    quantidadeRecebida: 8,
    unidadeMedida: 'UN',
    loteRecebido: null,
    pesoRecebido: null,
    validade: null,
    numeroSerie: null,
    unitizadorId,
    createdAt: new Date(),
  };

  function createUseCase(overrides?: {
    recebimento?: Record<string, unknown>;
    itensAguardando?: Array<Record<string, unknown>>;
    endereco?: Record<string, unknown> | null;
    itensConferidos?: Array<Record<string, unknown>>;
    avarias?: Array<Record<string, unknown>>;
  }) {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        preRecebimentoId: 'pre-1',
        situacao: 'conferido',
        dataFim: new Date(),
        responsavelId: 10,
        modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
        divergencias: [],
        ...overrides?.recebimento,
      }),
      updateStatus: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'finalizado',
      }),
      findItemsByRecebimento: vi.fn().mockResolvedValue(
        overrides?.itensConferidos ?? [
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
            unitizadorId: null,
            createdAt: new Date(),
          },
        ],
      ),
    };

    const preRecebimentoRepository: Partial<IPreRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'pre-1',
        unidadeId: 'ITB',
        transportadoraNome: 'transp-1',
        itens: [{ produtoId: 'prod-1' }],
      }),
      updateSituacao: vi.fn(),
    };

    const avariaRepository: Partial<IRecebimentoAvariaRepository> = {
      listByRecebimento: vi.fn().mockResolvedValue(overrides?.avarias ?? []),
    };

    const armazenagemRepository = {
      resolveDocumentoRefByRecebimentoId: vi.fn().mockResolvedValue('REC-001'),
      criarUnitizador: vi.fn().mockResolvedValue({
        id: unitizadorId,
        codigo: 'PAL-001',
      }),
    };

    const enderecoRepository = {
      findById: vi.fn().mockResolvedValue(overrides?.endereco ?? null),
    };

    const publish = vi.fn().mockResolvedValue(undefined);
    const eventPublisher = { publish } as unknown as RecebimentoEventPublisher;
    const cncPublish = vi.fn().mockResolvedValue(undefined);
    const cncEventPublisher = {
      publish: cncPublish,
    } as unknown as CncEventPublisher;

    const publishSaldo = vi.fn().mockResolvedValue(undefined);
    const recebimentoSaldoEventPublisher = {
      publishProcessarSaldo: publishSaldo,
    } as unknown as RecebimentoSaldoEventPublisher;

    const itensAguardandoDefault = overrides?.itensAguardando ?? [
      {
        unitizadorId: null,
        produtoId: 'prod-1',
        quantidade: 8,
        unidadeMedida: 'UN',
        lote: null,
        validade: null,
        numeroSerie: null,
      },
    ];

    const montarItensAguardandoArmazenagemRecebimentoService = {
      execute: vi.fn().mockResolvedValue(itensAguardandoDefault),
    };

    const montarPaletesArmazenagemService = {
      execute: vi.fn().mockReturnValue([
        {
          produtoId: 'prod-1',
          sequenciaGlobal: 1,
          sequenciaProduto: 1,
          quantidade: 8,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
          codigoUnitizador: 'PAL-001',
          itemBase: itensAguardandoDefault[0],
        },
      ]),
    };

    const gerarDemandaArmazenagem = {
      execute: vi.fn().mockResolvedValue({ id: 'demanda-1', tarefas: [], itens: [] }),
    } as unknown as GerarDemandaArmazenagemUseCase;

    const produtoRepository: Partial<IProdutoRepository> = {
      findByProdutoId: vi.fn().mockResolvedValue({ produtoId: 'prod-1' }),
    };

    const configuracaoOperacionalRepository = {
      list: vi.fn().mockResolvedValue([]),
    };

    const useCase = new FinalizarRecebimentoUseCase(
      recebimentoRepository as IRecebimentoRepository,
      preRecebimentoRepository as IPreRecebimentoRepository,
      avariaRepository as IRecebimentoAvariaRepository,
      produtoRepository as IProdutoRepository,
      armazenagemRepository as never,
      enderecoRepository as never,
      configuracaoOperacionalRepository as never,
      eventPublisher,
      cncEventPublisher,
      recebimentoSaldoEventPublisher,
      montarItensAguardandoArmazenagemRecebimentoService as never,
      montarPaletesArmazenagemService as never,
      gerarDemandaArmazenagem,
    );

    return {
      useCase,
      gerarDemandaArmazenagem,
      armazenagemRepository,
      recebimentoRepository,
      enderecoRepository,
      publishSaldo,
      cncPublish,
    };
  }

  it('publishes CNC event when finalizing with divergencias or avarias', async () => {
    const { useCase, gerarDemandaArmazenagem, recebimentoRepository, publishSaldo, cncPublish } =
      createUseCase({
        recebimento: {
          divergencias: [
            {
              id: 'div-1',
              tipoDivergencia: 'quantidade_menor',
              produtoId: 'prod-1',
              quantidadeEsperada: 10,
              quantidadeRecebida: 8,
            },
          ],
        },
      });

    await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(gerarDemandaArmazenagem.execute).toHaveBeenCalled();
    expect(recebimentoRepository.updateStatus).toHaveBeenCalledWith(
      'rec-1',
      'finalizado',
    );
    expect(publishSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        recebimentoId: 'rec-1',
        unidadeId: 'ITB',
      }),
    );
    expect(cncPublish).toHaveBeenCalled();
  });

  it('builds tarefas from bipados unitizadores without creating new unitizadores', async () => {
    const { useCase, gerarDemandaArmazenagem, armazenagemRepository } = createUseCase({
      recebimento: {
        modoUnitizacao: 'bipar_palete_no_recebimento',
      },
      itensConferidos: [conferidoComUnitizador],
      itensAguardando: [
        {
          unitizadorId,
          produtoId: 'prod-1',
          quantidade: 8,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
        },
      ],
    });

    await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(armazenagemRepository.criarUnitizador).not.toHaveBeenCalled();
    expect(gerarDemandaArmazenagem.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        modoUnitizacao: 'bipar_palete_no_recebimento',
        tarefas: [
          expect.objectContaining({
            unitizadorId,
            sequencia: 1,
            itens: [
              expect.objectContaining({ produtoId: 'prod-1', quantidade: 8 }),
            ],
          }),
        ],
        itens: undefined,
      }),
    );
  });

  it('detects bipados unitizadores even when recebimento modo is gerar_etiqueta', async () => {
    const { useCase, gerarDemandaArmazenagem, armazenagemRepository } = createUseCase({
      recebimento: {
        modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
      },
      itensConferidos: [conferidoComUnitizador],
      itensAguardando: [
        {
          unitizadorId,
          produtoId: 'prod-1',
          quantidade: 8,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
        },
      ],
    });

    await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(armazenagemRepository.criarUnitizador).not.toHaveBeenCalled();
    expect(gerarDemandaArmazenagem.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        modoUnitizacao: 'bipar_palete_no_recebimento',
        tarefas: [
          expect.objectContaining({
            unitizadorId,
          }),
        ],
      }),
    );
  });

  it('rejects paletes payload in bipar_palete_no_recebimento mode when bipados exist', async () => {
    const { useCase } = createUseCase({
      recebimento: {
        modoUnitizacao: 'bipar_palete_no_recebimento',
      },
      itensConferidos: [
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
          unitizadorId,
          createdAt: new Date(),
        },
      ],
      itensAguardando: [
        {
          unitizadorId,
          produtoId: 'prod-1',
          quantidade: 8,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
        },
      ],
    });

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        userId: 1,
        paletes: [{ produtoId: 'prod-1', qtdPaletes: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks saldo lines matching avaria produto+lote on finalize', async () => {
    const { useCase, publishSaldo } = createUseCase({
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 5,
          unidadeMedida: 'UN',
          loteRecebido: 'L1',
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          unitizadorId: unitizadorId,
          createdAt: new Date(),
        },
        {
          id: 'item-2',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 3,
          unidadeMedida: 'UN',
          loteRecebido: 'L2',
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          unitizadorId: '00000000-0000-4000-8000-000000000011',
          createdAt: new Date(),
        },
      ],
      avarias: [
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          lote: 'L1',
          tipo: 'fisica',
          natureza: 'parcial',
          causa: 'transporte',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 0,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
      ],
    });

    await useCase.execute({ recebimentoId: 'rec-1', userId: 1 });

    expect(publishSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        linhas: expect.arrayContaining([
          expect.objectContaining({
            produtoId: 'prod-1',
            lote: 'L1',
            status: 'bloqueado',
            tipoAnomalia: 'avaria',
          }),
          expect.objectContaining({
            produtoId: 'prod-1',
            lote: 'L2',
            status: 'liberado',
            tipoAnomalia: null,
          }),
        ]),
      }),
    );
  });

  it('applies validated addresses and forwards enderecosJaValidados to gerar demanda', async () => {
    const enderecoId = '00000000-0000-4000-8000-000000000011';
    const { useCase, gerarDemandaArmazenagem } = createUseCase({
      recebimento: {
        modoUnitizacao: 'bipar_palete_no_recebimento',
      },
      itensConferidos: [conferidoComUnitizador],
      itensAguardando: [
        {
          unitizadorId,
          produtoId: 'prod-1',
          quantidade: 8,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
        },
      ],
      endereco: {
        id: enderecoId,
        unidadeId: 'ITB',
        enderecoMascarado: 'A-01-01',
      },
    });

    await useCase.execute({
      recebimentoId: 'rec-1',
      userId: 1,
      paletesBipadosValidados: [
        {
          unitizadorId,
          enderecoSugeridoId: enderecoId,
        },
      ],
    });

    expect(gerarDemandaArmazenagem.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        enderecosJaValidados: true,
        userId: 1,
        tarefas: [
          expect.objectContaining({
            unitizadorId,
            enderecoSugeridoId: enderecoId,
          }),
        ],
      }),
    );
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
        situacao: 'em_conferencia',
      }),
      findItemsByRecebimento: vi.fn().mockResolvedValue([
        { id: 'item-1', produtoId: 'prod-1', quantidadeRecebida: 5, unidadeMedida: 'UN' },
        { id: 'item-2', produtoId: 'prod-2', quantidadeRecebida: 2, unidadeMedida: 'UN' },
      ]),
    };

    const produtoRepository: Partial<IProdutoRepository> = {
      findByProdutoId: vi
        .fn()
        .mockImplementation(async (produtoId: string) => ({
          sku: produtoId === 'prod-1' ? 'SKU-1' : 'SKU-2',
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
          produtoId,
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

  it('persists lote when informed for single product avaria', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'em_conferencia',
      }),
      findItemsByRecebimento: vi.fn().mockResolvedValue([
        {
          id: 'item-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 5,
          unidadeMedida: 'UN',
          loteRecebido: 'L1',
        },
      ]),
    };

    const avariaRepository: Partial<IRecebimentoAvariaRepository> = {
      createMany: vi.fn().mockResolvedValue([
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          lote: 'L1',
          tipo: 'fisica',
          natureza: 'parcial',
          causa: 'transporte',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 0,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
      ]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrarAvariaUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        { provide: RECEBIMENTO_AVARIA_REPOSITORY, useValue: avariaRepository },
        { provide: PRODUTO_REPOSITORY, useValue: {} },
      ],
    }).compile();

    const useCase = moduleRef.get(RegistrarAvariaUseCase);

    await useCase.execute({
      recebimentoId: 'rec-1',
      produtoId: 'prod-1',
      lote: 'L1',
      tipo: 'fisica',
      natureza: 'parcial',
      causa: 'transporte',
      quantidadeCaixas: 1,
      quantidadeUnidades: 0,
      operatorId: 1,
    });

    expect(avariaRepository.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ produtoId: 'prod-1', lote: 'L1' }),
    ]);
  });

  it('forwards clientDamageId to repository for idempotent sync', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'em_conferencia',
      }),
      findItemsByRecebimento: vi.fn().mockResolvedValue([
        {
          id: 'item-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 5,
          unidadeMedida: 'UN',
          loteRecebido: 'L1',
        },
      ]),
    };

    const avariaRepository: Partial<IRecebimentoAvariaRepository> = {
      createMany: vi.fn().mockResolvedValue([
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          lote: 'L1',
          tipo: 'fisica',
          natureza: 'parcial',
          causa: 'transporte',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 0,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
      ]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrarAvariaUseCase,
        { provide: RECEBIMENTO_REPOSITORY, useValue: recebimentoRepository },
        { provide: RECEBIMENTO_AVARIA_REPOSITORY, useValue: avariaRepository },
        { provide: PRODUTO_REPOSITORY, useValue: {} },
      ],
    }).compile();

    const useCase = moduleRef.get(RegistrarAvariaUseCase);

    await useCase.execute({
      recebimentoId: 'rec-1',
      produtoId: 'prod-1',
      lote: 'L1',
      tipo: 'fisica',
      natureza: 'parcial',
      causa: 'transporte',
      quantidadeCaixas: 1,
      quantidadeUnidades: 0,
      clientDamageId: 'damage-local-1',
      operatorId: 1,
    });

    expect(avariaRepository.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        produtoId: 'prod-1',
        clientDamageId: 'damage-local-1',
      }),
    ]);
  });

  it('requires lote selection when product has multiple conferidos lotes', async () => {
    const recebimentoRepository: Partial<IRecebimentoRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'em_conferencia',
      }),
      findItemsByRecebimento: vi.fn().mockResolvedValue([
        {
          id: 'item-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 5,
          unidadeMedida: 'UN',
          loteRecebido: 'L1',
        },
        {
          id: 'item-2',
          produtoId: 'prod-1',
          quantidadeRecebida: 3,
          unidadeMedida: 'UN',
          loteRecebido: 'L2',
        },
      ]),
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
        recebimentoId: 'rec-1',
        produtoId: 'prod-1',
        tipo: 'fisica',
        natureza: 'parcial',
        causa: 'transporte',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
        operatorId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
