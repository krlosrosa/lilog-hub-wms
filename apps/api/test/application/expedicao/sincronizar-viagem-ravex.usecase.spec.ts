import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SincronizarViagemRavexUseCase } from '../../../src/application/usecases/expedicao/sincronizar-viagem-ravex.usecase.js';
import { TransporteEventPublisher } from '../../../src/application/services/transporte-event.publisher.js';
import {
  TRANSPORTE_REPOSITORY,
  type ITransporteRepository,
  type TransporteViagemRavexRecord,
} from '../../../src/domain/repositories/expedicao/transporte.repository.js';
import { RavexViagemClient } from '../../../src/infra/clients/ravex/ravex-viagem.client.js';
import {
  VIAGEM_RAVEX_DELAY_BUSCAR_MS,
  VIAGEM_RAVEX_DELAY_FIM_MS,
  VIAGEM_RAVEX_DELAY_INICIO_MS,
} from '../../../src/infra/queues/expedicao-transporte.queue.js';

const transporteId = '00000000-0000-4000-8000-000000000001';
const unidadeId = 'unidade-1';

const baseContext: TransporteViagemRavexRecord = {
  id: transporteId,
  unidadeId,
  rota: '53590365',
  viagemId: null,
  viagemInicioEm: null,
  viagemFimEm: null,
  anomalia: null,
};

describe('SincronizarViagemRavexUseCase', () => {
  const transporteRepository: ITransporteRepository = {
    salvarAlocacoes: vi.fn(),
    excluir: vi.fn(),
    atualizarPrioridade: vi.fn(),
    findDuplicados: vi.fn(),
    findComMapaExistente: vi.fn(),
    findResumoGruposOperacionais: vi.fn(),
    findStatusTransporte: vi.fn(),
    atualizarStatusOperacional: vi.fn(),
    findViagemRavexContext: vi.fn(),
    atualizarViagemRavex: vi.fn(),
  };

  const ravexViagemClient = {
    getViagemPorIdentificador: vi.fn(),
    getViagemPorId: vi.fn(),
    listAnomalias: vi.fn(),
  };

  const transporteEventPublisher = {
    publishRecalcularStatus: vi.fn(),
    publishSincronizarViagemRavex: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SincronizarViagemRavexUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: transporteRepository,
        },
        {
          provide: RavexViagemClient,
          useValue: ravexViagemClient,
        },
        {
          provide: TransporteEventPublisher,
          useValue: transporteEventPublisher,
        },
      ],
    }).compile();

    return moduleRef.get(SincronizarViagemRavexUseCase);
  }

  it('busca viagem por identificador e agenda início quando ainda não iniciou', async () => {
    vi.mocked(transporteRepository.findViagemRavexContext)
      .mockResolvedValueOnce(baseContext)
      .mockResolvedValueOnce({
        ...baseContext,
        viagemId: 19355750,
      });
    vi.mocked(ravexViagemClient.getViagemPorIdentificador).mockResolvedValue({
      id: 19355750,
      identificador: '0053590365',
      inicioDataHora: null,
      fimDataHora: null,
    });

    const useCase = await createUseCase();
    await useCase.execute({
      transporteId,
      unidadeId,
      fase: 'buscar_viagem',
    });

    expect(ravexViagemClient.getViagemPorIdentificador).toHaveBeenCalledWith(
      '0053590365',
    );
    expect(transporteRepository.atualizarViagemRavex).toHaveBeenCalledWith({
      transporteId,
      unidadeId,
      viagemId: 19355750,
      viagemInicioEm: null,
      viagemFimEm: null,
    });
    expect(transporteEventPublisher.publishSincronizarViagemRavex).toHaveBeenCalledWith(
      {
        transporteId,
        unidadeId,
        fase: 'aguardar_inicio',
      },
      { delay: VIAGEM_RAVEX_DELAY_INICIO_MS },
    );
  });

  it('reagenda busca quando viagem não existe na Ravex', async () => {
    vi.mocked(transporteRepository.findViagemRavexContext).mockResolvedValue(
      baseContext,
    );
    vi.mocked(ravexViagemClient.getViagemPorIdentificador).mockRejectedValue(
      new NotFoundException('Viagem não encontrada'),
    );

    const useCase = await createUseCase();
    await useCase.execute({
      transporteId,
      unidadeId,
      fase: 'buscar_viagem',
    });

    expect(transporteEventPublisher.publishSincronizarViagemRavex).toHaveBeenCalledWith(
      {
        transporteId,
        unidadeId,
        fase: 'buscar_viagem',
      },
      { delay: VIAGEM_RAVEX_DELAY_BUSCAR_MS },
    );
  });

  it('salva início e agenda fim quando inicioDataHora é retornado', async () => {
    vi.mocked(transporteRepository.findViagemRavexContext)
      .mockResolvedValueOnce({
        ...baseContext,
        viagemId: 19355750,
      })
      .mockResolvedValueOnce({
        ...baseContext,
        viagemId: 19355750,
        viagemInicioEm: new Date('2026-06-22T06:32:01.583Z'),
      });
    vi.mocked(ravexViagemClient.getViagemPorId).mockResolvedValue({
      id: 19355750,
      inicioDataHora: '2026-06-22T06:32:01.583',
      fimDataHora: null,
    });

    const useCase = await createUseCase();
    await useCase.execute({
      transporteId,
      unidadeId,
      fase: 'aguardar_inicio',
    });

    expect(transporteRepository.atualizarViagemRavex).toHaveBeenCalledWith({
      transporteId,
      unidadeId,
      viagemInicioEm: new Date('2026-06-22T06:32:01.583'),
      viagemFimEm: null,
      status: 'em_viagem',
    });
    expect(transporteEventPublisher.publishSincronizarViagemRavex).toHaveBeenCalledWith(
      {
        transporteId,
        unidadeId,
        fase: 'aguardar_fim',
      },
      { delay: VIAGEM_RAVEX_DELAY_FIM_MS },
    );
  });

  it('salva fim e agenda verificação de anomalias', async () => {
    vi.mocked(transporteRepository.findViagemRavexContext).mockResolvedValue({
      ...baseContext,
      viagemId: 19355750,
      viagemInicioEm: new Date('2026-06-22T06:32:01.583Z'),
    });
    vi.mocked(ravexViagemClient.getViagemPorId).mockResolvedValue({
      id: 19355750,
      inicioDataHora: '2026-06-22T06:32:01.583',
      fimDataHora: '2026-06-23T12:00:00',
    });

    const useCase = await createUseCase();
    await useCase.execute({
      transporteId,
      unidadeId,
      fase: 'aguardar_fim',
    });

    expect(transporteRepository.atualizarViagemRavex).toHaveBeenCalledWith({
      transporteId,
      unidadeId,
      viagemFimEm: new Date('2026-06-23T12:00:00'),
      status: 'viagem_finalizada',
    });
    expect(transporteEventPublisher.publishSincronizarViagemRavex).toHaveBeenCalledWith(
      {
        transporteId,
        unidadeId,
        fase: 'verificar_anomalias',
      },
      { delay: 0 },
    );
  });

  it('salva descrição da primeira anomalia quando existir', async () => {
    vi.mocked(transporteRepository.findViagemRavexContext).mockResolvedValue({
      ...baseContext,
      viagemId: 19353360,
      viagemInicioEm: new Date('2026-06-22T06:32:01.583Z'),
      viagemFimEm: new Date('2026-06-23T12:00:00'),
    });
    vi.mocked(ravexViagemClient.listAnomalias).mockResolvedValue([
      {
        anomaliaId: 11945224,
        motivo: {
          descricao: 'V11 - DEV/RET - EXCESSO TEMPO RETIDO CLIENTE',
        },
      },
    ]);

    const useCase = await createUseCase();
    await useCase.execute({
      transporteId,
      unidadeId,
      fase: 'verificar_anomalias',
    });

    expect(transporteRepository.atualizarViagemRavex).toHaveBeenCalledWith({
      transporteId,
      unidadeId,
      anomalia: 'V11 - DEV/RET - EXCESSO TEMPO RETIDO CLIENTE',
    });
  });

  it('não salva anomalia quando lista vem vazia', async () => {
    vi.mocked(transporteRepository.findViagemRavexContext).mockResolvedValue({
      ...baseContext,
      viagemId: 19353360,
      viagemInicioEm: new Date('2026-06-22T06:32:01.583Z'),
      viagemFimEm: new Date('2026-06-23T12:00:00'),
    });
    vi.mocked(ravexViagemClient.listAnomalias).mockResolvedValue([]);

    const useCase = await createUseCase();
    await useCase.execute({
      transporteId,
      unidadeId,
      fase: 'verificar_anomalias',
    });

    expect(transporteRepository.atualizarViagemRavex).not.toHaveBeenCalled();
  });
});
