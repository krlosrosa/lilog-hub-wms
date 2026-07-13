import { describe, expect, it } from 'vitest';

import { resolveConferenceQuantidadePar } from './conferencia-quantidade';
import {
  calcConferenceQuantityInUnidades,
  normalizeSkuParam,
  resolveUnidadesPorCaixa,
} from './resolve-produto-conferencia-v2';

describe('normalizeSkuParam', () => {
  it('remove aspas externas do sku', () => {
    expect(normalizeSkuParam('"600598361"')).toBe('600598361');
    expect(normalizeSkuParam("'600598361'")).toBe('600598361');
  });
});

describe('calcConferenceQuantityInUnidades', () => {
  it('multiplica caixas por unidadesPorCaixa', () => {
    expect(
      calcConferenceQuantityInUnidades({
        recebidaCaixa: 10,
        recebidaUnidade: 0,
        unidadesPorCaixa: 12,
        pesoVariavel: false,
      }),
    ).toBe(120);
  });

  it('usa fator 1 quando unidadesPorCaixa é zero', () => {
    expect(
      calcConferenceQuantityInUnidades({
        recebidaCaixa: 10,
        recebidaUnidade: 0,
        unidadesPorCaixa: 0,
        pesoVariavel: false,
      }),
    ).toBe(10);
  });
});

describe('resolveConferenceQuantidadePar', () => {
  it('reidrata caixas a partir de quantity em UN quando modo é caixa', () => {
    const par = resolveConferenceQuantidadePar(
      {
        id: '1',
        demandId: 'd1',
        sku: 'SKU-1',
        quantity: 120,
        conferidoAt: new Date().toISOString(),
        syncStatus: 'pending',
        updatedAt: Date.now(),
      },
      'caixa',
      12,
    );

    expect(par).toEqual({ caixa: 10, unidade: 0 });
  });

  it('repara registros legados que gravaram caixas em quantity com UPC errado', () => {
    const par = resolveConferenceQuantidadePar(
      {
        id: '1',
        demandId: 'd1',
        sku: 'SKU-1',
        quantity: 5,
        conferidoAt: new Date().toISOString(),
        syncStatus: 'pending',
        updatedAt: Date.now(),
      },
      'caixa',
      12,
    );

    expect(par).toEqual({ caixa: 5, unidade: 0 });
  });
});

describe('resolveUnidadesPorCaixa', () => {
  it('retorna 1 quando valor ausente ou zero', () => {
    expect(resolveUnidadesPorCaixa(0)).toBe(1);
    expect(resolveUnidadesPorCaixa(undefined)).toBe(1);
  });

  it('prioriza o primeiro valor positivo', () => {
    expect(resolveUnidadesPorCaixa(0, 12, 6)).toBe(12);
  });
});
