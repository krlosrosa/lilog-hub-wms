import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExcluirMapaConferenciaReentregaTransporteUseCase } from '../../../src/application/usecases/expedicao/excluir-mapa-conferencia-reentrega-transporte.usecase.js';
import { DRIZZLE_PROVIDER } from '../../../src/infra/db/providers/drizzle/drizzle.provider.js';

vi.mock(
  '../../../src/infra/db/expedicao/mapa-conferencia-reentrega.drizzle.js',
  () => ({
    excluirMapaConferenciaReentregaTransporteDb: vi.fn(),
  }),
);

import { excluirMapaConferenciaReentregaTransporteDb } from '../../../src/infra/db/expedicao/mapa-conferencia-reentrega.drizzle.js';

const inputBase = {
  transporteId: 't-1',
  unidadeId: 'unidade-1',
};

describe('ExcluirMapaConferenciaReentregaTransporteUseCase', () => {
  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirMapaConferenciaReentregaTransporteUseCase,
        {
          provide: DRIZZLE_PROVIDER,
          useValue: {},
        },
      ],
    }).compile();

    return moduleRef.get(ExcluirMapaConferenciaReentregaTransporteUseCase);
  }

  it('exclui mapa de conferência reentrega com sucesso', async () => {
    vi.mocked(excluirMapaConferenciaReentregaTransporteDb).mockResolvedValue({
      transporteId: 't-1',
      loteIdsExcluidos: ['lote-1'],
    });

    const useCase = await createUseCase();
    const result = await useCase.execute(inputBase);

    expect(result).toEqual({
      transporteId: 't-1',
      loteIdsExcluidos: ['lote-1'],
    });
  });

  it('retorna 404 quando mapa não existe', async () => {
    vi.mocked(excluirMapaConferenciaReentregaTransporteDb).mockResolvedValue(
      null,
    );

    const useCase = await createUseCase();

    await expect(useCase.execute(inputBase)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('retorna 409 quando conferência reentrega já foi iniciada', async () => {
    vi.mocked(excluirMapaConferenciaReentregaTransporteDb).mockRejectedValue(
      new Error(
        'Não é possível excluir: a conferência reentrega já foi iniciada.',
      ),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute(inputBase)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('retorna 409 quando existe corte operacional ativo', async () => {
    vi.mocked(excluirMapaConferenciaReentregaTransporteDb).mockRejectedValue(
      new Error(
        'Não é possível excluir o mapa: existe corte operacional ativo vinculado.',
      ),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute(inputBase)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
