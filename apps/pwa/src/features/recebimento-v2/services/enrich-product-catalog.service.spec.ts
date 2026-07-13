import { describe, expect, it } from 'vitest';

import {
  mapProdutoApiToProductRecord,
  productNeedsCatalogRepair,
} from './enrich-product-catalog.service.js';
import type { ProductRecord } from '../local-db/schema.js';

function buildProduct(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    produtoId: 'p1',
    sku: '610500413',
    description: 'Produto teste',
    unidadeId: 'u1',
    empresa: '',
    categoria: '',
    tipo: '',
    ean: '',
    dum: '',
    shelfLife: 0,
    pesoBrutoUnidade: 0,
    pesoBrutoCaixa: 0,
    pesoBrutoPalete: 0,
    pesoLiquidoUnidade: 0,
    pesoLiquidoCaixa: 0,
    pesoLiquidoPalete: 0,
    unidadesPorCaixa: 1,
    caixasPorPalete: 0,
    controlaLote: false,
    controlaValidade: false,
    controlaPeso: false,
    pesoVariavel: false,
    serverRevision: 0,
    updatedAt: 0,
    deletedAt: null,
    ...overrides,
  };
}

describe('productNeedsCatalogRepair', () => {
  it('returns true when tipo is missing', () => {
    expect(productNeedsCatalogRepair(buildProduct({ tipo: '' }))).toBe(true);
  });

  it('returns true when tipo is PVAR but pesoVariavel is false', () => {
    expect(
      productNeedsCatalogRepair(
        buildProduct({ tipo: 'PVAR', pesoVariavel: false }),
      ),
    ).toBe(true);
  });

  it('returns false when PVAR flags are already aligned', () => {
    expect(
      productNeedsCatalogRepair(
        buildProduct({ tipo: 'PVAR', pesoVariavel: true, controlaPeso: true }),
      ),
    ).toBe(false);
  });
});

describe('mapProdutoApiToProductRecord', () => {
  it('derives pesoVariavel and controlaPeso from tipo PVAR', () => {
    const record = mapProdutoApiToProductRecord(
      {
        produtoId: 'p1',
        sku: '610500413',
        descricao: 'Queijo PVAR',
        ean: null,
        unidadesPorCaixa: 6,
        tipo: 'PVAR',
        categoria: 'queijo',
        shelfLife: 30,
      },
      'u1',
      buildProduct(),
    );

    expect(record.tipo).toBe('PVAR');
    expect(record.pesoVariavel).toBe(true);
    expect(record.controlaPeso).toBe(true);
    expect(record.controlaLote).toBe(true);
    expect(record.controlaValidade).toBe(true);
  });
});
