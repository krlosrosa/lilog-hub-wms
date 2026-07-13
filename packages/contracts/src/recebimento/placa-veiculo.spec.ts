import { describe, expect, it } from 'vitest';

import {
  isPlacaVeiculoValida,
  normalizarPlacaVeiculo,
  PlacaVeiculoSchema,
} from './placa-veiculo.js';

describe('placaVeiculo', () => {
  it('normaliza placa para maiúsculas sem espaços laterais', () => {
    expect(normalizarPlacaVeiculo(' abc-1234 ')).toBe('ABC-1234');
  });

  it('aceita formato AAA9999', () => {
    expect(isPlacaVeiculoValida('ABC1234')).toBe(true);
    expect(isPlacaVeiculoValida('ABC-1234')).toBe(true);
  });

  it('aceita formato AAA9999-AA', () => {
    expect(isPlacaVeiculoValida('ABC1234-SP')).toBe(true);
    expect(isPlacaVeiculoValida('ABC-1234-SP')).toBe(true);
    expect(isPlacaVeiculoValida('ABC1234-AA')).toBe(true);
  });

  it('rejeita placa vazia e valores sem placa', () => {
    expect(isPlacaVeiculoValida('')).toBe(false);
    expect(isPlacaVeiculoValida('sem placa')).toBe(false);
    expect(isPlacaVeiculoValida('SEM PLACA')).toBe(false);
  });

  it('rejeita formatos inválidos', () => {
    expect(isPlacaVeiculoValida('ABC1D23')).toBe(false);
    expect(isPlacaVeiculoValida('AB1234')).toBe(false);
    expect(isPlacaVeiculoValida('ABC123')).toBe(false);
  });

  it('valida com schema zod', () => {
    expect(PlacaVeiculoSchema.parse('abc-1234-sp')).toBe('ABC-1234-SP');
    expect(() => PlacaVeiculoSchema.parse('sem placa')).toThrow();
  });
});
