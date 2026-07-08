import { describe, expect, it } from 'vitest';

import { consolidarItensRemessa } from '../../../src/application/services/expedicao/consolidar-itens-remessa.js';
import {
  parseCodigoCelula,
  parseLote,
} from '../../../src/application/services/expedicao/parse-codigo-celula.js';
import type { RemessaItemInput } from '../../../src/domain/repositories/expedicao/upload-lote.repository.js';

function criarItem(
  overrides: Partial<RemessaItemInput> = {},
): RemessaItemInput {
  return {
    sku: '540425376',
    produtoId: null,
    lote: '9000260403',
    dataFabricacao: '2026-04-03',
    faixa: 'verde',
    peso: 1,
    quantidade: 1,
    unidadeMedida: 'CX',
    quantidadeNormalizadaUnidades: 12,
    ...overrides,
  };
}

describe('parseCodigoCelula', () => {
  it('preserva lotes numéricos distintos do Excel', () => {
    expect(parseCodigoCelula(9000260403)).toBe('9000260403');
    expect(parseCodigoCelula(9000260409)).toBe('9000260409');
    expect(parseLote(9000260403)).not.toBe(parseLote(9000260409));
  });
});

describe('consolidarItensRemessa', () => {
  it('não consolida itens com lotes diferentes', () => {
    const itens = consolidarItensRemessa([
      criarItem({ lote: '9000260403', dataFabricacao: '2026-04-03' }),
      criarItem({ lote: '9000260409', dataFabricacao: '2026-04-09' }),
    ]);

    expect(itens).toHaveLength(2);
    expect(itens.map((item) => item.lote).sort()).toEqual([
      '9000260403',
      '9000260409',
    ]);
  });

  it('não consolida itens sem lote quando a data de fabricação difere', () => {
    const itens = consolidarItensRemessa([
      criarItem({ lote: null, dataFabricacao: '2026-04-03' }),
      criarItem({ lote: null, dataFabricacao: '2026-04-09' }),
    ]);

    expect(itens).toHaveLength(2);
  });

  it('consolida linhas repetidas com a mesma chave', () => {
    const itens = consolidarItensRemessa([
      criarItem({ quantidade: 1, quantidadeNormalizadaUnidades: 12, peso: 1 }),
      criarItem({ quantidade: 2, quantidadeNormalizadaUnidades: 24, peso: 2 }),
    ]);

    expect(itens).toHaveLength(1);
    expect(itens[0]?.quantidade).toBe(3);
    expect(itens[0]?.quantidadeNormalizadaUnidades).toBe(36);
    expect(itens[0]?.peso).toBe(3);
  });
});
