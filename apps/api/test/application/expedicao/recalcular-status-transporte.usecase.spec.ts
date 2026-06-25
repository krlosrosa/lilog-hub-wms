import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';



import { RecalcularStatusTransporteUseCase } from '../../../src/application/usecases/expedicao/recalcular-status-transporte.usecase.js';

import { TransporteEventPublisher } from '../../../src/application/services/transporte-event.publisher.js';

import {

  TRANSPORTE_REPOSITORY,

  type ITransporteRepository,

} from '../../../src/domain/repositories/expedicao/transporte.repository.js';



const transporteId = '00000000-0000-4000-8000-000000000001';

const unidadeId = 'unidade-1';



const jobData = {

  transporteId,

  unidadeId,

  motivo: 'grupo_iniciado' as const,

  mapaGrupoId: '00000000-0000-4000-8000-000000000002',

  processo: 'separacao' as const,

};



describe('RecalcularStatusTransporteUseCase', () => {

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

        RecalcularStatusTransporteUseCase,

        {

          provide: TRANSPORTE_REPOSITORY,

          useValue: transporteRepository,

        },

        {

          provide: TransporteEventPublisher,

          useValue: transporteEventPublisher,

        },

      ],

    }).compile();



    return moduleRef.get(RecalcularStatusTransporteUseCase);

  }



  it('atualiza status quando resolução difere do status atual', async () => {

    vi.mocked(transporteRepository.findResumoGruposOperacionais).mockResolvedValue({

      separacao: { total: 2, iniciados: 1, finalizados: 0 },

      conferencia: { total: 0, iniciados: 0, finalizados: 0 },

      carregamento: { total: 0, iniciados: 0, finalizados: 0 },

    });

    vi.mocked(transporteRepository.findStatusTransporte).mockResolvedValue({

      id: transporteId,

      status: 'alocado',

    });

    vi.mocked(transporteRepository.atualizarStatusOperacional).mockResolvedValue({

      id: transporteId,

      status: 'em_separacao',

    });



    const useCase = await createUseCase();

    await useCase.execute(jobData);



    expect(transporteRepository.atualizarStatusOperacional).toHaveBeenCalledWith({

      transporteId,

      unidadeId,

      status: 'em_separacao',

    });

  });



  it('não atualiza quando status resolvido é igual ao atual', async () => {

    vi.mocked(transporteRepository.findResumoGruposOperacionais).mockResolvedValue({

      separacao: { total: 2, iniciados: 1, finalizados: 0 },

      conferencia: { total: 0, iniciados: 0, finalizados: 0 },

      carregamento: { total: 0, iniciados: 0, finalizados: 0 },

    });

    vi.mocked(transporteRepository.findStatusTransporte).mockResolvedValue({

      id: transporteId,

      status: 'em_separacao',

    });



    const useCase = await createUseCase();

    await useCase.execute(jobData);



    expect(transporteRepository.atualizarStatusOperacional).not.toHaveBeenCalled();

  });



  it('ignora quando transporte não existe na unidade', async () => {

    vi.mocked(transporteRepository.findResumoGruposOperacionais).mockResolvedValue({

      separacao: { total: 0, iniciados: 0, finalizados: 0 },

      conferencia: { total: 0, iniciados: 0, finalizados: 0 },

      carregamento: { total: 0, iniciados: 0, finalizados: 0 },

    });

    vi.mocked(transporteRepository.findStatusTransporte).mockResolvedValue(null);



    const useCase = await createUseCase();

    await useCase.execute(jobData);



    expect(transporteRepository.atualizarStatusOperacional).not.toHaveBeenCalled();

  });



  it('dispara sync Ravex quando status muda para carregado', async () => {

    vi.mocked(transporteRepository.findResumoGruposOperacionais).mockResolvedValue({

      separacao: { total: 1, iniciados: 1, finalizados: 1 },

      conferencia: { total: 1, iniciados: 1, finalizados: 1 },

      carregamento: { total: 1, iniciados: 1, finalizados: 1 },

    });

    vi.mocked(transporteRepository.findStatusTransporte).mockResolvedValue({

      id: transporteId,

      status: 'em_carregamento',

    });

    vi.mocked(transporteRepository.atualizarStatusOperacional).mockResolvedValue({

      id: transporteId,

      status: 'carregado',

    });

    vi.mocked(transporteRepository.findViagemRavexContext).mockResolvedValue({

      id: transporteId,

      unidadeId,

      rota: '53590365',

      viagemId: null,

      viagemInicioEm: null,

      viagemFimEm: null,

      anomalia: null,

    });



    const useCase = await createUseCase();

    await useCase.execute({

      ...jobData,

      motivo: 'grupo_finalizado',

      processo: 'carregamento',

    });



    expect(transporteEventPublisher.publishSincronizarViagemRavex).toHaveBeenCalledWith({

      transporteId,

      unidadeId,

      fase: 'buscar_viagem',

    });

  });



  it('não dispara sync Ravex quando viagem já foi finalizada', async () => {

    vi.mocked(transporteRepository.findResumoGruposOperacionais).mockResolvedValue({

      separacao: { total: 1, iniciados: 1, finalizados: 1 },

      conferencia: { total: 1, iniciados: 1, finalizados: 1 },

      carregamento: { total: 1, iniciados: 1, finalizados: 1 },

    });

    vi.mocked(transporteRepository.findStatusTransporte).mockResolvedValue({

      id: transporteId,

      status: 'em_carregamento',

    });

    vi.mocked(transporteRepository.atualizarStatusOperacional).mockResolvedValue({

      id: transporteId,

      status: 'carregado',

    });

    vi.mocked(transporteRepository.findViagemRavexContext).mockResolvedValue({

      id: transporteId,

      unidadeId,

      rota: '53590365',

      viagemId: 19355750,

      viagemInicioEm: new Date('2026-06-22T06:32:01.583Z'),

      viagemFimEm: new Date('2026-06-23T12:00:00'),

      anomalia: null,

    });



    const useCase = await createUseCase();

    await useCase.execute({

      ...jobData,

      motivo: 'grupo_finalizado',

      processo: 'carregamento',

    });



    expect(transporteEventPublisher.publishSincronizarViagemRavex).not.toHaveBeenCalled();

  });

});


