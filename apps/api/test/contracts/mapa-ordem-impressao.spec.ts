import { describe, expect, it } from 'vitest';

import {
  montarHtmlTabelaItens,
  resolverValorColunaOrdemImpressao,
} from '@lilog/contracts';

describe('resolverValorColunaOrdemImpressao', () => {
  const item = {
    sku: 'SKU-001',
    descricao: 'Leite integral 1L',
    lote: 'L2026',
    faixa: 'Amarelo',
    dataFabricacao: '2026-01-15',
    quantidadeNormalizadaUnidades: 120,
    breakdown: { paletes: 1, caixas: 2, unidades: 0 },
  };

  it('mapeia sku, lote e quantidades', () => {
    expect(resolverValorColunaOrdemImpressao(item, 'sku')).toBe('SKU-001');
    expect(resolverValorColunaOrdemImpressao(item, 'descricao')).toBe(
      'Leite integral 1L',
    );
    expect(resolverValorColunaOrdemImpressao(item, 'lote')).toBe('L2026');
    expect(resolverValorColunaOrdemImpressao(item, 'quantidade_caixa')).toBe('2');
    expect(resolverValorColunaOrdemImpressao(item, 'quantidade_palete')).toBe('1');
  });

  it('retorna endereco quando informado', () => {
    expect(
      resolverValorColunaOrdemImpressao(
        { ...item, endereco: 'A 0001 001 01' },
        'endereco',
      ),
    ).toBe('A 0001 001 01');
  });

  it('retorna traco para colunas vazias', () => {
    expect(resolverValorColunaOrdemImpressao(item, 'endereco')).toBe('—');
    expect(
      resolverValorColunaOrdemImpressao(
        { ...item, descricao: null },
        'descricao',
      ),
    ).toBe('—');
  });
});

describe('montarHtmlTabelaItens', () => {
  it('monta tabela com colunas solicitadas', () => {
    const html = montarHtmlTabelaItens(
      [
        {
          sku: 'SKU-001',
          lote: null,
          faixa: null,
          dataFabricacao: null,
          quantidadeNormalizadaUnidades: 24,
          breakdown: { paletes: 0, caixas: 2, unidades: 0 },
        },
      ],
      ['sku', 'quantidade_caixa'],
    );

    expect(html).toContain('SKU');
    expect(html).toContain('Quantidade Caixa');
    expect(html).toContain('SKU-001');
    expect(html).toContain('2');
  });
});
