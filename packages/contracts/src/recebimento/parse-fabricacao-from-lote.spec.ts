import { describe, expect, it } from 'vitest';

import {
  canParseFabricacaoFromLote,
  parseFabricacaoFromLote,
} from './parse-fabricacao-from-lote.js';

const REFERENCE_DATE = new Date(2026, 6, 6);

describe('parseFabricacaoFromLote', () => {
  it('extrai fabricação dos 6 últimos dígitos ignorando os 4 primeiros', () => {
    const result = parseFabricacaoFromLote('4001251010', {
      referenceDate: REFERENCE_DATE,
    });

    expect(result).toEqual({
      ok: true,
      day: 10,
      month: 10,
      year: 2025,
      display: '10/10/2025',
      isoDate: '2025-10-10',
    });
  });

  it('ignora caracteres não numéricos', () => {
    const result = parseFabricacaoFromLote('4001-25-10-10', {
      referenceDate: REFERENCE_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.display).toBe('10/10/2025');
    }
  });

  it('aceita lotes com prefixo maior que 4 dígitos', () => {
    const result = parseFabricacaoFromLote('123456789012251010', {
      referenceDate: REFERENCE_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.display).toBe('10/10/2025');
    }
  });

  it('retorna erro quando o lote tem menos de 10 dígitos', () => {
    const result = parseFabricacaoFromLote('40012510');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('10 dígitos');
    }
  });

  it('retorna erro quando a data extraída é inválida', () => {
    const result = parseFabricacaoFromLote('4001300231', {
      referenceDate: REFERENCE_DATE,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Formato de lote inválido');
    }
  });

  it('rejeita fabricação posterior à data atual', () => {
    const result = parseFabricacaoFromLote('4001260707', {
      referenceDate: REFERENCE_DATE,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Fabricação não pode ser posterior à data atual');
    }
  });

  it('rejeita fabricação anterior a 3 anos', () => {
    const result = parseFabricacaoFromLote('4001220101', {
      referenceDate: REFERENCE_DATE,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Fabricação não pode ser anterior a 3 anos da data atual');
    }
  });

  it('aceita fabricação exatamente no limite de 3 anos', () => {
    const result = parseFabricacaoFromLote('4001230706', {
      referenceDate: REFERENCE_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.display).toBe('06/07/2023');
    }
  });
});

describe('canParseFabricacaoFromLote', () => {
  it('indica quando há dígitos suficientes', () => {
    expect(canParseFabricacaoFromLote('4001251010')).toBe(true);
    expect(canParseFabricacaoFromLote('40012510')).toBe(false);
  });
});
