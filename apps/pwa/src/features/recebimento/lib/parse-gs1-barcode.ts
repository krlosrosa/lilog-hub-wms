import { parseFabricacaoFromLote } from './parse-fabricacao-from-lote';

export type Gs1BarcodeParseResult = {
  gtin: string | null;
  netWeightKg: number | null;
  grossWeightKg: number | null;
  count: number | null;
  batchLot: string | null;
  productionDateIso: string | null;
  bestBeforeDateIso: string | null;
  authorizationCode: string | null;
  applicationIdentifiers: Record<string, string>;
};

const FNC1 = '\u001d';

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
    result[match[1]] = match[2].trim();
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
    if (/^(11|15|10|01|02|00|30)\d/.test(remainder) || /^7030/.test(remainder)) {
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

function parseConcatenatedFormat(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const normalized = input.split(FNC1).join('');
  let index = 0;

  while (index < normalized.length) {
    const ai4 = normalized.slice(index, index + 4);
    if (isNetWeightAi(ai4) || isGrossWeightAi(ai4)) {
      result[ai4] = normalized.slice(index + 4, index + 10);
      index += 10;
      continue;
    }

    if (ai4 === '7030') {
      const field = readVariableLengthField(normalized, index + 4, 20);
      result[ai4] = field.value;
      index = field.nextIndex;
      continue;
    }

    const ai2 = normalized.slice(index, index + 2);

    if (ai2 === '01') {
      result[ai2] = normalized.slice(index + 2, index + 16);
      index += 16;
      continue;
    }

    if (ai2 === '00') {
      result[ai2] = normalized.slice(index + 2, index + 20);
      index += 20;
      continue;
    }

    if (ai2 === '02') {
      result[ai2] = normalized.slice(index + 2, index + 16);
      index += 16;
      continue;
    }

    if (ai2 === '11' || ai2 === '15') {
      result[ai2] = normalized.slice(index + 2, index + 8);
      index += 8;
      continue;
    }

    if (ai2 === '10') {
      const field = readVariableLengthField(normalized, index + 2, 20);
      result[ai2] = field.value;
      index = field.nextIndex;
      continue;
    }

    if (ai2 === '30') {
      let end = index + 2;
      while (end < normalized.length && end - index - 2 < 8 && /\d/.test(normalized[end] ?? '')) {
        end += 1;
      }
      result[ai2] = normalized.slice(index + 2, end);
      index = end;
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
  const countRaw = applicationIdentifiers['30'];
  const count = countRaw ? Number(countRaw.replace(/\D/g, '')) : null;
  const batchLot = applicationIdentifiers['10']?.trim() || null;
  const productionDateIso = applicationIdentifiers['11']
    ? parseGs1DateYyMmDd(applicationIdentifiers['11'])
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
    bestBeforeDateIso,
    authorizationCode,
    applicationIdentifiers,
  };
}

export function looksLikeGs1TraceabilityBarcode(input: string): boolean {
  const normalized = input.trim();
  if (normalized.length < 12) {
    return false;
  }

  if (/\((?:10|11|15|7030)\)/.test(normalized)) {
    return true;
  }

  if (normalized.includes(FNC1) && /(?:^|\u001d)(?:10|11|15|7030)/.test(normalized)) {
    return true;
  }

  const compact = normalized.replace(/\s/g, '');
  return /(?:^|\d)(?:11|15)\d{6}/.test(compact) && /10\d/.test(compact);
}

export function looksLikeGs1WeightBarcode(input: string): boolean {
  const normalized = input.trim();
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

export function applyGs1BarcodeInput(input: string): Gs1BarcodeApplyResult {
  const trimmed = input.trim();
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
  const validade = parsed.productionDateIso ?? parsed.bestBeforeDateIso ?? null;
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
    etiqueta: hasGtin ? parsed.gtin : null,
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
  const trimmed = raw.trim();
  if (!trimmed) {
    return { lote: '', validade: null, parsedFromGs1: false };
  }

  if (looksLikeGs1TraceabilityBarcode(trimmed)) {
    const parsed = parseGs1Barcode(trimmed);
    return {
      lote: parsed.batchLot ?? '',
      validade: parsed.productionDateIso ?? parsed.bestBeforeDateIso ?? null,
      parsedFromGs1: true,
    };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length > 10) {
    const fabricacao = parseFabricacaoFromLote(digits);
    return {
      lote: digits,
      validade: fabricacao.ok ? fabricacao.isoDate : null,
      parsedFromGs1: false,
    };
  }

  return { lote: digits, validade: null, parsedFromGs1: false };
}

export function parseGs1Barcode(input: string): Gs1BarcodeParseResult {
  const normalized = input.trim();
  if (!normalized) {
    return {
      gtin: null,
      netWeightKg: null,
      grossWeightKg: null,
      count: null,
      batchLot: null,
      productionDateIso: null,
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

export function resolvePesoInputValue(raw: string): string {
  const trimmed = raw.trim();
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
