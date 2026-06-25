import { describe, expect, it } from 'vitest';

import { calcularBreakdownQuantidade } from '../../../src/application/services/expedicao/calcular-breakdown-quantidade.js';

const PESOS = {
  unidade: '0.500',
  caixa: '6.000',
  palete: '120.000',
} as const;

describe('calcularBreakdownQuantidade', () => {
  it('retorna null sem unidadesPorCaixa', () => {
    expect(
      calcularBreakdownQuantidade(100, null, 10, PESOS.unidade, PESOS.caixa, PESOS.palete),
    ).toBeNull();
  });

  it('retorna null com unidadesPorCaixa zero', () => {
    expect(
      calcularBreakdownQuantidade(100, 0, 10, PESOS.unidade, PESOS.caixa, PESOS.palete),
    ).toBeNull();
  });

  it('sem caixasPorPalete define paletes=0 e caixas=totalCaixas', () => {
    const result = calcularBreakdownQuantidade(
      25,
      12,
      null,
      PESOS.unidade,
      PESOS.caixa,
      PESOS.palete,
    );

    expect(result).toEqual({
      paletes: 0,
      caixas: 2,
      unidades: 1,
      pesoPaletes: null,
      pesoCaixas: 12,
      pesoUnidades: 0.5,
    });
  });

  it('divide exatamente em paletes sem resto', () => {
    const result = calcularBreakdownQuantidade(
      240,
      12,
      10,
      PESOS.unidade,
      PESOS.caixa,
      PESOS.palete,
    );

    expect(result).toEqual({
      paletes: 2,
      caixas: 0,
      unidades: 0,
      pesoPaletes: 240,
      pesoCaixas: null,
      pesoUnidades: null,
    });
  });

  it('calcula resto em caixas e unidades', () => {
    const result = calcularBreakdownQuantidade(
      265,
      12,
      10,
      PESOS.unidade,
      PESOS.caixa,
      PESOS.palete,
    );

    expect(result).toEqual({
      paletes: 2,
      caixas: 2,
      unidades: 1,
      pesoPaletes: 240,
      pesoCaixas: 12,
      pesoUnidades: 0.5,
    });
  });

  it('soma paletes×unidxCx×cxPlt + caixas×unidxCx + unidades === qtdNorm', () => {
    const unidadesPorCaixa = 12;
    const caixasPorPalete = 10;
    const qtdNorm = 265;

    const result = calcularBreakdownQuantidade(
      qtdNorm,
      unidadesPorCaixa,
      caixasPorPalete,
      PESOS.unidade,
      PESOS.caixa,
      PESOS.palete,
    );

    expect(result).not.toBeNull();
    const soma =
      result!.paletes * unidadesPorCaixa * caixasPorPalete +
      result!.caixas * unidadesPorCaixa +
      result!.unidades;
    expect(soma).toBe(qtdNorm);
  });

  it('retorna pesos null quando cadastro de peso ausente', () => {
    const result = calcularBreakdownQuantidade(265, 12, 10, null, null, null);

    expect(result).toEqual({
      paletes: 2,
      caixas: 2,
      unidades: 1,
      pesoPaletes: null,
      pesoCaixas: null,
      pesoUnidades: null,
    });
  });

  it('usa peso liquido quando peso bruto ausente', () => {
    const result = calcularBreakdownQuantidade(
      265,
      12,
      10,
      null,
      null,
      null,
      PESOS.unidade,
      PESOS.caixa,
      PESOS.palete,
    );

    expect(result).toEqual({
      paletes: 2,
      caixas: 2,
      unidades: 1,
      pesoPaletes: 240,
      pesoCaixas: 12,
      pesoUnidades: 0.5,
    });
  });

  it('prioriza peso bruto sobre peso liquido', () => {
    const result = calcularBreakdownQuantidade(
      265,
      12,
      10,
      PESOS.unidade,
      PESOS.caixa,
      PESOS.palete,
      '999',
      '999',
      '999',
    );

    expect(result).toEqual({
      paletes: 2,
      caixas: 2,
      unidades: 1,
      pesoPaletes: 240,
      pesoCaixas: 12,
      pesoUnidades: 0.5,
    });
  });

  it('deriva peso de palete e unidade a partir do peso da caixa', () => {
    const result = calcularBreakdownQuantidade(
      265,
      12,
      10,
      null,
      PESOS.caixa,
      null,
    );

    expect(result).toEqual({
      paletes: 2,
      caixas: 2,
      unidades: 1,
      pesoPaletes: 120,
      pesoCaixas: 12,
      pesoUnidades: 0.5,
    });
  });

  it('deriva peso de unidade avulsa apenas com peso da caixa', () => {
    const result = calcularBreakdownQuantidade(5, 12, 10, null, PESOS.caixa, null);

    expect(result).toEqual({
      paletes: 0,
      caixas: 0,
      unidades: 5,
      pesoPaletes: null,
      pesoCaixas: null,
      pesoUnidades: 2.5,
    });
  });

  it('deriva peso de palete completo apenas com peso da caixa', () => {
    const result = calcularBreakdownQuantidade(
      240,
      12,
      10,
      null,
      PESOS.caixa,
      null,
    );

    expect(result).toEqual({
      paletes: 2,
      caixas: 0,
      unidades: 0,
      pesoPaletes: 120,
      pesoCaixas: null,
      pesoUnidades: null,
    });
  });
});
