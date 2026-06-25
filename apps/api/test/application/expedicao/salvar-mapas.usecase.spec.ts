import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { SalvarMapasUseCase } from '../../../src/application/usecases/expedicao/salvar-mapas.usecase.js';
import { CONFIGURACAO_IMPRESSAO_REPOSITORY } from '../../../src/domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import { MAPA_LOTE_REPOSITORY } from '../../../src/domain/repositories/expedicao/mapa-lote.repository.js';
import { TRANSPORTE_REPOSITORY } from '../../../src/domain/repositories/expedicao/transporte.repository.js';
import { DRIZZLE_PROVIDER } from '../../../src/infra/db/providers/drizzle/drizzle.provider.js';

vi.mock(
  '../../../src/application/services/expedicao/montar-mapas-de-transportes.js',
  () => ({
    montarMapasDeTransportes: vi.fn(),
  }),
);

vi.mock(
  '../../../src/application/services/expedicao/montar-resumo-mapa-lote.js',
  () => ({
    montarResumoMapaLote: vi.fn(() => ({
      totalTransportes: 1,
      totalGrupos: 1,
      totalItens: 1,
      pesoTotalKg: 10,
      transportes: [],
      configResumo: {
        tipoDadosBasicos: 'transporte',
        segregarPaleteFull: false,
        segregarUnidade: false,
        quebraPaleteAtivo: false,
      },
    })),
  }),
);

import { montarMapasDeTransportes } from '../../../src/application/services/expedicao/montar-mapas-de-transportes.js';

const configBase = {
  tipoDadosBasicos: 'transporte' as const,
  quebraPalete: { ativo: false, tipo: 'linhas' as const, valor: 10 },
  exibirClienteCabecalho: true,
  segregarPaleteFull: false,
  segregarUnidade: false,
  agrupamento: {
    tiposAtivos: [] as const,
    clientesSegregados: [],
    grupos: [],
  },
};

const transporteRepositoryMock = {
  findComMapaExistente: vi.fn().mockResolvedValue([]),
};

describe('SalvarMapasUseCase', () => {
  it('rejeita quando transporte já possui mapa salvo', async () => {
    transporteRepositoryMock.findComMapaExistente.mockResolvedValueOnce([
      {
        id: 'transporte-1',
        rota: '101',
        status: 'alocado',
        ultimoMapaLoteId: 'lote-existente',
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        SalvarMapasUseCase,
        { provide: DRIZZLE_PROVIDER, useValue: {} },
        {
          provide: MAPA_LOTE_REPOSITORY,
          useValue: { inserir: vi.fn() },
        },
        {
          provide: CONFIGURACAO_IMPRESSAO_REPOSITORY,
          useValue: { findById: vi.fn() },
        },
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: transporteRepositoryMock,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(SalvarMapasUseCase);

    await expect(
      useCase.execute({
        unidadeId: 'unidade-1',
        transporteIds: ['transporte-1'],
        config: configBase,
        criadoPor: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejeita quando nenhum grupo foi gerado', async () => {
    vi.mocked(montarMapasDeTransportes).mockResolvedValue({
      payload: {
        agrupamento: 'Por transporte',
        tipoDadosBasicos: 'transporte',
        totalGrupos: 0,
        grupos: [],
      },
      transportes: [],
      transportesPorRota: new Map(),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SalvarMapasUseCase,
        { provide: DRIZZLE_PROVIDER, useValue: {} },
        {
          provide: MAPA_LOTE_REPOSITORY,
          useValue: { inserir: vi.fn() },
        },
        {
          provide: CONFIGURACAO_IMPRESSAO_REPOSITORY,
          useValue: { findById: vi.fn() },
        },
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: transporteRepositoryMock,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(SalvarMapasUseCase);

    await expect(
      useCase.execute({
        unidadeId: 'unidade-1',
        transporteIds: ['transporte-1'],
        config: configBase,
        criadoPor: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persiste lote quando grupos existem', async () => {
    vi.mocked(montarMapasDeTransportes).mockResolvedValue({
      payload: {
        agrupamento: 'Por transporte',
        tipoDadosBasicos: 'transporte',
        totalGrupos: 1,
        grupos: [
          {
            id: 'grupo-1',
            titulo: 'Rota A',
            totalItens: 1,
            pesoTotal: 10,
            cabecalho: {
              transporte: 'Rota A',
              placa: null,
              transportadora: null,
              codPrimeiroCliente: 'C1',
              primeiroCliente: 'Cliente',
              codTodosClientes: 'C1',
              todosClientes: 'Cliente',
              pesoTotal: 10,
              totalCaixas: 1,
              totalUnidades: 0,
              totalPaletes: 0,
              nomeGrupo: 'Rota A',
              quantidadeLinhas: 1,
              categoria: 'seco',
              empresa: 'Empresa',
              microUuid: 'micro-1',
            },
            itens: [],
          },
        ],
      },
      transportes: [
        {
          id: 'transporte-1',
          rota: 'Rota A',
          placa: null,
          transportadora: null,
          mapaGeradoEm: null,
          ultimoMapaLoteId: null,
        },
      ],
      transportesPorRota: new Map([['Rota A', 'transporte-1']]),
    });

    const inserir = vi.fn().mockResolvedValue({
      id: 'lote-1',
      unidadeId: 'unidade-1',
      config: configBase,
      payload: {},
      resumo: {},
      configuracaoImpressaoId: null,
      templatesHtml: null,
      criadoPor: 1,
      createdAt: new Date(),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SalvarMapasUseCase,
        { provide: DRIZZLE_PROVIDER, useValue: {} },
        {
          provide: MAPA_LOTE_REPOSITORY,
          useValue: { inserir },
        },
        {
          provide: CONFIGURACAO_IMPRESSAO_REPOSITORY,
          useValue: { findById: vi.fn() },
        },
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: transporteRepositoryMock,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(SalvarMapasUseCase);

    const result = await useCase.execute({
      unidadeId: 'unidade-1',
      transporteIds: ['transporte-1'],
      config: configBase,
      criadoPor: 1,
    });

    expect(result.mapaLoteId).toBe('lote-1');
    expect(inserir).toHaveBeenCalledOnce();
  });
});
