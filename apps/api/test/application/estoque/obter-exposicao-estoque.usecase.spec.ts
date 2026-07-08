import { describe, expect, it, vi } from 'vitest';

import { ObterExposicaoEstoqueUseCase } from '../../../src/application/usecases/estoque/obter-exposicao-estoque.usecase.js';
import type { ICncRepository } from '../../../src/domain/repositories/cnc/cnc.repository.js';
import type { ICobrancaTransportadoraRepository } from '../../../src/domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

describe('ObterExposicaoEstoqueUseCase', () => {
  it('deve agregar CNCs em aberto e débito de devolução em aberto', async () => {
    const cncRepository: Partial<ICncRepository> = {
      list: vi
        .fn()
        .mockResolvedValueOnce({ total: 3, items: [], page: 1, limit: 1 })
        .mockResolvedValueOnce({ total: 2, items: [], page: 1, limit: 1 }),
    };

    const cobrancaTransportadoraRepository: Partial<ICobrancaTransportadoraRepository> =
      {
        listarProcessos: vi.fn().mockResolvedValue([
          { id: 'p1', status: 'aberto', valorTotal: 150.5 },
          { id: 'p2', status: 'em_analise', valorTotal: 49.5 },
          { id: 'p3', status: 'aprovado', valorTotal: 999 },
        ]),
      };

    const useCase = new ObterExposicaoEstoqueUseCase(
      cncRepository as ICncRepository,
      cobrancaTransportadoraRepository as ICobrancaTransportadoraRepository,
    );

    const result = await useCase.execute({ unidadeId: 'unidade-1' });

    expect(result).toEqual({
      cncPendentes: 3,
      cncEmAnalise: 2,
      cncEmAbertoTotal: 5,
      devolucaoDebitoEmAbertoValor: 200,
    });
  });
});
