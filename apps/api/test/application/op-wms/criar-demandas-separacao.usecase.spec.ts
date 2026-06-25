import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { TransporteEventPublisher } from '../../../src/application/services/transporte-event.publisher.js';
import { CriarDemandasSeparacaoUseCase } from '../../../src/application/usecases/op-wms/criar-demandas-separacao.usecase.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../src/domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../src/domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const sessaoId = '00000000-0000-4000-8000-000000000001';
const mapaGrupoId1 = '00000000-0000-4000-8000-000000000002';
const mapaGrupoId2 = '00000000-0000-4000-8000-000000000003';
const transporteId1 = '00000000-0000-4000-8000-000000000004';
const transporteId2 = '00000000-0000-4000-8000-000000000005';

describe('CriarDemandasSeparacaoUseCase', () => {
  const demandaRepository: IDemandaSeparacaoRepository = {
    listBySessaoId: vi.fn(),
    listMapasGrupoDisponiveis: vi.fn(),
    findMapaGrupoByIds: vi.fn(),
    findDemandasAtivasByMapaGrupoIds: vi.fn(),
    createBatch: vi.fn(),
    findDetalheById: vi.fn(),
    finalizarDemanda: vi.fn(),
  };

  const sessaoRepository: ISessaoOperacaoRepository = {
    findSessaoById: vi.fn(),
    findSessaoFuncionarioById: vi.fn(),
  } as unknown as ISessaoOperacaoRepository;

  const transporteEventPublisher = {
    publishRecalcularStatus: vi.fn(),
  };

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CriarDemandasSeparacaoUseCase,
        {
          provide: DEMANDA_SEPARACAO_REPOSITORY,
          useValue: demandaRepository,
        },
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: sessaoRepository,
        },
        {
          provide: TransporteEventPublisher,
          useValue: transporteEventPublisher,
        },
      ],
    }).compile();

    return moduleRef.get(CriarDemandasSeparacaoUseCase);
  }

  it('publica recálculo de status uma vez por transporte distinto', async () => {
    vi.mocked(sessaoRepository.findSessaoById).mockResolvedValue({
      id: sessaoId,
      unidadeId: 'unidade-1',
      status: 'aberta',
    } as Awaited<ReturnType<ISessaoOperacaoRepository['findSessaoById']>>);
    vi.mocked(sessaoRepository.findSessaoFuncionarioById).mockResolvedValue({
      id: 'sf-1',
      status: 'presente',
    } as Awaited<
      ReturnType<ISessaoOperacaoRepository['findSessaoFuncionarioById']>
    >);
    vi.mocked(demandaRepository.findMapaGrupoByIds).mockResolvedValue([
      {
        id: mapaGrupoId1,
        titulo: 'MAPA-1',
        microUuid: 'micro-1',
        transporteId: transporteId1,
        processo: 'separacao',
        finalizadoEm: null,
        iniciadoEm: null,
      },
      {
        id: mapaGrupoId2,
        titulo: 'MAPA-2',
        microUuid: 'micro-2',
        transporteId: transporteId2,
        processo: 'conferencia',
        finalizadoEm: null,
        iniciadoEm: null,
      },
    ]);
    vi.mocked(demandaRepository.findDemandasAtivasByMapaGrupoIds).mockResolvedValue(
      [],
    );
    vi.mocked(demandaRepository.createBatch).mockResolvedValue([
      {
        id: 'demanda-1',
        unidadeId: 'unidade-1',
        sessaoId,
        mapaGrupoId: mapaGrupoId1,
        sessaoFuncionarioId: 'sf-1',
        funcionarioId: 1,
        status: 'em_andamento',
        atribuidoPor: 1,
        atribuidoEm: new Date('2026-06-22T16:00:00.000Z'),
        iniciadoEm: new Date('2026-06-22T16:00:00.000Z'),
        finalizadoEm: null,
        createdAt: new Date('2026-06-22T16:00:00.000Z'),
        updatedAt: new Date('2026-06-22T16:00:00.000Z'),
        mapaGrupoTitulo: 'MAPA-1',
        mapaGrupoMicroUuid: 'micro-1',
        mapaGrupoProcesso: 'separacao',
        transporteId: transporteId1,
        transporteRota: 'R01',
        tempoEsperadoMinutos: 720,
      },
      {
        id: 'demanda-2',
        unidadeId: 'unidade-1',
        sessaoId,
        mapaGrupoId: mapaGrupoId2,
        sessaoFuncionarioId: 'sf-1',
        funcionarioId: 1,
        status: 'pendente',
        atribuidoPor: 1,
        atribuidoEm: new Date('2026-06-22T16:00:00.000Z'),
        iniciadoEm: null,
        finalizadoEm: null,
        createdAt: new Date('2026-06-22T16:00:00.000Z'),
        updatedAt: new Date('2026-06-22T16:00:00.000Z'),
        mapaGrupoTitulo: 'MAPA-2',
        mapaGrupoMicroUuid: 'micro-2',
        mapaGrupoProcesso: 'conferencia',
        transporteId: transporteId2,
        transporteRota: 'R02',
        tempoEsperadoMinutos: 720,
      },
    ]);

    const useCase = await createUseCase();
    await useCase.execute({
      sessaoId,
      sessaoFuncionarioId: 'sf-1',
      mapaGrupoIds: [mapaGrupoId1, mapaGrupoId2],
      atribuidoPor: 1,
    });

    expect(transporteEventPublisher.publishRecalcularStatus).toHaveBeenCalledTimes(
      2,
    );
    expect(transporteEventPublisher.publishRecalcularStatus).toHaveBeenCalledWith({
      transporteId: transporteId1,
      unidadeId: 'unidade-1',
      motivo: 'grupo_iniciado',
      mapaGrupoId: mapaGrupoId1,
      processo: 'separacao',
    });
    expect(transporteEventPublisher.publishRecalcularStatus).toHaveBeenCalledWith({
      transporteId: transporteId2,
      unidadeId: 'unidade-1',
      motivo: 'grupo_iniciado',
      mapaGrupoId: mapaGrupoId2,
      processo: 'conferencia',
    });
  });

  it('rejeita sessão inexistente', async () => {
    vi.mocked(sessaoRepository.findSessaoById).mockResolvedValue(null);

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        sessaoId,
        sessaoFuncionarioId: 'sf-1',
        mapaGrupoIds: [mapaGrupoId1],
        atribuidoPor: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejeita sessão fechada', async () => {
    vi.mocked(sessaoRepository.findSessaoById).mockResolvedValue({
      id: sessaoId,
      unidadeId: 'unidade-1',
      status: 'fechada',
    } as Awaited<ReturnType<ISessaoOperacaoRepository['findSessaoById']>>);

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        sessaoId,
        sessaoFuncionarioId: 'sf-1',
        mapaGrupoIds: [mapaGrupoId1],
        atribuidoPor: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
