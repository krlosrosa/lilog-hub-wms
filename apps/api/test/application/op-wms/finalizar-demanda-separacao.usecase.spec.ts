import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { FinalizarDemandaSeparacaoUseCase } from '../../../src/application/usecases/op-wms/finalizar-demanda-separacao.usecase.js';
import { TransporteEventPublisher } from '../../../src/application/services/transporte-event.publisher.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../src/domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../src/domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const demandaId = '00000000-0000-4000-8000-000000000001';
const sessaoId = '00000000-0000-4000-8000-000000000002';

const demandaEmAndamento = {
  id: demandaId,
  unidadeId: 'unidade-1',
  sessaoId,
  mapaGrupoId: '00000000-0000-4000-8000-000000000003',
  sessaoFuncionarioId: '00000000-0000-4000-8000-000000000004',
  funcionarioId: 1,
  status: 'em_andamento' as const,
  atribuidoPor: 1,
  atribuidoEm: new Date('2026-06-22T16:00:00.000Z'),
  iniciadoEm: new Date('2026-06-22T16:00:00.000Z'),
  finalizadoEm: null,
  createdAt: new Date('2026-06-22T16:00:00.000Z'),
  updatedAt: new Date('2026-06-22T16:00:00.000Z'),
  mapaGrupoTitulo: 'MAPA-001',
  mapaGrupoMicroUuid: 'micro-1',
  mapaGrupoProcesso: 'separacao' as const,
  transporteId: '00000000-0000-4000-8000-000000000005',
  transporteRota: 'R01',
  tempoEsperadoMinutos: 720,
};

describe('FinalizarDemandaSeparacaoUseCase', () => {
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
  } as unknown as ISessaoOperacaoRepository;

  const transporteEventPublisher = {
    publishRecalcularStatus: vi.fn(),
  };

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FinalizarDemandaSeparacaoUseCase,
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

    return moduleRef.get(FinalizarDemandaSeparacaoUseCase);
  }

  it('finaliza demanda em andamento', async () => {
    vi.mocked(demandaRepository.findDetalheById).mockResolvedValue(
      demandaEmAndamento,
    );
    vi.mocked(sessaoRepository.findSessaoById).mockResolvedValue({
      id: sessaoId,
      status: 'aberta',
    } as Awaited<ReturnType<ISessaoOperacaoRepository['findSessaoById']>>);
    vi.mocked(demandaRepository.finalizarDemanda).mockResolvedValue({
      ...demandaEmAndamento,
      status: 'concluida',
      finalizadoEm: new Date('2026-06-22T16:30:00.000Z'),
    });

    const useCase = await createUseCase();
    const result = await useCase.execute(demandaId);

    expect(result.status).toBe('concluida');
    expect(demandaRepository.finalizarDemanda).toHaveBeenCalledWith(demandaId);
    expect(transporteEventPublisher.publishRecalcularStatus).toHaveBeenCalledWith({
      transporteId: demandaEmAndamento.transporteId,
      unidadeId: demandaEmAndamento.unidadeId,
      motivo: 'grupo_finalizado',
      mapaGrupoId: demandaEmAndamento.mapaGrupoId,
      processo: 'separacao',
    });
  });

  it('rejeita demanda inexistente', async () => {
    vi.mocked(demandaRepository.findDetalheById).mockResolvedValue(null);

    const useCase = await createUseCase();

    await expect(useCase.execute(demandaId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejeita demanda pendente', async () => {
    vi.mocked(demandaRepository.findDetalheById).mockResolvedValue({
      ...demandaEmAndamento,
      status: 'pendente',
      iniciadoEm: null,
    });
    vi.mocked(sessaoRepository.findSessaoById).mockResolvedValue({
      id: sessaoId,
      status: 'aberta',
    } as Awaited<ReturnType<ISessaoOperacaoRepository['findSessaoById']>>);

    const useCase = await createUseCase();

    await expect(useCase.execute(demandaId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejeita quando sessão não está aberta', async () => {
    vi.mocked(demandaRepository.findDetalheById).mockResolvedValue(
      demandaEmAndamento,
    );
    vi.mocked(sessaoRepository.findSessaoById).mockResolvedValue({
      id: sessaoId,
      status: 'fechada',
    } as Awaited<ReturnType<ISessaoOperacaoRepository['findSessaoById']>>);

    const useCase = await createUseCase();

    await expect(useCase.execute(demandaId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
