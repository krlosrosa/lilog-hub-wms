import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { CreateDemandaContagemUseCase } from '../../../src/application/usecases/inventario/demanda.usecases.js';
import { SubmitContagemCegaUseCase } from '../../../src/application/usecases/inventario/contagem.usecases.js';
import {
  INVENTARIO_REPOSITORY,
  type IInventarioRepository,
} from '../../../src/domain/repositories/inventario/inventario.repository.js';

describe('CreateDemandaContagemUseCase', () => {
  it('throws when no enderecos match filters', async () => {
    const repository: Partial<IInventarioRepository> = {
      findInventarioById: vi.fn().mockResolvedValue({
        id: 'inv-1',
        centroId: 'centro-1',
        status: 'agendado',
      }),
      resolveEnderecosForDemanda: vi.fn().mockResolvedValue([]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateDemandaContagemUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateDemandaContagemUseCase);

    await expect(
      useCase.execute({
        inventarioId: 'inv-1',
        nome: 'Demanda teste',
        tipo: 'cega',
        prioridade: 'media',
        ativo: true,
        responsavelId: 421932,
        filtros: { enderecoIds: [], zonas: ['CORREDOR A'], categorias: [] },
        observacoes: '',
        alertaFragilidade: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates demanda when enderecoIds are provided', async () => {
    const repository: Partial<IInventarioRepository> = {
      findInventarioById: vi.fn().mockResolvedValue({
        id: 'inv-1',
        centroId: 'centro-1',
        status: 'agendado',
      }),
      findEnderecosByIdsForCentro: vi.fn().mockResolvedValue([
        { id: 'end-1', enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01', zona: 'CORREDOR A' },
      ]),
      createDemanda: vi.fn().mockResolvedValue({ id: 'dem-1', nome: 'Demanda teste' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateDemandaContagemUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateDemandaContagemUseCase);

    const result = await useCase.execute({
      inventarioId: 'inv-1',
      nome: 'Demanda teste',
      tipo: 'cega',
      prioridade: 'media',
      ativo: true,
      responsavelId: 421932,
      filtros: { enderecoIds: ['end-1'], zonas: [], categorias: [] },
      observacoes: '',
      alertaFragilidade: false,
    });

    expect(result).toEqual({ id: 'dem-1', nome: 'Demanda teste' });
    expect(repository.createDemanda).toHaveBeenCalledWith(
      expect.objectContaining({ inventarioId: 'inv-1' }),
      ['end-1'],
    );
  });

  it('creates demanda when enderecos are resolved', async () => {
    const repository: Partial<IInventarioRepository> = {
      findInventarioById: vi.fn().mockResolvedValue({
        id: 'inv-1',
        centroId: 'centro-1',
        status: 'agendado',
      }),
      resolveEnderecosForDemanda: vi.fn().mockResolvedValue([
        { id: 'end-1', enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01', zona: 'CORREDOR A' },
      ]),
      createDemanda: vi.fn().mockResolvedValue({ id: 'dem-1', nome: 'Demanda teste' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateDemandaContagemUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(CreateDemandaContagemUseCase);

    const result = await useCase.execute({
      inventarioId: 'inv-1',
      nome: 'Demanda teste',
      tipo: 'cega',
      prioridade: 'media',
      ativo: true,
      responsavelId: 421932,
      filtros: { enderecoIds: [], zonas: ['CORREDOR A'], categorias: [] },
      observacoes: '',
      alertaFragilidade: false,
    });

    expect(result).toEqual({ id: 'dem-1', nome: 'Demanda teste' });
    expect(repository.createDemanda).toHaveBeenCalledWith(
      expect.objectContaining({ inventarioId: 'inv-1' }),
      ['end-1'],
    );
  });
});

describe('SubmitContagemCegaUseCase', () => {
  it('rejects when endereco does not match', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaEnderecoById: vi.fn().mockResolvedValue({
        id: 'item-1',
        enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemCegaUseCase);

    await expect(
      useCase.execute({
        demandaId: 'dem-1',
        demandaEnderecoId: 'item-1',
        operatorId: 421932,
        enderecoArmazenagem: 'WRONG',
        codigoProduto: 'SKU1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
        lote: 'L1',
        peso: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('submits contagem when endereco matches', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaEnderecoById: vi.fn().mockResolvedValue({
        id: 'item-1',
        status: 'pendente',
        enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01',
      }),
      markDemandaEnderecoEmAndamento: vi.fn(),
      submitContagemCega: vi.fn().mockResolvedValue({ id: 'cont-1' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemCegaUseCase);

    const result = await useCase.execute({
      demandaId: 'dem-1',
      demandaEnderecoId: 'item-1',
      operatorId: 421932,
      enderecoArmazenagem: 'CD01-ZNA-R01-BL01-NV01-AP01',
      codigoProduto: 'SKU1',
      quantidadeCaixas: 1,
      quantidadeUnidades: 0,
      lote: 'L1',
      peso: 1,
    });

    expect(result).toEqual({ id: 'cont-1' });
    expect(repository.markDemandaEnderecoEmAndamento).toHaveBeenCalledWith('item-1');
  });

  it('throws when endereco item is missing', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaEnderecoById: vi.fn().mockResolvedValue(null),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemCegaUseCase);

    await expect(
      useCase.execute({
        demandaId: 'dem-1',
        demandaEnderecoId: 'missing',
        operatorId: 421932,
        enderecoArmazenagem: 'CD01-ZNA-R01-BL01-NV01-AP01',
        codigoProduto: 'SKU1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
        lote: 'L1',
        peso: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
