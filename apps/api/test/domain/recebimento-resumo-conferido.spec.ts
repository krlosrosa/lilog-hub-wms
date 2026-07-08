import { describe, expect, it } from 'vitest';

import { buildResumoConferidoPorProduto } from '../../src/domain/services/recebimento-resumo-conferido.js';

describe('buildResumoConferidoPorProduto', () => {
  it('marks divergence when physical qty differs from accounting qty', () => {
    const result = buildResumoConferidoPorProduto({
      esperados: [
        {
          produtoId: 'prod-1',
          quantidadeEsperada: 10,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 12,
        },
      ],
      conferidos: [
        {
          produtoId: 'prod-1',
          quantidadeRecebida: 8,
          unidadeMedida: 'UN',
        },
      ],
    });

    expect(result).toEqual([
      {
        produtoId: 'prod-1',
        qtdContabil: 10,
        qtdFisica: 8,
        pesoTotal: null,
        hasDivergencia: true,
      },
    ]);
  });

  it('sums peso recebido por produto', () => {
    const result = buildResumoConferidoPorProduto({
      esperados: [
        {
          produtoId: 'prod-1',
          quantidadeEsperada: 2,
          unidadeMedida: 'CX',
          unidadesPorCaixa: 1,
        },
      ],
      conferidos: [
        {
          produtoId: 'prod-1',
          quantidadeRecebida: 1,
          unidadeMedida: 'CX',
          pesoRecebido: 10.5,
        },
        {
          produtoId: 'prod-1',
          quantidadeRecebida: 1,
          unidadeMedida: 'CX',
          pesoRecebido: 11.25,
        },
      ],
    });

    expect(result[0]?.pesoTotal).toBeCloseTo(21.75);
  });

  it('converts expected boxes to base units', () => {
    const result = buildResumoConferidoPorProduto({
      esperados: [
        {
          produtoId: 'prod-1',
          quantidadeEsperada: 2,
          unidadeMedida: 'CX',
          unidadesPorCaixa: 12,
        },
      ],
      conferidos: [
        {
          produtoId: 'prod-1',
          quantidadeRecebida: 24,
          unidadeMedida: 'UN',
        },
      ],
    });

    expect(result[0]).toMatchObject({
      qtdContabil: 24,
      qtdFisica: 24,
      hasDivergencia: false,
    });
  });
});
