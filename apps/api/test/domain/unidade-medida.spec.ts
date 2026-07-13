import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DISPLAY_QUANTIDADE_CONFIG,
  fromBaseUnitsForDisplay,
  fromBaseUnitsForDisplayNullable,
  resolveDisplayQuantidadeConfig,
  toBaseUnits,
} from '../../src/domain/services/unidade-medida.js';

describe('toBaseUnits', () => {
  it('multiplies CX by unidadesPorCaixa', () => {
    expect(toBaseUnits(1, 'CX', 12)).toBe(12);
    expect(toBaseUnits(2, 'CX', 12)).toBe(24);
  });

  it('keeps UN unchanged', () => {
    expect(toBaseUnits(7, 'UN', 12)).toBe(7);
  });
});

describe('fromBaseUnitsForDisplay', () => {
  it('converts UN to CX when config prefers CX', () => {
    const result = fromBaseUnitsForDisplay(48, 12, {
      unidadePadrao: 'CX',
      decimaisCaixa: 2,
      decimaisUnidade: 0,
    });

    expect(result).toEqual({
      valor: 4,
      unidade: 'CX',
      casasDecimais: 2,
    });
  });

  it('keeps UN when config prefers UN', () => {
    const result = fromBaseUnitsForDisplay(48, 12, DEFAULT_DISPLAY_QUANTIDADE_CONFIG);

    expect(result).toEqual({
      valor: 48,
      unidade: 'UN',
      casasDecimais: 0,
    });
  });

  it('falls back to UN when unidadesPorCaixa is invalid', () => {
    const result = fromBaseUnitsForDisplay(48, 0, {
      unidadePadrao: 'CX',
      decimaisCaixa: 2,
      decimaisUnidade: 0,
    });

    expect(result.unidade).toBe('UN');
    expect(result.valor).toBe(48);
  });
});

describe('fromBaseUnitsForDisplayNullable', () => {
  it('returns null values for null input', () => {
    expect(
      fromBaseUnitsForDisplayNullable(null, 12, DEFAULT_DISPLAY_QUANTIDADE_CONFIG),
    ).toEqual({
      valor: null,
      unidade: null,
      casasDecimais: 0,
    });
  });
});

describe('resolveDisplayQuantidadeConfig', () => {
  it('uses defaults when parametros is undefined', () => {
    expect(resolveDisplayQuantidadeConfig()).toEqual(
      DEFAULT_DISPLAY_QUANTIDADE_CONFIG,
    );
  });

  it('maps parametros to display config', () => {
    expect(
      resolveDisplayQuantidadeConfig({
        displayUnidadePadrao: 'CX',
        displayDecimaisCaixa: 3,
        displayDecimaisUnidade: 1,
      }),
    ).toEqual({
      unidadePadrao: 'CX',
      decimaisCaixa: 3,
      decimaisUnidade: 1,
    });
  });
});
