import { describe, expect, it } from 'vitest';

import {
  applyGs1BarcodeInput,
  extractNetWeightKgFromGs1,
  formatPesoFromGs1Kg,
  looksLikeGs1Barcode,
  looksLikeGs1TraceabilityBarcode,
  parseGs1Barcode,
  parseGs1DateYyMmDd,
  resolveLoteFieldInput,
  resolvePesoInputValue,
} from './parse-gs1-barcode';

const LOTE_GS1 = '(15)261213(11)260616(7030)674(10)401126031209';

describe('looksLikeGs1Barcode', () => {
  it('ignora entrada parcial durante digitação do leitor', () => {
    expect(looksLikeGs1Barcode('(')).toBe(false);
    expect(looksLikeGs1Barcode('(01)7891097104275')).toBe(false);
  });

  it('detecta código GS1 completo com AI de peso', () => {
    expect(
      looksLikeGs1Barcode('(01)7891097104275(3103)013207(3303)013869(30)01'),
    ).toBe(true);
  });

  it('detecta código GS1 de rastreabilidade com lote e datas', () => {
    expect(looksLikeGs1TraceabilityBarcode(LOTE_GS1)).toBe(true);
    expect(looksLikeGs1Barcode(LOTE_GS1)).toBe(true);
  });
});

describe('parseGs1DateYyMmDd', () => {
  it('converte YYMMDD para ISO', () => {
    expect(parseGs1DateYyMmDd('260616')).toBe('2026-06-16');
    expect(parseGs1DateYyMmDd('261213')).toBe('2026-12-13');
  });
});

describe('parseGs1Barcode traceability', () => {
  it('parseia lote, produção, validade e autorização', () => {
    const result = parseGs1Barcode(LOTE_GS1);

    expect(result.batchLot).toBe('401126031209');
    expect(result.productionDateIso).toBe('2026-06-16');
    expect(result.bestBeforeDateIso).toBe('2026-12-13');
    expect(result.authorizationCode).toBe('674');
  });
});

describe('resolveLoteFieldInput', () => {
  it('extrai lote e fabricação de GS1 bipado no campo lote', () => {
    expect(resolveLoteFieldInput(LOTE_GS1)).toEqual({
      lote: '401126031209',
      validade: '2026-06-16',
      parsedFromGs1: true,
    });
  });

  it('converte lote numérico com mais de 10 dígitos', () => {
    expect(resolveLoteFieldInput('4001251010251010')).toEqual({
      lote: '4001251010251010',
      validade: '2025-10-10',
      parsedFromGs1: false,
    });
  });

  it('mantém lote curto sem conversão', () => {
    expect(resolveLoteFieldInput('401126')).toEqual({
      lote: '401126',
      validade: null,
      parsedFromGs1: false,
    });
  });

  it('preserva lote alfanumérico sem padrão de fabricação', () => {
    expect(resolveLoteFieldInput('ABC-1234')).toEqual({
      lote: 'ABC-1234',
      validade: null,
      parsedFromGs1: false,
    });
  });
});

describe('applyGs1BarcodeInput', () => {
  it('aplica peso e GTIN ao confirmar leitura completa', () => {
    expect(
      applyGs1BarcodeInput('(01)7891097104275(3103)013207(3303)013869(30)01'),
    ).toEqual({
      applied: true,
      pesoKg: '13.207',
      etiqueta: '7891097104275',
      lote: null,
      validade: null,
    });
  });

  it('aplica lote e fabricação de GS1 de rastreabilidade', () => {
    expect(applyGs1BarcodeInput(LOTE_GS1)).toEqual({
      applied: true,
      pesoKg: null,
      etiqueta: null,
      lote: '401126031209',
      validade: '2026-06-16',
    });
  });

  it('não aplica enquanto o código ainda está incompleto', () => {
    expect(applyGs1BarcodeInput('(01)7891097104275')).toEqual({
      applied: false,
      pesoKg: null,
      etiqueta: null,
      lote: null,
      validade: null,
    });
  });
});

describe('parseGs1Barcode weight', () => {
  it('parseia formato com parênteses e extrai peso líquido AI 3103', () => {
    const result = parseGs1Barcode(
      '(01)7891097104275(3103)013207(3303)013869(30)01',
    );

    expect(result.gtin).toBe('7891097104275');
    expect(result.netWeightKg).toBe(13.207);
    expect(result.grossWeightKg).toBe(13.869);
    expect(result.count).toBe(1);
  });

  it('parseia formato concatenado GS1-128', () => {
    const result = parseGs1Barcode('0107891097104275310301320733030138693001');

    expect(result.gtin).toBe('7891097104275');
    expect(result.netWeightKg).toBe(13.207);
    expect(result.grossWeightKg).toBe(13.869);
    expect(result.count).toBe(1);
  });

  it('prioriza peso líquido 310n sobre bruto 330n', () => {
    expect(extractNetWeightKgFromGs1('(3103)013207(3303)013869')).toBe(13.207);
  });
});

describe('resolvePesoInputValue', () => {
  it('converte código GS1 bipado em peso líquido', () => {
    expect(
      resolvePesoInputValue('(01)7891097104275(3103)013207(3303)013869(30)01'),
    ).toBe('13.207');
  });

  it('mantém entrada manual numérica', () => {
    expect(resolvePesoInputValue('12.5')).toBe('12.5');
  });
});

describe('formatPesoFromGs1Kg', () => {
  it('formata com até 3 casas decimais', () => {
    expect(formatPesoFromGs1Kg(13.207)).toBe('13.207');
    expect(formatPesoFromGs1Kg(10)).toBe('10');
  });
});
