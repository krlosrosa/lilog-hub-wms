import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExcluirTransporteUseCase } from '../../../src/application/usecases/expedicao/excluir-transporte.usecase.js';
import { TRANSPORTE_REPOSITORY } from '../../../src/domain/repositories/expedicao/transporte.repository.js';

describe('ExcluirTransporteUseCase', () => {
  it('exclui transporte com sucesso', async () => {
    const excluir = vi.fn().mockResolvedValue({ id: 't-1', rota: '101' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: { excluir },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirTransporteUseCase);

    const result = await useCase.execute({ id: 't-1', unidadeId: 'unidade-1' });

    expect(result).toEqual({ id: 't-1', rota: '101' });
  });

  it('retorna 404 quando transporte não existe', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: { excluir: vi.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirTransporteUseCase);

    await expect(
      useCase.execute({ id: 't-x', unidadeId: 'unidade-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retorna 409 quando transporte possui mapa salvo', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: {
            excluir: vi.fn().mockRejectedValue(
              new Error(
                'Exclua o mapa de separação antes de excluir este transporte.',
              ),
            ),
          },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirTransporteUseCase);

    await expect(
      useCase.execute({ id: 't-1', unidadeId: 'unidade-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('retorna 409 quando transporte possui corte ativo', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirTransporteUseCase,
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: {
            excluir: vi.fn().mockRejectedValue(
              new Error(
                'Não é possível excluir o transporte: existe corte operacional ativo.',
              ),
            ),
          },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirTransporteUseCase);

    await expect(
      useCase.execute({ id: 't-1', unidadeId: 'unidade-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
