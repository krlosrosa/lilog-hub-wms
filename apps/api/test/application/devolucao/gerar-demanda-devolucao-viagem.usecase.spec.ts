import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GerarDemandaDevolucaoViagemUseCase } from '../../../src/application/usecases/devolucao/gerar-demanda-devolucao-viagem.usecase.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../src/domain/repositories/devolucao/devolucao.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../src/domain/repositories/produto/produto.repository.js';
import { RavexViagemClient } from '../../../src/infra/clients/ravex/ravex-viagem.client.js';

const transporteId = '00000000-0000-4000-8000-000000000001';
const unidadeId = 'UN-SEED-001';
const viagemId = 19380977;

describe('GerarDemandaDevolucaoViagemUseCase', () => {
  const devolucaoRepository: IDevolucaoRepository = {
    findDemandaByCodigo: vi.fn(),
    criarDemandaDevolucaoViagem: vi.fn(),
  };

  const produtoRepository: IProdutoRepository = {
    findByCodigosRemessa: vi.fn(),
  } as unknown as IProdutoRepository;

  const ravexViagemClient = {
    getViagemPorId: vi.fn(),
    listAnomalias: vi.fn(),
    listEntregas: vi.fn(),
    listItensNotaFiscal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GerarDemandaDevolucaoViagemUseCase,
        {
          provide: DEVOLUCAO_REPOSITORY,
          useValue: devolucaoRepository,
        },
        {
          provide: PRODUTO_REPOSITORY,
          useValue: produtoRepository,
        },
        {
          provide: RavexViagemClient,
          useValue: ravexViagemClient,
        },
      ],
    }).compile();

    return moduleRef.get(GerarDemandaDevolucaoViagemUseCase);
  }

  it('continua processando outras NFs quando uma falha ao buscar itens', async () => {
    vi.mocked(devolucaoRepository.findDemandaByCodigo).mockResolvedValue(null);
    vi.mocked(ravexViagemClient.getViagemPorId).mockResolvedValue({
      id: viagemId,
      veiculo: { placa: 'ABC-1234' },
    });
    vi.mocked(ravexViagemClient.listEntregas).mockResolvedValue([]);
    vi.mocked(ravexViagemClient.listAnomalias).mockResolvedValue([
      {
        anomaliaId: 11980584,
        tipoRetorno: 1,
        notaFiscalId: 338462804,
        numeroNotaFiscal: '244730',
        motivo: { descricao: 'V02 CLIENTE NÃO FEZ O PEDIDO' },
        item: null,
      },
      {
        anomaliaId: 11981729,
        tipoRetorno: 2,
        notaFiscalId: 338462819,
        numeroNotaFiscal: '244737',
        motivo: { descricao: 'V02 CLIENTE NÃO FEZ O PEDIDO' },
        item: {
          codigo: '600018007',
          itemId: 638878657,
          quantidadeDevolvida: 24,
          pesoBrutoDevolvido: 25.632,
        },
      },
    ]);
    vi.mocked(ravexViagemClient.listItensNotaFiscal).mockImplementation(
      async (_viagem, notaFiscalId) => {
        if (notaFiscalId === 338462804) {
          throw new Error('NF 338462804 indisponível');
        }

        return [];
      },
    );
    vi.mocked(produtoRepository.findByCodigosRemessa).mockResolvedValue(
      new Map([['600018007', { produtoId: '600018007', sku: '600018007' }]]),
    );
    vi.mocked(devolucaoRepository.criarDemandaDevolucaoViagem).mockResolvedValue({
      created: true,
      demanda: {
        id: 'demanda-1',
        unidadeId,
        codigoDemanda: 'RVX-19380977',
        status: 'aberta',
      },
    });

    const useCase = await createUseCase();
    await useCase.execute({ transporteId, unidadeId, viagemId });

    expect(ravexViagemClient.listItensNotaFiscal).toHaveBeenCalledTimes(2);
    expect(devolucaoRepository.criarDemandaDevolucaoViagem).toHaveBeenCalledWith(
      expect.objectContaining({
        codigoDemanda: 'RVX-19380977',
        placa: 'ABC-1234',
        notasFiscais: expect.arrayContaining([
          expect.objectContaining({
            numeroNf: '244730',
            tipo: 'devolucao_total',
          }),
          expect.objectContaining({
            numeroNf: '244737',
            tipo: 'devolucao_parcial',
            itens: expect.arrayContaining([
              expect.objectContaining({ codigoProduto: '600018007' }),
            ]),
          }),
        ]),
      }),
    );
    expect(
      vi.mocked(devolucaoRepository.criarDemandaDevolucaoViagem).mock.calls[0]?.[0]
        .notasFiscais,
    ).toHaveLength(2);
  });
});
