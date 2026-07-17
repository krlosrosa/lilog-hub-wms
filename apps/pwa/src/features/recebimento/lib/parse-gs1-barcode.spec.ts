import { describe, expect, it } from 'vitest';

import {
  applyGs1BarcodeInput,
  applyGs1NonPvarScanInput,
  extractNetWeightKgFromGs1,
  formatPesoFromGs1Kg,
  isGtinLikeNumeric,
  isScannerSubmitKey,
  looksLikeGs1Barcode,
  looksLikeGs1TraceabilityBarcode,
  normalizeGs1ScannerInput,
  parseGs1Barcode,
  parseGs1DateYyMmDd,
  resolveLoteFieldInput,
  resolvePesoInputValue,
} from './parse-gs1-barcode';

const LOTE_GS1 = '(15)261213(11)260616(7030)674(10)401126031209';
const LOTE_GS1_IMAGEM = '(15)261227(11)260630(7030)674(10)401126061001';
const PESO_GS1_IMAGEM = '(01)7891097104275(3103)013207(3303)013860(30)01';
const NON_PVAR_GS1_IMAGEM = '(02)17891097103381(15)260901(37)0105(10)4022260708';
const NON_PVAR_GS1_CONCATENADO = '021789109710338115260901370105104022260708';

describe('isGtinLikeNumeric', () => {
  it('detecta GTIN numérico de 13 ou 14 dígitos', () => {
    expect(isGtinLikeNumeric('7891097104275')).toBe(true);
    expect(isGtinLikeNumeric('07891097104275')).toBe(true);
    expect(isGtinLikeNumeric('4011260610')).toBe(false);
  });
});

describe('normalizeGs1ScannerInput', () => {
  it('remove tab e quebras de linha do final da leitura', () => {
    expect(normalizeGs1ScannerInput('(3103)013207\t')).toBe('(3103)013207');
    expect(normalizeGs1ScannerInput('(3103)013207\r\n')).toBe('(3103)013207');
  });
});

describe('isScannerSubmitKey', () => {
  it('aceita Enter e Tab como gatilho de submit', () => {
    expect(isScannerSubmitKey('Enter')).toBe(true);
    expect(isScannerSubmitKey('Tab')).toBe(true);
    expect(isScannerSubmitKey('Escape')).toBe(false);
  });
});

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

  it('detecta código com tab no final', () => {
    expect(looksLikeGs1Barcode(`${PESO_GS1_IMAGEM}\t`)).toBe(true);
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

    expect(result.batchLot).toBe('4011260312');
    expect(result.productionDateIso).toBe('2026-06-16');
    expect(result.bestBeforeDateIso).toBe('2026-12-13');
    expect(result.authorizationCode).toBe('674');
  });

  it('parseia lote da imagem real com 10 dígitos fixos após AI 10', () => {
    const result = parseGs1Barcode(LOTE_GS1_IMAGEM);

    expect(result.batchLot).toBe('4011260610');
    expect(result.productionDateIso).toBe('2026-06-30');
    expect(result.bestBeforeDateIso).toBe('2026-12-27');
    expect(result.authorizationCode).toBe('674');
  });

  it('parseia lote concatenado cujo valor contém 01 interno', () => {
    const result = parseGs1Barcode('1526121311260616703067410401126031209');

    expect(result.batchLot).toBe('4011260312');
    expect(result.productionDateIso).toBe('2026-06-16');
    expect(result.bestBeforeDateIso).toBe('2026-12-13');
    expect(result.authorizationCode).toBe('674');
  });

  it('parseia lote concatenado com 12 dígitos e sufixo AI 30', () => {
    const result = parseGs1Barcode('152612271126063070306741040112606103001');

    expect(result.batchLot).toBe('4011260610');
    expect(result.productionDateIso).toBe('2026-06-30');
    expect(result.count).toBe(1);
  });

  it('parseia lote com FNC1 como separador', () => {
    const result = parseGs1Barcode(
      `15261213112606167030674${'\u001d'}10401126031209`,
    );

    expect(result.batchLot).toBe('4011260312');
    expect(result.productionDateIso).toBe('2026-06-16');
    expect(result.authorizationCode).toBe('674');
  });

  it('parseia AI 17 em formato com parênteses', () => {
    const result = parseGs1Barcode('(01)7891097104275(17)261231(10)LOTE123');

    expect(result.gtin).toBe('7891097104275');
    expect(result.expirationDateIso).toBe('2026-12-31');
    expect(result.batchLot).toBe('LOTE123');
  });

  it('parseia AI 17 em formato concatenado', () => {
    const result = parseGs1Barcode('01078910971042751726123110LOTE123');

    expect(result.gtin).toBe('7891097104275');
    expect(result.expirationDateIso).toBe('2026-12-31');
    expect(result.batchLot).toBe('LOTE123');
  });

  it('parseia AI 37 em formato com parênteses', () => {
    const result = parseGs1Barcode(NON_PVAR_GS1_IMAGEM);

    expect(result.batchLot).toBe('4022260708');
    expect(result.bestBeforeDateIso).toBe('2026-09-01');
    expect(result.count).toBe(105);
  });

  it('parseia AI 37 em formato concatenado sem separadores', () => {
    const result = parseGs1Barcode(NON_PVAR_GS1_CONCATENADO);

    expect(result.batchLot).toBe('4022260708');
    expect(result.bestBeforeDateIso).toBe('2026-09-01');
    expect(result.count).toBe(105);
  });
});

describe('resolveLoteFieldInput', () => {
  it('extrai lote e fabricação de GS1 bipado no campo lote', () => {
    expect(resolveLoteFieldInput(LOTE_GS1)).toEqual({
      lote: '4011260312',
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

  it('aplica peso da imagem real com AI 3103 e bruto 3303', () => {
    expect(applyGs1BarcodeInput(PESO_GS1_IMAGEM)).toEqual({
      applied: true,
      pesoKg: '13.207',
      etiqueta: '7891097104275',
      lote: null,
      validade: null,
    });
  });

  it('aplica leitura com tab no final', () => {
    expect(applyGs1BarcodeInput(`${PESO_GS1_IMAGEM}\t`)).toEqual({
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
      lote: '4011260312',
      validade: '2026-06-16',
    });
  });

  it('aplica lote truncado da imagem de rastreabilidade', () => {
    expect(applyGs1BarcodeInput(LOTE_GS1_IMAGEM)).toEqual({
      applied: true,
      pesoKg: null,
      etiqueta: null,
      lote: '4011260610',
      validade: '2026-06-30',
    });
  });

  it('aplica validade de AI 17 quando produção não está presente', () => {
    expect(applyGs1BarcodeInput('(01)7891097104275(17)261231(10)LOTE123')).toEqual({
      applied: true,
      pesoKg: null,
      etiqueta: '7891097104275',
      lote: 'LOTE123',
      validade: '2026-12-31',
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
  it('parseia código concatenado com GTIN de 13 dígitos', () => {
    const code = '017891097104275310301320733030138603001';
    const result = parseGs1Barcode(code);

    expect(result.gtin).toBe('7891097104275');
    expect(result.netWeightKg).toBe(13.207);
    expect(result.grossWeightKg).toBe(13.86);
    expect(result.count).toBe(1);
  });

  it('aplica peso do código concatenado com GTIN de 13 dígitos', () => {
    expect(applyGs1BarcodeInput('017891097104275310301320733030138603001')).toEqual({
      applied: true,
      pesoKg: '13.207',
      etiqueta: '7891097104275',
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

  it('parseia peso da imagem real', () => {
    const result = parseGs1Barcode(PESO_GS1_IMAGEM);

    expect(result.gtin).toBe('7891097104275');
    expect(result.netWeightKg).toBe(13.207);
    expect(result.grossWeightKg).toBe(13.86);
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

  it('detecta e parseia peso bare sem GTIN', () => {
    expect(looksLikeGs1Barcode('3103013207')).toBe(true);
    expect(parseGs1Barcode('3103013207').netWeightKg).toBe(13.207);
    expect(resolvePesoInputValue('3103013207')).toBe('13.207');
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

describe('applyGs1NonPvarScanInput', () => {
  it('extrai lote, quantidade de caixas e fabricação do lote (não do AI 15)', () => {
    expect(applyGs1NonPvarScanInput(NON_PVAR_GS1_IMAGEM)).toEqual({
      applied: true,
      lote: '4022260708',
      fabricacao: '2026-07-08',
      quantidadeCaixas: 105,
    });
  });

  it('extrai dados de GS1 concatenado sem separadores', () => {
    expect(applyGs1NonPvarScanInput(NON_PVAR_GS1_CONCATENADO)).toEqual({
      applied: true,
      lote: '4022260708',
      fabricacao: '2026-07-08',
      quantidadeCaixas: 105,
    });
  });

  it('não aplica quando o código não possui lote nem quantidade', () => {
    expect(applyGs1NonPvarScanInput('(01)7891097104275')).toEqual({
      applied: false,
      lote: null,
      fabricacao: null,
      quantidadeCaixas: null,
    });
  });

  it('aceita lote digitado diretamente sem GS1', () => {
    expect(applyGs1NonPvarScanInput('4022260708')).toEqual({
      applied: true,
      lote: '4022260708',
      fabricacao: '2026-07-08',
      quantidadeCaixas: null,
    });
  });
});

describe('formatPesoFromGs1Kg', () => {
  it('formata com até 3 casas decimais', () => {
    expect(formatPesoFromGs1Kg(13.207)).toBe('13.207');
    expect(formatPesoFromGs1Kg(10)).toBe('10');
  });
});
