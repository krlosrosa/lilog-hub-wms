import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CancelarCorteUseCase } from '../../../src/application/usecases/corte-operacional/cancelar-corte.usecase.js';
import { IniciarCorteUseCase } from '../../../src/application/usecases/corte-operacional/iniciar-corte.usecase.js';
import { RealizarCorteUseCase } from '../../../src/application/usecases/corte-operacional/realizar-corte.usecase.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../src/domain/repositories/corte-operacional/corte-operacional.repository.js';

const corteId = '00000000-0000-4000-8000-000000000010';
const unidadeId = 'unidade-1';

function makeCorte(status: 'solicitado' | 'em_andamento' | 'concluido' | 'cancelado') {
  return {
    id: corteId,
    unidadeId,
    codigo: 'CORTE-0001',
    mapaGrupoId: '00000000-0000-4000-8000-000000000001',
    transporteId: '00000000-0000-4000-8000-000000000003',
    mapaGrupoMicroUuid: 'MAPA-CODE-001',
    mapaGrupoTitulo: 'MAPA-001',
    rota: 'R01',
    doca: null,
    status,
    motivo: null,
    observacao: null,
    totalVolumes: 5,
    pesoTotalKg: 25,
    solicitadoPor: 1,
    solicitadoPorNome: 'Admin',
    solicitadoEm: new Date('2026-06-22T10:00:00.000Z'),
    realizadoPor: null,
    realizadoPorNome: null,
    realizadoEm: null,
    canceladoPor: null,
    canceladoPorNome: null,
    canceladoEm: null,
    motivoCancelamento: null,
    createdAt: new Date('2026-06-22T10:00:00.000Z'),
    updatedAt: new Date('2026-06-22T10:00:00.000Z'),
    itens: [],
  };
}

describe('Transições de Corte Operacional', () => {
  const repository: ICorteOperacionalRepository = {
    findMapaGrupoPorCodigo: vi.fn(),
    findMapaGrupoItensByIds: vi.fn(),
    existsCorteAtivoByMapaGrupoId: vi.fn(),
    solicitarCorte: vi.fn(),
    listCortes: vi.fn(),
    findCorteById: vi.fn(),
    iniciarCorte: vi.fn(),
    realizarCorte: vi.fn(),
    cancelarCorte: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia corte solicitado', async () => {
    vi.mocked(repository.findCorteById).mockResolvedValue(makeCorte('solicitado'));
    vi.mocked(repository.iniciarCorte).mockResolvedValue(makeCorte('em_andamento'));

    const moduleRef = await Test.createTestingModule({
      providers: [
        IniciarCorteUseCase,
        { provide: CORTE_OPERACIONAL_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(IniciarCorteUseCase);
    const result = await useCase.execute({ corteId, unidadeId, userId: 2 });

    expect(result.status).toBe('em_andamento');
  });

  it('impede iniciar corte concluído', async () => {
    vi.mocked(repository.findCorteById).mockResolvedValue(makeCorte('concluido'));

    const moduleRef = await Test.createTestingModule({
      providers: [
        IniciarCorteUseCase,
        { provide: CORTE_OPERACIONAL_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(IniciarCorteUseCase);

    await expect(
      useCase.execute({ corteId, unidadeId, userId: 2 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('realiza corte em andamento', async () => {
    vi.mocked(repository.findCorteById).mockResolvedValue(makeCorte('em_andamento'));
    vi.mocked(repository.realizarCorte).mockResolvedValue(makeCorte('concluido'));

    const moduleRef = await Test.createTestingModule({
      providers: [
        RealizarCorteUseCase,
        { provide: CORTE_OPERACIONAL_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(RealizarCorteUseCase);
    const result = await useCase.execute({ corteId, unidadeId, userId: 2 });

    expect(result.status).toBe('concluido');
  });

  it('cancela corte solicitado', async () => {
    vi.mocked(repository.findCorteById).mockResolvedValue(makeCorte('solicitado'));
    vi.mocked(repository.cancelarCorte).mockResolvedValue(makeCorte('cancelado'));

    const moduleRef = await Test.createTestingModule({
      providers: [
        CancelarCorteUseCase,
        { provide: CORTE_OPERACIONAL_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CancelarCorteUseCase);
    const result = await useCase.execute({
      corteId,
      unidadeId,
      canceladoPor: 2,
      motivoCancelamento: 'Erro operacional',
    });

    expect(result.status).toBe('cancelado');
  });

  it('impede cancelar corte concluído', async () => {
    vi.mocked(repository.findCorteById).mockResolvedValue(makeCorte('concluido'));

    const moduleRef = await Test.createTestingModule({
      providers: [
        CancelarCorteUseCase,
        { provide: CORTE_OPERACIONAL_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CancelarCorteUseCase);

    await expect(
      useCase.execute({
        corteId,
        unidadeId,
        canceladoPor: 2,
        motivoCancelamento: 'Tarde demais',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna not found quando corte não existe', async () => {
    vi.mocked(repository.findCorteById).mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CancelarCorteUseCase,
        { provide: CORTE_OPERACIONAL_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CancelarCorteUseCase);

    await expect(
      useCase.execute({
        corteId,
        unidadeId,
        canceladoPor: 2,
        motivoCancelamento: 'Teste',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
