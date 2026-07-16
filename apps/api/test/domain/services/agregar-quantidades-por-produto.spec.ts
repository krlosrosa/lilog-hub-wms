import { describe, expect, it } from 'vitest';

import {
  agregarEsperadoPorProdutoEmUN,
  agregarRecebidoPorProdutoEmUN,
} from '../../../src/domain/services/agregar-quantidades-por-produto.js';
import type { ItemPreRecebimentoRecord } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { ItemRecebimentoRecord } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

const prodMultiLote: ProdutoRecord = {
  produtoId: 'prod-multi',
  sku: '6128200462',
  descricao: 'BEB LAC POLPA MORANGO',
  empresa: 'lilog',
  categoria: 'alimentos',
  grupo: null,
  tipo: 'PPAD',
  ean: null,
  dum: null,
  shelfLife: 90,
  pesoBrutoUnidade: null,
  pesoBrutoCaixa: null,
  pesoBrutoPalete: null,
  pesoLiquidoUnidade: null,
  pesoLiquidoCaixa: null,
  pesoLiquidoPalete: null,
  unidadesPorCaixa: 12,
  caixasPorPalete: 40,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeEsperado(
  overrides: Partial<ItemPreRecebimentoRecord> = {},
): ItemPreRecebimentoRecord {
  return {
    id: 'pre-item-1',
    preRecebimentoId: 'pre-1',
    produtoId: 'prod-multi',
    quantidadeEsperada: 540,
    unidadeMedida: 'CX',
    unidadesPorCaixa: 12,
    loteEsperado: '4002260704',
    pesoEsperado: null,
    validadeEsperada: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeRecebido(
  overrides: Partial<ItemRecebimentoRecord> = {},
): ItemRecebimentoRecord {
  return {
    id: 'item-1',
    recebimentoId: 'rec-1',
    unidadeId: 'ITB',
    produtoId: 'prod-multi',
    quantidadeRecebida: 810,
    unidadeMedida: 'CX',
    loteRecebido: '4002260704',
    pesoRecebido: null,
    validade: null,
    numeroSerie: null,
    unitizadorId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('agregarEsperadoPorProdutoEmUN', () => {
  it('deve somar linhas multi-lote do mesmo produto em UN', () => {
    const produtos = new Map([['prod-multi', prodMultiLote]]);
    const map = agregarEsperadoPorProdutoEmUN(
      [
        makeEsperado({ id: 'pre-1', quantidadeEsperada: 540 }),
        makeEsperado({ id: 'pre-2', quantidadeEsperada: 90 }),
        makeEsperado({ id: 'pre-3', quantidadeEsperada: 180 }),
      ],
      produtos,
    );

    expect(map.get('prod-multi')).toMatchObject({
      totalUN: 810 * 12,
      unidadesPorCaixa: 12,
    });
  });
});

describe('agregarRecebidoPorProdutoEmUN', () => {
  it('deve converter cada linha para UN antes de somar', () => {
    const produtos = new Map([['prod-multi', prodMultiLote]]);
    const esperados = [makeEsperado()];
    const map = agregarRecebidoPorProdutoEmUN(
      [
        makeRecebido({ id: 'item-1', quantidadeRecebida: 10, unidadeMedida: 'CX' }),
        makeRecebido({ id: 'item-2', quantidadeRecebida: 120, unidadeMedida: 'UN' }),
      ],
      produtos,
      esperados,
    );

    expect(map.get('prod-multi')?.totalUN).toBe(10 * 12 + 120);
  });

  it('nao deve somar quantidades brutas CX+UN sem conversao', () => {
    const produtos = new Map([['prod-multi', prodMultiLote]]);
    const esperados = [makeEsperado()];
    const map = agregarRecebidoPorProdutoEmUN(
      [
        makeRecebido({ id: 'item-1', quantidadeRecebida: 10, unidadeMedida: 'CX' }),
        makeRecebido({ id: 'item-2', quantidadeRecebida: 120, unidadeMedida: 'UN' }),
      ],
      produtos,
      esperados,
    );

    expect(map.get('prod-multi')?.totalUN).not.toBe(130);
  });
});
