import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ConferirItemUseCase } from '../../../src/application/usecases/recebimento/conferir-item.usecase.js';
import { RecebimentoEventPublisher } from '../../../src/application/services/recebimento-event.publisher.js';
import { RecebimentoParticipacaoService } from '../../../src/application/services/recebimento/recebimento-participacao.service.js';
import type { IRecebimentoRepository } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { IPreRecebimentoRepository } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { IProdutoRepository } from '../../../src/domain/repositories/produto/produto.repository.js';
import type { IConfiguracaoOperacionalRepository } from '../../../src/domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import type { IArmazenagemRepository } from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';
import type { IUserRepository } from '../../../src/domain/repositories/user/user.repository.js';

const pvarProduto = {
  produtoId: 'PVAR-001',
  sku: 'SKU-PVAR',
  descricao: 'Produto PVAR',
  empresa: 'EMP',
  categoria: 'seco',
  grupo: null,
  tipo: 'PVAR',
  ean: null,
  dum: null,
  shelfLife: null,
  pesoBrutoUnidade: null,
  pesoBrutoCaixa: null,
  pesoBrutoPalete: null,
  pesoLiquidoUnidade: null,
  pesoLiquidoCaixa: null,
  pesoLiquidoPalete: null,
  unidadesPorCaixa: 1,
  caixasPorPalete: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createUseCase(overrides?: {
  recebimentoRepository?: Partial<IRecebimentoRepository>;
}) {
  const recebimentoRepository = {
    findById: vi.fn().mockResolvedValue({
      id: 'rec-1',
      preRecebimentoId: 'pre-1',
      situacao: 'em_conferencia',
    }),
    findPesagemByEtiqueta: vi.fn().mockResolvedValue(null),
    addItem: vi.fn().mockResolvedValue({
      item: {
        id: 'item-1',
        produtoId: 'PVAR-001',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 12.5,
      },
      pesagem: {
        id: 'pesagem-1',
        recebimentoItemId: 'item-1',
        unidadeId: 'ITB',
        sequenciaCaixa: 1,
        etiquetaCodigo: 'ETQ-001',
        pesoKg: 12.5,
        createdAt: new Date(),
      },
    }),
    ...overrides?.recebimentoRepository,
  } as unknown as IRecebimentoRepository;

  const preRecebimentoRepository = {
    findById: vi.fn().mockResolvedValue({
      id: 'pre-1',
      unidadeId: 'ITB',
    }),
  } as unknown as IPreRecebimentoRepository;

  const produtoRepository = {
    findByProdutoId: vi.fn().mockResolvedValue(pvarProduto),
  } as unknown as IProdutoRepository;

  const configuracaoOperacionalRepository = {
    list: vi.fn().mockResolvedValue([
      {
        isPadrao: true,
        parametros: {
          quantidadeModo: 'ambos',
          loteModo: 'lote',
          controlaPalete: false,
          solicitarPesoPvar: true,
          exigirEtiquetaPesoVariavel: true,
          condicoesChecklist: [{ id: 'limpeza', label: 'Limpeza Interna' }],
        },
      },
    ]),
  } as unknown as IConfiguracaoOperacionalRepository;

  const armazenagemRepository = {
    findUnitizadorByCodigo: vi.fn().mockResolvedValue(null),
    criarUnitizador: vi.fn().mockResolvedValue({
      id: 'unitizador-1',
      codigo: 'PLT-001',
    }),
  } as unknown as IArmazenagemRepository;
  const userRepository = {
    findById: vi.fn().mockResolvedValue({ funcionarioId: 10 }),
  } as unknown as IUserRepository;
  const recebimentoParticipacaoService = {
    assertResponsavelOuApoioForRecebimento: vi.fn().mockResolvedValue(undefined),
  } as unknown as RecebimentoParticipacaoService;
  const recebimentoEventPublisher = {
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as RecebimentoEventPublisher;

  return {
    useCase: new ConferirItemUseCase(
      recebimentoRepository,
      preRecebimentoRepository,
      produtoRepository,
      configuracaoOperacionalRepository,
      userRepository,
      recebimentoParticipacaoService,
      recebimentoEventPublisher,
    ),
    recebimentoRepository,
    recebimentoEventPublisher,
    armazenagemRepository,
  };
}

const pvarPayloadBase = {
  produtoId: 'PVAR-001',
  quantidadeRecebida: 1,
  unidadeMedida: 'CX' as const,
  pesoRecebido: 12.5,
  unitizadorCodigo: 'PLT-001',
};

describe('ConferirItemUseCase PVAR', () => {
  it('rejects when unitizadorCodigo is missing', async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        data: {
          produtoId: 'PVAR-001',
          quantidadeRecebida: 1,
          unidadeMedida: 'CX',
          pesoRecebido: 12.5,
          etiquetaCodigo: 'ETQ-001',
        },
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when etiqueta is required but missing', async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        data: {
          ...pvarPayloadBase,
        },
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate etiqueta in the same unidade', async () => {
    const { useCase } = createUseCase({
      recebimentoRepository: {
        findPesagemByEtiqueta: vi.fn().mockResolvedValue({
          id: 'existing-pesagem',
          etiquetaCodigo: 'ETQ-001',
        }),
      },
    });

    await expect(
      useCase.execute({
        recebimentoId: 'rec-1',
        data: {
          ...pvarPayloadBase,
          etiquetaCodigo: 'ETQ-001',
        },
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists peso and etiqueta for PVAR item', async () => {
    const addItem = vi.fn().mockResolvedValue({
      item: {
        id: 'item-1',
        produtoId: 'PVAR-001',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 12.5,
      },
      pesagem: {
        id: 'pesagem-1',
        recebimentoItemId: 'item-1',
        unidadeId: 'ITB',
        sequenciaCaixa: 1,
        etiquetaCodigo: 'ETQ-001',
        pesoKg: 12.5,
        createdAt: new Date(),
      },
    });

    const { useCase, recebimentoRepository } = createUseCase({
      recebimentoRepository: { addItem },
    });

    const result = await useCase.execute({
      recebimentoId: 'rec-1',
      data: {
        ...pvarPayloadBase,
        etiquetaCodigo: 'ETQ-001',
      },
      userId: 1,
    });

    expect(result.pesoRecebido).toBe(12.5);
    expect(result.etiquetaCodigo).toBe('ETQ-001');
    expect(result.pesagemId).toBe('pesagem-1');
    expect(recebimentoRepository.addItem).toHaveBeenCalledWith(
      'rec-1',
      'ITB',
      expect.objectContaining({
        pesoRecebido: 12.5,
        etiquetaCodigo: 'ETQ-001',
      }),
      expect.objectContaining({ pesoVariavel: true, unitizadorCodigo: 'PLT-001' }),
    );
  });

  it('forwards clientConferenceId to addItem for idempotent PVAR sync', async () => {
    const addItem = vi.fn().mockResolvedValue({
      item: {
        id: 'item-1',
        produtoId: 'PVAR-001',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 12.5,
      },
      pesagem: {
        id: 'pesagem-1',
        recebimentoItemId: 'item-1',
        unidadeId: 'ITB',
        sequenciaCaixa: 1,
        etiquetaCodigo: 'ETQ-001',
        pesoKg: 12.5,
        clientConferenceId: 'conf-uuid-001',
        createdAt: new Date(),
      },
    });

    const { useCase, recebimentoRepository } = createUseCase({
      recebimentoRepository: { addItem },
    });

    await useCase.execute({
      recebimentoId: 'rec-1',
      data: {
        ...pvarPayloadBase,
        etiquetaCodigo: 'ETQ-001',
      },
      userId: 1,
      clientConferenceId: 'conf-uuid-001',
    });

    expect(recebimentoRepository.addItem).toHaveBeenCalledWith(
      'rec-1',
      'ITB',
      expect.objectContaining({
        pesoRecebido: 12.5,
        etiquetaCodigo: 'ETQ-001',
      }),
      expect.objectContaining({
        pesoVariavel: true,
        clientConferenceId: 'conf-uuid-001',
        unitizadorCodigo: 'PLT-001',
      }),
    );
  });
});
