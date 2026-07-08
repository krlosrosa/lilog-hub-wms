import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';

import { GerarProcessoDebitoDevolucaoUseCase } from '../../../src/application/usecases/cobranca-transportadora/gerar-processo-debito-devolucao.usecase.js';
import { COBRANCA_TRANSPORTADORA_REPOSITORY } from '../../../src/domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import { DEVOLUCAO_REPOSITORY } from '../../../src/domain/repositories/devolucao/devolucao.repository.js';
import { DRIZZLE_PROVIDER } from '../../../src/infra/db/providers/drizzle/drizzle.provider.js';

vi.mock(
  '../../../src/infra/db/cobranca-transportadora/resolver-transportadora-devolucao.drizzle.js',
  () => ({
    resolverTransportadoraDevolucaoDb: vi.fn().mockResolvedValue({
      transporteId: 'T-001',
      transportadoraId: null,
      transportadoraNome: 'Transportadora X',
    }),
  }),
);

describe('GerarProcessoDebitoDevolucaoUseCase', () => {
  const cobrancaRepository = {
    buscarProcessoPorDemandaId: vi.fn(),
    criarProcessoDebito: vi.fn(),
  };

  const devolucaoRepository = {
    buscarDemanda: vi.fn(),
    listarAvariasDetalhe: vi.fn(),
    listarFaltasPeso: vi.fn(),
  };

  let useCase: GerarProcessoDebitoDevolucaoUseCase;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GerarProcessoDebitoDevolucaoUseCase,
        {
          provide: COBRANCA_TRANSPORTADORA_REPOSITORY,
          useValue: cobrancaRepository,
        },
        {
          provide: DEVOLUCAO_REPOSITORY,
          useValue: devolucaoRepository,
        },
        {
          provide: DRIZZLE_PROVIDER,
          useValue: {},
        },
      ],
    }).compile();

    useCase = moduleRef.get(GerarProcessoDebitoDevolucaoUseCase);
  });

  it('no-op quando processo já existe', async () => {
    cobrancaRepository.buscarProcessoPorDemandaId.mockResolvedValue({
      id: 'processo-1',
    });

    await useCase.execute({ demandaId: 'demanda-1', unidadeId: 'unidade-1' });

    expect(devolucaoRepository.buscarDemanda).not.toHaveBeenCalled();
    expect(cobrancaRepository.criarProcessoDebito).not.toHaveBeenCalled();
  });

  it('no-op quando demanda não existe', async () => {
    cobrancaRepository.buscarProcessoPorDemandaId.mockResolvedValue(null);
    devolucaoRepository.buscarDemanda.mockResolvedValue(null);

    await useCase.execute({ demandaId: 'demanda-1', unidadeId: 'unidade-1' });

    expect(cobrancaRepository.criarProcessoDebito).not.toHaveBeenCalled();
  });

  it('no-op quando não há anomalias cobráveis', async () => {
    cobrancaRepository.buscarProcessoPorDemandaId.mockResolvedValue(null);
    devolucaoRepository.buscarDemanda.mockResolvedValue({
      id: 'demanda-1',
      codigoDemanda: 'DEV-001',
      notasFiscais: [],
    });
    devolucaoRepository.listarAvariasDetalhe.mockResolvedValue([]);
    devolucaoRepository.listarFaltasPeso.mockResolvedValue([]);

    await useCase.execute({ demandaId: 'demanda-1', unidadeId: 'unidade-1' });

    expect(cobrancaRepository.criarProcessoDebito).not.toHaveBeenCalled();
  });

  it('cria processo com avarias e faltas de peso', async () => {
    cobrancaRepository.buscarProcessoPorDemandaId.mockResolvedValue(null);
    devolucaoRepository.buscarDemanda.mockResolvedValue({
      id: 'demanda-1',
      codigoDemanda: 'DEV-001',
      notasFiscais: [
        {
          id: 'nf-1',
          transporteId: 'T-001',
          itens: [
            {
              id: 'item-1',
              sku: 'SKU-1',
              descricaoProduto: 'Produto 1',
              quantidade: 10,
              qtdConferida: 10,
              observacao: null,
            },
          ],
        },
      ],
    });
    devolucaoRepository.listarAvariasDetalhe.mockResolvedValue([
      {
        id: 'avaria-1',
        itemId: 'item-1',
        itemSku: 'SKU-1',
        quantidadeUnidade: 2,
        quantidadeCaixa: 0,
        tipo: 'embalagem',
        causa: 'Amassado',
        observacao: null,
        skusAfetados: null,
      },
    ]);
    devolucaoRepository.listarFaltasPeso.mockResolvedValue([
      {
        id: 'falta-1',
        notaFiscalId: 'nf-1',
        itemId: 'item-1',
        sku: 'SKU-1',
        descricaoProduto: 'Produto 1',
        pesoFaltanteKg: 1.5,
        quantidadeContabilConsiderada: 1,
        motivo: 'Falta peso',
        observacao: null,
      },
    ]);

    await useCase.execute({ demandaId: 'demanda-1', unidadeId: 'unidade-1' });

    expect(cobrancaRepository.criarProcessoDebito).toHaveBeenCalledWith(
      expect.objectContaining({
        demandaId: 'demanda-1',
        unidadeId: 'unidade-1',
        transportadoraNome: 'Transportadora X',
        itens: expect.arrayContaining([
          expect.objectContaining({ tipo: 'avaria', avariaId: 'avaria-1' }),
          expect.objectContaining({ tipo: 'falta', faltaPesoId: 'falta-1' }),
        ]),
      }),
    );
  });

  it('ignora registro automático tipo falta em devolucao_avarias e gera só débito de falta', async () => {
    cobrancaRepository.buscarProcessoPorDemandaId.mockResolvedValue(null);
    devolucaoRepository.buscarDemanda.mockResolvedValue({
      id: 'demanda-1',
      codigoDemanda: 'DEV-001',
      notasFiscais: [
        {
          id: 'nf-1',
          transporteId: 'T-001',
          itens: [
            {
              id: 'item-1',
              sku: 'SKU-1',
              descricaoProduto: 'Produto 1',
              quantidade: 10,
              qtdConferida: 0,
              observacao: null,
            },
          ],
        },
      ],
    });
    devolucaoRepository.listarAvariasDetalhe.mockResolvedValue([
      {
        id: 'avaria-auto-falta',
        itemId: 'item-1',
        itemSku: 'SKU-1',
        quantidadeUnidade: 0,
        quantidadeCaixa: 0,
        tipo: 'falta',
        causa: null,
        observacao:
          'Registrado automaticamente — item não conferido ao finalizar devolução',
        skusAfetados: null,
      },
    ]);
    devolucaoRepository.listarFaltasPeso.mockResolvedValue([]);

    await useCase.execute({ demandaId: 'demanda-1', unidadeId: 'unidade-1' });

    expect(cobrancaRepository.criarProcessoDebito).toHaveBeenCalledWith(
      expect.objectContaining({
        itens: [
          expect.objectContaining({
            tipo: 'falta',
            itemId: 'item-1',
            quantidade: 10,
            motivo: 'Divergência de conferência — faltante',
          }),
        ],
      }),
    );

    const criarInput = cobrancaRepository.criarProcessoDebito.mock.calls[0][0];
    expect(
      criarInput.itens.some((item: { tipo: string }) => item.tipo === 'avaria'),
    ).toBe(false);
  });
});
