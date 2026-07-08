import { describe, expect, it, vi } from 'vitest';

import { CriarCncUseCase } from '../../../src/application/usecases/cnc/criar-cnc.usecase.js';
import type { ICncRepository } from '../../../src/domain/repositories/cnc/cnc.repository.js';
import type { CncEventPublisher } from '../../../src/application/services/cnc-event.publisher.js';

describe('CriarCncUseCase', () => {
  it('deve criar CNC com itens detalhados e publicar evento de criação', async () => {
    const cncRepository: Partial<ICncRepository> = {
      findByOrigem: vi.fn().mockResolvedValue(null),
      countByYear: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({
        id: 'cnc-1',
        numero: 'CNC-2026-00001',
      }),
    };

    const cncEventPublisher = {
      publishRegistrarEvento: vi.fn().mockResolvedValue(undefined),
    } as unknown as CncEventPublisher;

    const useCase = new CriarCncUseCase(
      cncRepository as ICncRepository,
      cncEventPublisher,
    );

    const itens = [
      {
        tipo: 'divergencia' as const,
        referenciaId: 'div-1',
        subtipoOcorrencia: 'falta' as const,
        produtoId: 'prod-1',
        sku: 'SKU-001',
        descricaoProduto: 'Produto teste',
        quantidadeEsperada: 100,
        quantidadeRecebida: 88,
        quantidadeDivergente: 12,
        unidadeMedida: 'UN',
        responsavelSugerido: 'fornecedor' as const,
      },
    ];

    const result = await useCase.execute({
      recebimentoId: 'rec-1',
      preRecebimentoId: 'pre-1',
      unidadeId: 'ITB',
      transportadoraId: 'transp-1',
      responsavelOperacaoId: 10,
      userId: 1,
      descricao: 'CNC gerada automaticamente (1 falta)',
      itens,
    });

    expect(cncRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itens,
        descricao: 'CNC gerada automaticamente (1 falta)',
      }),
    );
    expect(cncEventPublisher.publishRegistrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({
        cncId: 'cnc-1',
      }),
    );
    expect(result).toMatchObject({ id: 'cnc-1' });
  });
});
