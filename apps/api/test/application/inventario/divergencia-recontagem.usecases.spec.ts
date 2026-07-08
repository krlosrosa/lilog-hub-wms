import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AprovarDivergenciaInventarioUseCase,
  SolicitarRecontagemDivergenciaUseCase,
} from '../../../src/application/usecases/inventario/divergencia.usecases.js';
import { InventarioDivergenciaEventPublisher } from '../../../src/application/services/inventario/inventario-divergencia-event.publisher.js';
import {
  INVENTARIO_REPOSITORY,
  type IInventarioRepository,
} from '../../../src/domain/repositories/inventario/inventario.repository.js';

const divergenciaBase = {
  id: 'div-1',
  inventarioId: 'inv-1',
  contagemId: 'cont-1',
  enderecoId: 'end-1',
  enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01',
  zona: 'CORREDOR A',
  saldoEnderecoId: null,
  depositoId: null,
  produtoId: 'prod-1',
  sku: 'SKU-001',
  produtoNome: 'Produto teste',
  quantidadeEsperada: 10,
  quantidadeContada: 8,
  delta: -2,
  unidadeMedida: 'UN',
  lote: 'L1',
  tipo: 'falta' as const,
  status: 'pendente' as const,
  aprovadaPor: null,
  aprovadaEm: null,
  motivoAprovacao: null,
  reprovadaPor: null,
  reprovadaEm: null,
  motivoReprovacao: null,
  documentoRef: 'doc-ref',
  createdAt: new Date(),
  updatedAt: new Date(),
  recontagemAtual: null,
};

describe('SolicitarRecontagemDivergenciaUseCase', () => {
  let repository: Partial<IInventarioRepository>;
  let useCase: SolicitarRecontagemDivergenciaUseCase;

  beforeEach(async () => {
    repository = {
      findInventarioById: vi.fn().mockResolvedValue({
        id: 'inv-1',
        centroId: 'centro-1',
        status: 'concluido',
      }),
      findDivergenciaById: vi
        .fn()
        .mockResolvedValueOnce(divergenciaBase)
        .mockResolvedValueOnce({
          ...divergenciaBase,
          recontagemAtual: {
            id: 'rec-1',
            demandaId: 'dem-1',
            demandaStatus: 'em_andamento',
            responsavelId: 10,
            responsavelNome: 'Operador B',
            solicitadaPor: 1,
            solicitadaEm: new Date(),
            motivo: 'Conferir novamente',
          },
        }),
      findRecontagemAbertaByDivergencia: vi.fn().mockResolvedValue(null),
      findEnderecosByIdsForCentro: vi.fn().mockResolvedValue([
        {
          id: 'end-1',
          enderecoMascarado: divergenciaBase.enderecoMascarado,
          zona: 'CORREDOR A',
        },
      ]),
      createDemanda: vi.fn().mockResolvedValue({
        id: 'dem-1',
        nome: 'Recontagem',
      }),
      activateDemandaContagem: vi.fn().mockResolvedValue(undefined),
      createDivergenciaRecontagem: vi.fn().mockResolvedValue({
        id: 'rec-1',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SolicitarRecontagemDivergenciaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    useCase = moduleRef.get(SolicitarRecontagemDivergenciaUseCase);
  });

  it('creates validation demand and links recontagem', async () => {
    const result = await useCase.execute({
      inventarioId: 'inv-1',
      divergenciaId: 'div-1',
      responsavelId: 10,
      motivo: 'Conferir novamente',
      solicitadaPor: 1,
    });

    expect(repository.createDemanda).toHaveBeenCalledWith(
      expect.objectContaining({
        inventarioId: 'inv-1',
        tipo: 'validacao',
        prioridade: 'alta',
        responsavelId: 10,
        filtros: expect.objectContaining({
          enderecoIds: ['end-1'],
          zonas: ['CORREDOR A'],
          skuBusca: 'SKU-001',
        }),
      }),
      ['end-1'],
    );
    expect(repository.activateDemandaContagem).toHaveBeenCalledWith('dem-1');
    expect(repository.createDivergenciaRecontagem).toHaveBeenCalledWith(
      expect.objectContaining({
        inventarioId: 'inv-1',
        divergenciaId: 'div-1',
        demandaId: 'dem-1',
        responsavelId: 10,
        solicitadaPor: 1,
      }),
    );
    expect(result.recontagemAtual?.demandaId).toBe('dem-1');
  });

  it('rejects when divergencia is not pending', async () => {
    vi.mocked(repository.findDivergenciaById!).mockReset();
    vi.mocked(repository.findDivergenciaById!).mockResolvedValue({
      ...divergenciaBase,
      status: 'aprovada',
    });

    await expect(
      useCase.execute({
        inventarioId: 'inv-1',
        divergenciaId: 'div-1',
        responsavelId: 10,
        solicitadaPor: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when recontagem is already open', async () => {
    vi.mocked(repository.findDivergenciaById!).mockReset();
    vi.mocked(repository.findDivergenciaById!).mockResolvedValue(
      divergenciaBase,
    );
    vi.mocked(repository.findRecontagemAbertaByDivergencia!).mockResolvedValue({
      id: 'rec-open',
      demandaId: 'dem-open',
      demandaStatus: 'em_andamento',
      responsavelId: 10,
      responsavelNome: 'Operador B',
      solicitadaPor: 1,
      solicitadaEm: new Date(),
      motivo: '',
    });

    await expect(
      useCase.execute({
        inventarioId: 'inv-1',
        divergenciaId: 'div-1',
        responsavelId: 10,
        solicitadaPor: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when divergencia belongs to another inventario', async () => {
    vi.mocked(repository.findDivergenciaById!).mockReset();
    vi.mocked(repository.findDivergenciaById!).mockResolvedValue({
      ...divergenciaBase,
      inventarioId: 'inv-2',
    });

    await expect(
      useCase.execute({
        inventarioId: 'inv-1',
        divergenciaId: 'div-1',
        responsavelId: 10,
        solicitadaPor: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AprovarDivergenciaInventarioUseCase', () => {
  it('blocks approval while recontagem is open', async () => {
    const repository: Partial<IInventarioRepository> = {
      findInventarioById: vi.fn().mockResolvedValue({
        id: 'inv-1',
        status: 'concluido',
      }),
      findDivergenciaById: vi.fn().mockResolvedValue({
        ...divergenciaBase,
        recontagemAtual: {
          id: 'rec-1',
          demandaId: 'dem-1',
          demandaStatus: 'em_andamento',
          responsavelId: 10,
          responsavelNome: 'Operador B',
          solicitadaPor: 1,
          solicitadaEm: new Date(),
          motivo: '',
        },
      }),
      updateDivergenciaStatus: vi.fn(),
    };

    const publisher = {
      publicarAplicarDivergencia: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AprovarDivergenciaInventarioUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
        {
          provide: InventarioDivergenciaEventPublisher,
          useValue: publisher,
        },
      ],
    }).compile();

    const useCase = moduleRef.get(AprovarDivergenciaInventarioUseCase);

    await expect(
      useCase.execute('inv-1', 'div-1', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateDivergenciaStatus).not.toHaveBeenCalled();
    expect(publisher.publicarAplicarDivergencia).not.toHaveBeenCalled();
  });
});
