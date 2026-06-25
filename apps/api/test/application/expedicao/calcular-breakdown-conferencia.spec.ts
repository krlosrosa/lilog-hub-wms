import { describe, expect, it } from 'vitest';

import { calcularBreakdownConferencia } from '../../../src/application/services/expedicao/calcular-breakdown-conferencia.js';

const PESOS = {
  unidade: '0.500',
  caixa: '6.000',
} as const;

describe('calcularBreakdownConferencia', () => {
  it('retorna null sem unidadesPorCaixa', () => {
    expect(
      calcularBreakdownConferencia(100, null, PESOS.unidade, PESOS.caixa),
    ).toBeNull();
  });

  it('calcula caixas e unidades sem paletes', () => {
    const result = calcularBreakdownConferencia(
      265,
      12,
      PESOS.unidade,
      PESOS.caixa,
    );

    expect(result).toEqual({
      paletes: 0,
      caixas: 22,
      unidades: 1,
      pesoPaletes: null,
      pesoCaixas: 132,
      pesoUnidades: 0.5,
    });
  });

  it('ignora caixasPorPalete e mantém paletes zerados', () => {
    const result = calcularBreakdownConferencia(
      240,
      12,
      PESOS.unidade,
      PESOS.caixa,
    );

    expect(result?.paletes).toBe(0);
    expect(result?.caixas).toBe(20);
    expect(result?.unidades).toBe(0);
    expect(result?.pesoPaletes).toBeNull();
  });

  it('soma caixas×unidxCx + unidades === qtdNorm', () => {
    const unidadesPorCaixa = 12;
    const qtdNorm = 265;

    const result = calcularBreakdownConferencia(
      qtdNorm,
      unidadesPorCaixa,
      PESOS.unidade,
      PESOS.caixa,
    );

    expect(result).not.toBeNull();
    const soma =
      result!.caixas * unidadesPorCaixa + result!.unidades;
    expect(soma).toBe(qtdNorm);
  });
});
