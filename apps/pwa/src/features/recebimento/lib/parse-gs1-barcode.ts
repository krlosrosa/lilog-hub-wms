import {
  canParseFabricacaoFromLote,
  parseFabricacaoFromLote,
} from '@lilog/contracts';

export type Gs1BarcodeParseResult = {
  gtin: string | null;
  netWeightKg: number | null;
  grossWeightKg: number | null;
  count: number | null;
  batchLot: string | null;
  productionDateIso: string | null;
  expirationDateIso: string | null;
  bestBeforeDateIso: string | null;
  authorizationCode: string | null;
  applicationIdentifiers: Record<string, string>;
};

const FNC1 = '\u001d';
const AI10_FIXED_NUMERIC_LENGTH = 10;
const MIN_PLAIN_LOTE_DIGITS = 10;

export function normalizeGs1ScannerInput(input: string): string {
  return input.replace(/[\t\r\n]+/g, '').trim();
}

export function isScannerSubmitKey(key: string): boolean {
  return key === 'Enter' || key === 'Tab';
}

export function isGtinLikeNumeric(value: string): boolean {
  return /^\d{13,14}$/.test(value.trim());
}

function normalizeBatchLotFromAi10(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed) && trimmed.length >= AI10_FIXED_NUMERIC_LENGTH) {
    return trimmed.slice(0, AI10_FIXED_NUMERIC_LENGTH);
  }
  return trimmed;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function isNetWeightAi(ai: string): boolean {
  return /^310[0-6]$/.test(ai);
}

function isGrossWeightAi(ai: string): boolean {
  return /^330[0-6]$/.test(ai);
}

function isValidCalendarDate(day: number, month: number, year: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseGs1DateYyMmDd(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 6) {
    return null;
  }

  const year = 2000 + Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));

  if (!isValidCalendarDate(day, month, year)) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseWeightFromAi(ai: string, value: string): number | null {
  if (!isNetWeightAi(ai) && !isGrossWeightAi(ai)) {
    return null;
  }

  const decimals = Number(ai[3]);
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  return Number(digits) / 10 ** decimals;
}

function parseParenthesesFormat(input: string): Record<string, string> | null {
  if (!input.includes('(')) {
    return null;
  }

  const result: Record<string, string> = {};
  const pattern = /\((\d{2,4})\)([^(]*)/g;
  let match = pattern.exec(input);

  while (match) {
    const ai = match[1];
    const value = ai === '10' ? normalizeBatchLotFromAi10(match[2]) : match[2].trim();
    result[ai] = value;
    match = pattern.exec(input);
  }

  return Object.keys(result).length > 0 ? result : null;
}

function readVariableLengthField(
  normalized: string,
  startIndex: number,
  maxLength = 20,
): { value: string; nextIndex: number } {
  let end = startIndex;
  while (end < normalized.length && end - startIndex < maxLength) {
    const remainder = normalized.slice(end);
    if (/^(11|15|17|10|01|02|00|30|37)\d/.test(remainder) || /^7030/.test(remainder)) {
      break;
    }
    if (normalized[end] === FNC1) {
      break;
    }
    end += 1;
  }

  return {
    value: normalized.slice(startIndex, end),
    nextIndex: end === startIndex ? startIndex + 1 : end,
  };
}

function readGtinField(
  input: string,
  startIndex: number,
): { value: string; nextIndex: number } {
  const afterAi = startIndex + 2;
  const remainder = input.slice(afterAi);

  const weightSuccessor = remainder.match(/^(\d{13,14})(?=310[0-6]|330[0-6])/);
  if (weightSuccessor) {
    return {
      value: weightSuccessor[1],
      nextIndex: afterAi + weightSuccessor[1].length,
    };
  }

  const traceSuccessor = remainder.match(
    /^(\d{13,14})(?=(?:11|15|17)\d{6}|10\d{10,}|7030|\u001d|$)/,
  );
  if (traceSuccessor) {
    return {
      value: traceSuccessor[1],
      nextIndex: afterAi + traceSuccessor[1].length,
    };
  }

  if (/^\d{14}/.test(remainder)) {
    return { value: remainder.slice(0, 14), nextIndex: afterAi + 14 };
  }

  return {
    value: remainder.slice(0, 13),
    nextIndex: afterAi + Math.min(13, remainder.length),
  };
}

function readCountField(
  input: string,
  startIndex: number,
): { value: string; nextIndex: number } {
  let end = startIndex;
  while (end < input.length && end - startIndex < 8 && /\d/.test(input[end] ?? '')) {
    const remainder = input.slice(end);
    if (
      /^(11|15|17)\d{6}/.test(remainder) ||
      /^10\d{10}(?:\u001d|$)/.test(remainder) ||
      /^7030/.test(remainder)
    ) {
      break;
    }
    if (input[end] === FNC1) {
      break;
    }
    end += 1;
  }

  return {
    value: input.slice(startIndex, end),
    nextIndex: end === startIndex ? startIndex + 1 : end,
  };
}

function parseConcatenatedFormat(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  let index = 0;

  while (index < input.length) {
    if (input[index] === FNC1) {
      index += 1;
      continue;
    }

    const ai4 = input.slice(index, index + 4);
    if (isNetWeightAi(ai4) || isGrossWeightAi(ai4)) {
      result[ai4] = input.slice(index + 4, index + 10);
      index += 10;
      continue;
    }

    if (ai4 === '7030') {
      const field = readVariableLengthField(input, index + 4, 20);
      result[ai4] = field.value;
      index = field.nextIndex;
      if (input[index] === FNC1) {
        index += 1;
      }
      continue;
    }

    const ai2 = input.slice(index, index + 2);

    if (ai2 === '01') {
      const gtinField = readGtinField(input, index);
      result[ai2] = gtinField.value;
      index = gtinField.nextIndex;
      continue;
    }

    if (ai2 === '00') {
      result[ai2] = input.slice(index + 2, index + 20);
      index += 20;
      continue;
    }

    if (ai2 === '02') {
      result[ai2] = input.slice(index + 2, index + 16);
      index += 16;
      continue;
    }

    if (ai2 === '11' || ai2 === '15' || ai2 === '17') {
      result[ai2] = input.slice(index + 2, index + 8);
      index += 8;
      continue;
    }

    if (ai2 === '10') {
      const lotStart = index + 2;
      const lotSlice = input.slice(lotStart);

      if (/^\d{10,}/.test(lotSlice)) {
        result[ai2] = lotSlice.slice(0, AI10_FIXED_NUMERIC_LENGTH);
        index = lotStart + AI10_FIXED_NUMERIC_LENGTH;
        continue;
      }

      const fnc1Pos = input.indexOf(FNC1, lotStart);
      const end = fnc1Pos >= 0 ? fnc1Pos : input.length;
      result[ai2] = input.slice(lotStart, end).trim();
      index = fnc1Pos >= 0 ? fnc1Pos + 1 : input.length;
      continue;
    }

    if (ai2 === '30' || ai2 === '37') {
      const field = readCountField(input, index + 2);
      result[ai2] = field.value;
      index = field.nextIndex;
      if (input[index] === FNC1) {
        index += 1;
      }
      continue;
    }

    break;
  }

  return result;
}

function buildResult(applicationIdentifiers: Record<string, string>): Gs1BarcodeParseResult {
  let netWeightKg: number | null = null;
  let grossWeightKg: number | null = null;

  for (const [ai, value] of Object.entries(applicationIdentifiers)) {
    if (isNetWeightAi(ai)) {
      netWeightKg = parseWeightFromAi(ai, value);
    } else if (isGrossWeightAi(ai)) {
      grossWeightKg = parseWeightFromAi(ai, value);
    }
  }

  const gtinRaw = applicationIdentifiers['01'] ?? null;
  const gtinDigits = gtinRaw?.replace(/\D/g, '') ?? '';
  const gtin =
    gtinDigits.length > 14
      ? gtinDigits.slice(-14)
      : gtinDigits.replace(/^0+/, '') || gtinDigits || null;
  const countRaw = applicationIdentifiers['37'] ?? applicationIdentifiers['30'];
  const count = countRaw ? Number(countRaw.replace(/\D/g, '')) : null;
  const batchLot = applicationIdentifiers['10']?.trim() || null;
  const productionDateIso = applicationIdentifiers['11']
    ? parseGs1DateYyMmDd(applicationIdentifiers['11'])
    : null;
  const expirationDateIso = applicationIdentifiers['17']
    ? parseGs1DateYyMmDd(applicationIdentifiers['17'])
    : null;
  const bestBeforeDateIso = applicationIdentifiers['15']
    ? parseGs1DateYyMmDd(applicationIdentifiers['15'])
    : null;
  const authorizationCode = applicationIdentifiers['7030']?.trim() || null;

  return {
    gtin,
    netWeightKg,
    grossWeightKg,
    count: count !== null && !Number.isNaN(count) ? count : null,
    batchLot,
    productionDateIso,
    expirationDateIso,
    bestBeforeDateIso,
    authorizationCode,
    applicationIdentifiers,
  };
}

export function looksLikeGs1TraceabilityBarcode(input: string): boolean {
  const normalized = normalizeGs1ScannerInput(input);
  if (normalized.length < 12) {
    return false;
  }

  if (/\((?:10|11|15|17|7030)\)/.test(normalized)) {
    return true;
  }

  if (normalized.includes(FNC1) && /(?:^|\u001d)(?:10|11|15|17|7030)/.test(normalized)) {
    return true;
  }

  const compact = normalized.replace(/\s/g, '');
  return /(?:^|\d)(?:11|15|17)\d{6}/.test(compact) && /10\d/.test(compact);
}

export function looksLikeGs1WeightBarcode(input: string): boolean {
  const normalized = normalizeGs1ScannerInput(input);
  if (normalized.length < 10) {
    return false;
  }

  if (/\(310[0-6]\)\d{6}/.test(normalized) || /\(330[0-6]\)\d{6}/.test(normalized)) {
    return true;
  }

  if (normalized.includes(FNC1) && /310[0-6]\d{6}/.test(normalized)) {
    return true;
  }

  const compact = normalized.replace(/\s/g, '');
  if (/^01\d{14}310[0-6]\d{6}/.test(compact)) {
    return true;
  }

  if (/^310[0-6]\d{6}$/.test(compact) || /^330[0-6]\d{6}$/.test(compact)) {
    return true;
  }

  return /310[0-6]\d{6}/.test(compact) && /^01\d{13,14}/.test(compact);
}

export function looksLikeGs1Barcode(input: string): boolean {
  return looksLikeGs1WeightBarcode(input) || looksLikeGs1TraceabilityBarcode(input);
}

export type Gs1BarcodeApplyResult = {
  applied: boolean;
  pesoKg: string | null;
  etiqueta: string | null;
  lote: string | null;
  validade: string | null;
};

function resolveFabricacaoFromLoteOrGs1(
  lote: string | null,
  gs1Dates: Pick<
    Gs1BarcodeParseResult,
    'productionDateIso' | 'expirationDateIso' | 'bestBeforeDateIso'
  >,
): string | null {
  if (lote && canParseFabricacaoFromLote(lote)) {
    const parsedFabricacao = parseFabricacaoFromLote(lote);
    if (parsedFabricacao.ok) {
      return parsedFabricacao.isoDate;
    }
  }

  return (
    gs1Dates.productionDateIso ??
    gs1Dates.expirationDateIso ??
    gs1Dates.bestBeforeDateIso ??
    null
  );
}

export function applyGs1BarcodeInput(input: string): Gs1BarcodeApplyResult {
  const trimmed = normalizeGs1ScannerInput(input);
  if (!trimmed || !looksLikeGs1Barcode(trimmed)) {
    return {
      applied: false,
      pesoKg: null,
      etiqueta: null,
      lote: null,
      validade: null,
    };
  }

  const parsed = parseGs1Barcode(trimmed);
  const hasWeight = parsed.netWeightKg != null;
  const hasGtin = parsed.gtin != null;
  const hasLote = !!parsed.batchLot;
  const validade = resolveFabricacaoFromLoteOrGs1(parsed.batchLot, parsed);
  const hasValidade = !!validade;

  if (!hasWeight && !hasGtin && !hasLote && !hasValidade) {
    return {
      applied: false,
      pesoKg: null,
      etiqueta: null,
      lote: null,
      validade: null,
    };
  }

  return {
    applied: true,
    pesoKg: hasWeight ? formatPesoFromGs1Kg(parsed.netWeightKg!) : null,
    etiqueta: null,
    lote: hasLote ? parsed.batchLot : null,
    validade,
  };
}

export type LoteFieldResolveResult = {
  lote: string;
  validade: string | null;
  parsedFromGs1: boolean;
};

export function resolveLoteFieldInput(raw: string): LoteFieldResolveResult {
  const trimmed = normalizeGs1ScannerInput(raw);
  if (!trimmed) {
    return { lote: '', validade: null, parsedFromGs1: false };
  }

  if (looksLikeGs1TraceabilityBarcode(trimmed)) {
    const parsed = parseGs1Barcode(trimmed);
    const lote = parsed.batchLot ?? '';
    return {
      lote,
      validade: resolveFabricacaoFromLoteOrGs1(lote || null, parsed),
      parsedFromGs1: true,
    };
  }

  if (canParseFabricacaoFromLote(trimmed)) {
    const digits = trimmed.replace(/\D/g, '');
    const fabricacao = parseFabricacaoFromLote(digits);
    return {
      lote: digits,
      validade: fabricacao.ok ? fabricacao.isoDate : null,
      parsedFromGs1: false,
    };
  }

  return { lote: trimmed, validade: null, parsedFromGs1: false };
}

export function parseGs1Barcode(input: string): Gs1BarcodeParseResult {
  const normalized = normalizeGs1ScannerInput(input);
  if (!normalized) {
    return {
      gtin: null,
      netWeightKg: null,
      grossWeightKg: null,
      count: null,
      batchLot: null,
      productionDateIso: null,
      expirationDateIso: null,
      bestBeforeDateIso: null,
      authorizationCode: null,
      applicationIdentifiers: {},
    };
  }

  const fromParentheses = parseParenthesesFormat(normalized);
  if (fromParentheses) {
    return buildResult(fromParentheses);
  }

  return buildResult(parseConcatenatedFormat(normalized));
}

export function extractNetWeightKgFromGs1(input: string): number | null {
  if (!looksLikeGs1WeightBarcode(input)) {
    return null;
  }

  return parseGs1Barcode(input).netWeightKg;
}

export function formatPesoFromGs1Kg(kg: number): string {
  return kg.toFixed(3).replace(/\.?0+$/, '');
}

export type Gs1NonPvarScanResult = {
  applied: boolean;
  lote: string | null;
  fabricacao: string | null;
  quantidadeCaixas: number | null;
};

export function looksLikePlainLoteInput(input: string): boolean {
  const trimmed = normalizeGs1ScannerInput(input);
  if (!trimmed || /[\(\)\u001d]/.test(trimmed)) {
    return false;
  }

  const compact = trimmed.replace(/\s/g, '');
  if (/^01\d{13,14}/.test(compact)) {
    return false;
  }

  const digits = compact.replace(/\D/g, '');
  return digits.length >= MIN_PLAIN_LOTE_DIGITS && /^\d+$/.test(compact);
}

export function applyGs1NonPvarScanInput(input: string): Gs1NonPvarScanResult {
  const trimmed = normalizeGs1ScannerInput(input);
  if (!trimmed) {
    return {
      applied: false,
      lote: null,
      fabricacao: null,
      quantidadeCaixas: null,
    };
  }

  if (!looksLikeGs1Barcode(trimmed)) {
    if (looksLikePlainLoteInput(trimmed)) {
      const resolved = resolveLoteFieldInput(trimmed);
      if (resolved.lote) {
        return {
          applied: true,
          lote: resolved.lote,
          fabricacao: resolved.validade,
          quantidadeCaixas: null,
        };
      }
    }

    if (!trimmed.includes('(')) {
      return {
        applied: false,
        lote: null,
        fabricacao: null,
        quantidadeCaixas: null,
      };
    }
  }

  const parsed = parseGs1Barcode(trimmed);
  const lote = parsed.batchLot;
  const quantidadeCaixas = parsed.count;
  const fabricacao = resolveFabricacaoFromLoteOrGs1(lote, parsed);

  if (!lote && quantidadeCaixas == null) {
    return {
      applied: false,
      lote: null,
      fabricacao: null,
      quantidadeCaixas: null,
    };
  }

  return {
    applied: true,
    lote,
    fabricacao,
    quantidadeCaixas,
  };
}

export function resolvePesoInputValue(raw: string): string {
  const trimmed = normalizeGs1ScannerInput(raw);
  if (!trimmed) {
    return '';
  }

  if (looksLikeGs1WeightBarcode(trimmed)) {
    const fromGs1 = extractNetWeightKgFromGs1(trimmed);
    if (fromGs1 != null) {
      return formatPesoFromGs1Kg(fromGs1);
    }
  }

  return trimmed.replace(',', '.');
}
