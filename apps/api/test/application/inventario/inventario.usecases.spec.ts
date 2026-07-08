import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateDemandaContagemUseCase } from '../../../src/application/usecases/inventario/demanda.usecases.js';
import { SubmitContagemCegaUseCase } from '../../../src/application/usecases/inventario/contagem.usecases.js';
import { SubmitContagemValidacaoUseCase } from '../../../src/application/usecases/inventario/contagem.usecases.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../src/domain/repositories/estoque/estoque.repository.js';
import {
  INVENTARIO_REPOSITORY,
  type IInventarioRepository,
} from '../../../src/domain/repositories/inventario/inventario.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../src/domain/repositories/produto/produto.repository.js';

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

  it('creates demanda when inventario is em_progresso', async () => {
    const repository: Partial<IInventarioRepository> = {
      findInventarioById: vi.fn().mockResolvedValue({
        id: 'inv-1',
        centroId: 'centro-1',
        status: 'em_progresso',
      }),
      findEnderecosByIdsForCentro: vi.fn().mockResolvedValue([
        { id: 'end-1', enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01', zona: 'CORREDOR A' },
      ]),
      createDemanda: vi.fn().mockResolvedValue({ id: 'dem-2', nome: 'Demanda nova' }),
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
      nome: 'Demanda nova',
      tipo: 'validacao',
      prioridade: 'media',
      ativo: true,
      responsavelId: 421932,
      filtros: { enderecoIds: ['end-1'], zonas: [], categorias: [] },
      observacoes: '',
      alertaFragilidade: false,
    });

    expect(result).toEqual({ id: 'dem-2', nome: 'Demanda nova' });
    expect(repository.createDemanda).toHaveBeenCalled();
  });

  it('rejects demanda when inventario is concluido', async () => {
    const repository: Partial<IInventarioRepository> = {
      findInventarioById: vi.fn().mockResolvedValue({
        id: 'inv-1',
        centroId: 'centro-1',
        status: 'concluido',
      }),
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
        filtros: { enderecoIds: ['end-1'], zonas: [], categorias: [] },
        observacoes: '',
        alertaFragilidade: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SubmitContagemCegaUseCase', () => {
  const produtoRepository: Partial<IProdutoRepository> = {
    resolvePorCodigo: vi.fn().mockResolvedValue({
      produtoId: 'prod-1',
      sku: 'SKU1',
      descricao: 'Produto teste',
    }),
  };

  const estoqueRepository: Partial<IEstoqueRepository> = {
    listSaldosEndereco: vi.fn().mockResolvedValue([
      {
        id: 'saldo-1',
        enderecoId: 'addr-1',
        produtoId: 'prod-1',
        produtoSku: 'SKU1',
        produtoNome: 'Produto teste',
        lote: 'L1',
        quantidade: 10,
        unidadeMedida: 'UN',
        numeroSerie: null,
        unidadesPorCaixa: 12,
      },
    ]),
  };

  const baseEnderecoItem = {
    id: 'item-1',
    enderecoId: 'addr-1',
    unidadeId: 'unit-1',
    status: 'pendente' as const,
    enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects when endereco does not match', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaEnderecoById: vi.fn().mockResolvedValue({
        ...baseEnderecoItem,
        enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: ESTOQUE_REPOSITORY, useValue: estoqueRepository },
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
      findDemandaEnderecoById: vi.fn().mockResolvedValue(baseEnderecoItem),
      markDemandaEnderecoEmAndamento: vi.fn(),
      submitContagemCega: vi.fn().mockResolvedValue({ id: 'cont-1' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: ESTOQUE_REPOSITORY, useValue: estoqueRepository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemCegaUseCase);

    const result = await useCase.execute({
      demandaId: 'dem-1',
      demandaEnderecoId: 'item-1',
      operatorId: 421932,
      enderecoArmazenagem: 'CD01-ZNA-R01-BL01-NV01-AP01',
      enderecoVazio: false,
      codigoProduto: 'SKU1',
      quantidadeCaixas: 1,
      quantidadeUnidades: 0,
      lote: 'L1',
      peso: 1,
    });

    expect(result).toEqual({ id: 'cont-1' });
    expect(repository.markDemandaEnderecoEmAndamento).toHaveBeenCalledWith('item-1');
    expect(repository.submitContagemCega).toHaveBeenCalledWith(
      expect.objectContaining({
        codigoProduto: 'SKU1',
        produtoId: 'prod-1',
        saldoEnderecoId: 'saldo-1',
      }),
    );
  });

  it('submits endereco vazio without resolving produto', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaEnderecoById: vi.fn().mockResolvedValue(baseEnderecoItem),
      markDemandaEnderecoEmAndamento: vi.fn(),
      submitContagemCega: vi.fn().mockResolvedValue({ id: 'cont-vazio' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: ESTOQUE_REPOSITORY, useValue: estoqueRepository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemCegaUseCase);

    const result = await useCase.execute({
      demandaId: 'dem-1',
      demandaEnderecoId: 'item-1',
      operatorId: 421932,
      enderecoArmazenagem: 'CD01-ZNA-R01-BL01-NV01-AP01',
      enderecoVazio: true,
      quantidadeCaixas: 0,
      quantidadeUnidades: 0,
    });

    expect(result).toEqual({ id: 'cont-vazio' });
    expect(produtoRepository.resolvePorCodigo).not.toHaveBeenCalled();
    expect(repository.submitContagemCega).toHaveBeenCalledWith(
      expect.objectContaining({
        enderecoVazio: true,
        quantidadeCaixas: 0,
        quantidadeUnidades: 0,
        codigoProduto: 'N/A',
      }),
    );
  });

  it('rejects when sku is invalid', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaEnderecoById: vi.fn().mockResolvedValue(baseEnderecoItem),
      markDemandaEnderecoEmAndamento: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
        {
          provide: PRODUTO_REPOSITORY,
          useValue: {
            resolvePorCodigo: vi.fn().mockResolvedValue(null),
          },
        },
        { provide: ESTOQUE_REPOSITORY, useValue: estoqueRepository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemCegaUseCase);

    await expect(
      useCase.execute({
        demandaId: 'dem-1',
        demandaEnderecoId: 'item-1',
        operatorId: 421932,
        enderecoArmazenagem: 'CD01-ZNA-R01-BL01-NV01-AP01',
        enderecoVazio: false,
        codigoProduto: 'INVALIDO',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
        lote: 'L1',
        peso: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when endereco item is missing', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaEnderecoById: vi.fn().mockResolvedValue(null),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemCegaUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: ESTOQUE_REPOSITORY, useValue: estoqueRepository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemCegaUseCase);

    await expect(
      useCase.execute({
        demandaId: 'dem-1',
        demandaEnderecoId: 'missing',
        operatorId: 421932,
        enderecoArmazenagem: 'CD01-ZNA-R01-BL01-NV01-AP01',
        enderecoVazio: false,
        codigoProduto: 'SKU1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
        lote: 'L1',
        peso: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SubmitContagemValidacaoUseCase', () => {
  const saldoEsperado = {
    saldoEnderecoId: 'saldo-1',
    produtoId: 'prod-1',
    sku: 'SKU1',
    nome: 'Produto teste',
    lote: 'L1',
    quantidade: 10,
    unidadeMedida: 'UN',
    numeroSerie: '',
    unidadesPorCaixa: 12,
  };

  const enderecoItem = {
    id: 'item-1',
    enderecoId: 'addr-1',
    unidadeId: 'unit-1',
    status: 'pendente' as const,
    enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01',
  };

  it('registra divergência quando correspondeAoEsperado vem true mas quantidade difere', async () => {
    const repository: Partial<IInventarioRepository> = {
      findDemandaById: vi.fn().mockResolvedValue({
        id: 'dem-1',
        tipo: 'validacao',
      }),
      findDemandaEnderecoById: vi.fn().mockResolvedValue(enderecoItem),
      markDemandaEnderecoEmAndamento: vi.fn(),
      submitContagemValidacao: vi.fn().mockResolvedValue({ id: 'cont-val-1' }),
    };

    const estoqueRepository: Partial<IEstoqueRepository> = {
      listSaldosEndereco: vi.fn().mockResolvedValue([
        {
          id: 'saldo-1',
          enderecoId: 'addr-1',
          produtoId: 'prod-1',
          produtoSku: 'SKU1',
          produtoNome: 'Produto teste',
          lote: 'L1',
          quantidade: 10,
          unidadeMedida: 'UN',
          numeroSerie: null,
          unidadesPorCaixa: 12,
        },
      ]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitContagemValidacaoUseCase,
        { provide: INVENTARIO_REPOSITORY, useValue: repository },
        { provide: ESTOQUE_REPOSITORY, useValue: estoqueRepository },
      ],
    }).compile();

    const useCase = moduleRef.get(SubmitContagemValidacaoUseCase);

    await useCase.execute({
      demandaId: 'dem-1',
      demandaEnderecoId: 'item-1',
      operatorId: 421932,
      enderecoVazio: false,
      anomaliaEncontrada: false,
      correspondeAoEsperado: true,
      quantidadeCaixas: 0,
      quantidadeUnidades: 5,
      saldoEnderecoId: saldoEsperado.saldoEnderecoId,
      codigoProduto: '',
    });

    expect(repository.submitContagemValidacao).toHaveBeenCalledWith(
      expect.objectContaining({
        correspondeAoEsperado: false,
        quantidadeUnidades: 5,
        saldoEnderecoId: 'saldo-1',
      }),
    );
  });
});
