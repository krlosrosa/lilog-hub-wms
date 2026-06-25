import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExcluirMapaLoteUseCase } from '../../../src/application/usecases/expedicao/excluir-mapa-lote.usecase.js';
import { MAPA_LOTE_REPOSITORY } from '../../../src/domain/repositories/expedicao/mapa-lote.repository.js';

describe('ExcluirMapaLoteUseCase', () => {
  it('exclui lote com sucesso', async () => {
    const excluir = vi.fn().mockResolvedValue({
      loteId: 'lote-1',
      transportesAfetados: 2,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirMapaLoteUseCase,
        {
          provide: MAPA_LOTE_REPOSITORY,
          useValue: { excluir },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirMapaLoteUseCase);

    const result = await useCase.execute({
      loteId: 'lote-1',
      unidadeId: 'unidade-1',
    });

    expect(result).toEqual({ loteId: 'lote-1', transportesAfetados: 2 });
    expect(excluir).toHaveBeenCalledWith('lote-1', 'unidade-1');
  });

  it('retorna 404 quando lote não existe', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirMapaLoteUseCase,
        {
          provide: MAPA_LOTE_REPOSITORY,
          useValue: { excluir: vi.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirMapaLoteUseCase);

    await expect(
      useCase.execute({ loteId: 'lote-x', unidadeId: 'unidade-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retorna 409 quando separação já foi iniciada', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirMapaLoteUseCase,
        {
          provide: MAPA_LOTE_REPOSITORY,
          useValue: {
            excluir: vi.fn().mockRejectedValue(
              new Error(
                'Não é possível excluir o mapa: a separação já foi iniciada para um ou mais grupos.',
              ),
            ),
          },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirMapaLoteUseCase);

    await expect(
      useCase.execute({ loteId: 'lote-1', unidadeId: 'unidade-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('retorna 409 quando existe corte ativo', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExcluirMapaLoteUseCase,
        {
          provide: MAPA_LOTE_REPOSITORY,
          useValue: {
            excluir: vi.fn().mockRejectedValue(
              new Error(
                'Não é possível excluir o mapa: existe corte operacional ativo vinculado.',
              ),
            ),
          },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(ExcluirMapaLoteUseCase);

    await expect(
      useCase.execute({ loteId: 'lote-1', unidadeId: 'unidade-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
