export type FabricacaoFromLoteResult =
  | {
      ok: true;
      day: number;
      month: number;
      year: number;
      /** DD/MM/YYYY para exibição */
      display: string;
      /** YYYY-MM-DD para input type="date" */
      isoDate: string;
    }
  | {
      ok: false;
      error: string;
    };

const MIN_LOTE_DIGITS = 10;
const MAX_FABRICACAO_AGE_YEARS = 3;

export type ParseFabricacaoFromLoteOptions = {
  /** Data de referência para validar intervalo (padrão: hoje). */
  referenceDate?: Date;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function validateFabricacaoRange(
  day: number,
  month: number,
  year: number,
  referenceDate: Date,
): string | null {
  const fabricacao = startOfDay(new Date(year, month - 1, day));
  const today = startOfDay(referenceDate);
  const minDate = new Date(today);
  minDate.setFullYear(minDate.getFullYear() - MAX_FABRICACAO_AGE_YEARS);

  if (fabricacao.getTime() > today.getTime()) {
    return 'Fabricação não pode ser posterior à data atual';
  }

  if (fabricacao.getTime() < minDate.getTime()) {
    return 'Fabricação não pode ser anterior a 3 anos da data atual';
  }

  return null;
}

/**
 * Extrai a data de fabricação dos 6 últimos dígitos do lote (ignorando os 4 primeiros).
 * Formato: AAMMDD lido da direita para a esquerda → DD/MM/20AA.
 *
 * Ex.: 4001251010 → 251010 → fabricação 10/10/2025
 */
export function parseFabricacaoFromLote(
  lote: string,
  options?: ParseFabricacaoFromLoteOptions,
): FabricacaoFromLoteResult {
  const referenceDate = options?.referenceDate ?? new Date();
  const digits = lote.replace(/\D/g, '');

  if (digits.length < MIN_LOTE_DIGITS) {
    return {
      ok: false,
      error: `Lote deve ter ao menos ${MIN_LOTE_DIGITS} dígitos para extrair a fabricação`,
    };
  }

  const datePart = digits.slice(-6);

  if (!/^\d{6}$/.test(datePart)) {
    return {
      ok: false,
      error: 'Formato de lote inválido para extrair a fabricação',
    };
  }

  const year2 = Number(datePart.slice(0, 2));
  const month = Number(datePart.slice(2, 4));
  const day = Number(datePart.slice(4, 6));
  const year = 2000 + year2;

  if (!isValidCalendarDate(day, month, year)) {
    return {
      ok: false,
      error: 'Formato de lote inválido para extrair a fabricação',
    };
  }

  const rangeError = validateFabricacaoRange(day, month, year, referenceDate);
  if (rangeError) {
    return {
      ok: false,
      error: rangeError,
    };
  }

  return {
    ok: true,
    day,
    month,
    year,
    display: `${pad2(day)}/${pad2(month)}/${year}`,
    isoDate: `${year}-${pad2(month)}-${pad2(day)}`,
  };
}

export function canParseFabricacaoFromLote(lote: string): boolean {
  return lote.replace(/\D/g, '').length >= MIN_LOTE_DIGITS;
}
