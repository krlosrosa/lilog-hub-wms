import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { DesvincularNfsDevolucaoTransporteUseCase } from '../../../src/application/usecases/expedicao/desvincular-nfs-devolucao-transporte.usecase.js';
import { DRIZZLE_PROVIDER } from '../../../src/infra/db/providers/drizzle/drizzle.provider.js';

vi.mock(
  '../../../src/infra/db/expedicao/list-transportes-by-ids.drizzle.js',
  () => ({
    listTransportesByIdsDb: vi.fn(),
  }),
);

vi.mock(
  '../../../src/infra/db/expedicao/desvincular-nfs-devolucao-transporte.drizzle.js',
  () => ({
    desvincularNfsDevolucaoTransporteDb: vi.fn(),
  }),
);

import { listTransportesByIdsDb } from '../../../src/infra/db/expedicao/list-transportes-by-ids.drizzle.js';
import { desvincularNfsDevolucaoTransporteDb } from '../../../src/infra/db/expedicao/desvincular-nfs-devolucao-transporte.drizzle.js';

const inputBase = {
  transporteId: 't-1',
  unidadeId: 'unidade-1',
  remessaIds: ['remessa-1'],
};

describe('DesvincularNfsDevolucaoTransporteUseCase', () => {
  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DesvincularNfsDevolucaoTransporteUseCase,
        {
          provide: DRIZZLE_PROVIDER,
          useValue: {},
        },
      ],
    }).compile();

    return moduleRef.get(DesvincularNfsDevolucaoTransporteUseCase);
  }

  it('desvincula reentregas com sucesso', async () => {
    vi.mocked(listTransportesByIdsDb).mockResolvedValue([
      {
        numeroTransporte: 't-1',
        unidadeId: 'unidade-1',
        ultimoMapaLoteId: null,
      },
    ] as never);

    vi.mocked(desvincularNfsDevolucaoTransporteDb).mockResolvedValue({
      remessasDesvinculadas: 1,
      remessaIds: ['remessa-1'],
    });

    const useCase = await createUseCase();
    const result = await useCase.execute(inputBase);

    expect(result).toEqual({
      remessasDesvinculadas: 1,
      remessaIds: ['remessa-1'],
    });
  });

  it('retorna 404 quando transporte não existe', async () => {
    vi.mocked(listTransportesByIdsDb).mockResolvedValue([]);

    const useCase = await createUseCase();

    await expect(useCase.execute(inputBase)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('retorna 400 quando remessa é inválida', async () => {
    vi.mocked(listTransportesByIdsDb).mockResolvedValue([
      { numeroTransporte: 't-1' },
    ] as never);

    vi.mocked(desvincularNfsDevolucaoTransporteDb).mockRejectedValue(
      new Error(
        'Remessas inválidas ou não são reentregas deste transporte: remessa-x',
      ),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute(inputBase)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('retorna 409 quando transporte possui mapa de conferência reentrega', async () => {
    vi.mocked(listTransportesByIdsDb).mockResolvedValue([
      { numeroTransporte: 't-1' },
    ] as never);

    vi.mocked(desvincularNfsDevolucaoTransporteDb).mockRejectedValue(
      new Error(
        'Exclua o mapa de conferência reentrega antes de desalocar estas NFs.',
      ),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute(inputBase)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('retorna 409 quando transporte possui corte ativo', async () => {
    vi.mocked(listTransportesByIdsDb).mockResolvedValue([
      { numeroTransporte: 't-1' },
    ] as never);

    vi.mocked(desvincularNfsDevolucaoTransporteDb).mockRejectedValue(
      new Error(
        'Não é possível desalocar reentregas: existe corte operacional ativo.',
      ),
    );

    const useCase = await createUseCase();

    await expect(useCase.execute(inputBase)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
