import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { SolicitarCorteUseCase } from '../../../src/application/usecases/corte-operacional/solicitar-corte.usecase.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../src/domain/repositories/corte-operacional/corte-operacional.repository.js';

const unidadeId = 'unidade-1';
const mapaGrupoId = '00000000-0000-4000-8000-000000000001';
const mapaGrupoItemId = '00000000-0000-4000-8000-000000000002';

const mapaGrupo = {
  id: mapaGrupoId,
  microUuid: 'MAPA-CODE-001',
  titulo: 'MAPA-001',
  subtitulo: null,
  transporteId: '00000000-0000-4000-8000-000000000003',
  transporteRota: 'R01',
  totalItens: 1,
  pesoTotalKg: 100,
  unidadeId,
  processo: 'separacao' as const,
  itens: [
    {
      id: mapaGrupoItemId,
      sku: 'SKU-001',
      descricao: 'Produto',
      remessa: 'REM-001',
      cliente: 'Cliente',
      lote: null,
      quantidade: 10,
      unidadeMedida: 'CX',
      peso: 50,
    },
  ],
};

const corteDetalhe = {
  id: '00000000-0000-4000-8000-000000000010',
  unidadeId,
  codigo: 'CORTE-0001',
  mapaGrupoId,
  transporteId: mapaGrupo.transporteId,
  mapaGrupoMicroUuid: mapaGrupo.microUuid,
  mapaGrupoTitulo: mapaGrupo.titulo,
  rota: mapaGrupo.transporteRota,
  doca: null,
  status: 'solicitado' as const,
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
  itens: [
    {
      id: '00000000-0000-4000-8000-000000000011',
      corteId: '00000000-0000-4000-8000-000000000010',
      mapaGrupoItemId,
      sku: 'SKU-001',
      descricao: 'Produto',
      remessa: 'REM-001',
      cliente: 'Cliente',
      lote: null,
      quantidadeMapa: 10,
      quantidadeCorte: 5,
      unidadeMedida: 'CX',
      pesoKg: 25,
      createdAt: new Date('2026-06-22T10:00:00.000Z'),
    },
  ],
};

describe('SolicitarCorteUseCase', () => {
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

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SolicitarCorteUseCase,
        {
          provide: CORTE_OPERACIONAL_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    return moduleRef.get(SolicitarCorteUseCase);
  }

  it('solicita corte com itens válidos', async () => {
    vi.mocked(repository.findMapaGrupoPorCodigo).mockResolvedValue(mapaGrupo);
    vi.mocked(repository.existsCorteAtivoByMapaGrupoId).mockResolvedValue(false);
    vi.mocked(repository.findMapaGrupoItensByIds).mockResolvedValue([
      {
        id: mapaGrupoItemId,
        mapaGrupoId,
        quantidade: 10,
        sku: 'SKU-001',
        descricao: 'Produto',
        remessa: 'REM-001',
        cliente: 'Cliente',
        lote: null,
        unidadeMedida: 'CX',
        peso: 50,
      },
    ]);
    vi.mocked(repository.solicitarCorte).mockResolvedValue(corteDetalhe);

    const useCase = await createUseCase();
    const result = await useCase.execute({
      unidadeId,
      mapaGrupoId,
      mapaGrupoMicroUuid: mapaGrupo.microUuid,
      itens: [{ mapaGrupoItemId, quantidadeCorte: 5 }],
      solicitadoPor: 1,
    });

    expect(result.codigo).toBe('CORTE-0001');
    expect(result.status).toBe('solicitado');
    expect(repository.solicitarCorte).toHaveBeenCalledOnce();
  });

  it('rejeita quantidade acima do mapa', async () => {
    vi.mocked(repository.findMapaGrupoPorCodigo).mockResolvedValue(mapaGrupo);
    vi.mocked(repository.existsCorteAtivoByMapaGrupoId).mockResolvedValue(false);
    vi.mocked(repository.findMapaGrupoItensByIds).mockResolvedValue([
      {
        id: mapaGrupoItemId,
        mapaGrupoId,
        quantidade: 10,
        sku: 'SKU-001',
        descricao: 'Produto',
        remessa: 'REM-001',
        cliente: 'Cliente',
        lote: null,
        unidadeMedida: 'CX',
        peso: 50,
      },
    ]);

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        unidadeId,
        mapaGrupoId,
        mapaGrupoMicroUuid: mapaGrupo.microUuid,
        itens: [{ mapaGrupoItemId, quantidadeCorte: 11 }],
        solicitadoPor: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita mapa-grupo inexistente', async () => {
    vi.mocked(repository.findMapaGrupoPorCodigo).mockResolvedValue(null);

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        unidadeId,
        mapaGrupoId,
        mapaGrupoMicroUuid: mapaGrupo.microUuid,
        itens: [{ mapaGrupoItemId, quantidadeCorte: 5 }],
        solicitadoPor: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejeita corte ativo duplicado', async () => {
    vi.mocked(repository.findMapaGrupoPorCodigo).mockResolvedValue(mapaGrupo);
    vi.mocked(repository.existsCorteAtivoByMapaGrupoId).mockResolvedValue(true);

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        unidadeId,
        mapaGrupoId,
        mapaGrupoMicroUuid: mapaGrupo.microUuid,
        itens: [{ mapaGrupoItemId, quantidadeCorte: 5 }],
        solicitadoPor: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
