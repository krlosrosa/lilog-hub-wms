import { describe, expect, it } from 'vitest';

import type { ParametrosRecebimentoConferencia } from '@/features/recebimento/types/recebimento.schema';

import type { ProductRecord } from '../local-db/schema';
import {
  isProdutoTipoPvar,
  isResolvableCatalogProduct,
  resolveProdutoConferenciaV2,
  resolveProductCatalogFlags,
} from './resolve-produto-conferencia-v2';

const baseProduct: ProductRecord = {
  produtoId: 'p-1',
  sku: '610500413',
  description: 'Produto teste',
  unidadeId: 'ITB',
  empresa: 'EMP',
  categoria: 'refrigerado',
  tipo: 'PVAR',
  ean: '',
  dum: '',
  shelfLife: 30,
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
  updatedAt: Date.now(),
  deletedAt: null,
};

const parametros: ParametrosRecebimentoConferencia = {
  quantidadeModo: 'ambos',
  loteModo: 'lote',
  controlaPalete: false,
  solicitarPesoPvar: true,
  exigirEtiquetaPesoVariavel: false,
  condicoesChecklist: [],
};

describe('isProdutoTipoPvar', () => {
  it('detects PVAR tipo', () => {
    expect(isProdutoTipoPvar('PVAR')).toBe(true);
    expect(isProdutoTipoPvar('pvar')).toBe(true);
    expect(isProdutoTipoPvar('PPAD')).toBe(false);
  });
});

describe('resolveProductCatalogFlags', () => {
  it('derives peso variavel from tipo when flag is false', () => {
    const flags = resolveProductCatalogFlags(baseProduct);
    expect(flags.pesoVariavel).toBe(true);
    expect(flags.controlaLote).toBe(true);
    expect(flags.controlaValidade).toBe(true);
  });
});

describe('resolveProdutoConferenciaV2', () => {
  it('enables peso variavel for PVAR products', () => {
    const config = resolveProdutoConferenciaV2(baseProduct, parametros);
    expect(config.pesoVariavel).toBe(true);
    expect(config.controlaPeso).toBe(true);
  });

  it('disables peso variavel when solicitarPesoPvar is false', () => {
    const config = resolveProdutoConferenciaV2(baseProduct, {
      ...parametros,
      solicitarPesoPvar: false,
    });
    expect(config.pesoVariavel).toBe(false);
  });
});

describe('isResolvableCatalogProduct', () => {
  it('accepts real catalog products', () => {
    expect(isResolvableCatalogProduct(baseProduct)).toBe(true);
  });

  it('rejects stub novo- products', () => {
    expect(
      isResolvableCatalogProduct({
        ...baseProduct,
        produtoId: 'novo-600240283',
      }),
    ).toBe(false);
  });

  it('rejects nullish products', () => {
    expect(isResolvableCatalogProduct(null)).toBe(false);
    expect(isResolvableCatalogProduct(undefined)).toBe(false);
  });
});
