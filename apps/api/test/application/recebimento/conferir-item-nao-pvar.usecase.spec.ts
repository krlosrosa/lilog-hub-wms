import { describe, expect, it, vi } from 'vitest';

import { ConferirItemUseCase } from '../../../src/application/usecases/recebimento/conferir-item.usecase.js';
import { RecebimentoEventPublisher } from '../../../src/application/services/recebimento-event.publisher.js';
import type { IRecebimentoRepository } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { IPreRecebimentoRepository } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { IProdutoRepository } from '../../../src/domain/repositories/produto/produto.repository.js';
import type { IConfiguracaoOperacionalRepository } from '../../../src/domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import type { IArmazenagemRepository } from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';

const ppadProduto = {
  produtoId: 'PPAD-001',
  sku: 'SKU-PPAD',
  descricao: 'Produto PPAD',
  empresa: 'EMP',
  categoria: 'seco',
  grupo: null,
  tipo: 'PPAD',
  ean: null,
  dum: null,
  shelfLife: null,
  pesoBrutoUnidade: '0.5',
  pesoBrutoCaixa: null,
  pesoBrutoPalete: null,
  pesoLiquidoUnidade: null,
  pesoLiquidoCaixa: null,
  pesoLiquidoPalete: null,
  unidadesPorCaixa: 12,
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
        produtoId: 'PPAD-001',
        quantidadeRecebida: 2,
        unidadeMedida: 'CX',
        pesoRecebido: 12,
      },
      pesagem: null,
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
    findByProdutoId: vi.fn().mockResolvedValue(ppadProduto),
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

  const armazenagemRepository = {} as IArmazenagemRepository;
  const recebimentoEventPublisher = {
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as RecebimentoEventPublisher;

  return {
    useCase: new ConferirItemUseCase(
      recebimentoRepository,
      preRecebimentoRepository,
      produtoRepository,
      configuracaoOperacionalRepository,
      armazenagemRepository,
      recebimentoEventPublisher,
    ),
    recebimentoRepository,
  };
}

describe('ConferirItemUseCase nao-PVAR', () => {
  it('calcula pesoRecebido automaticamente quando nao informado', async () => {
    const addItem = vi.fn().mockResolvedValue({
      item: {
        id: 'item-1',
        produtoId: 'PPAD-001',
        quantidadeRecebida: 2,
        unidadeMedida: 'CX',
        pesoRecebido: 12,
      },
      pesagem: null,
    });

    const { useCase, recebimentoRepository } = createUseCase({
      recebimentoRepository: { addItem },
    });

    await useCase.execute({
      recebimentoId: 'rec-1',
      data: {
        produtoId: 'PPAD-001',
        quantidadeRecebida: 2,
        unidadeMedida: 'CX',
      },
      userId: 1,
    });

    expect(recebimentoRepository.addItem).toHaveBeenCalledWith(
      'rec-1',
      'ITB',
      expect.objectContaining({
        pesoRecebido: 12,
      }),
      expect.objectContaining({ pesoVariavel: false }),
    );
  });
});
