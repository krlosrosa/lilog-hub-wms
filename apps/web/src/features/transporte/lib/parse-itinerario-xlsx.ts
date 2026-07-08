import * as XLSX from 'xlsx';

export type ItinerarioLinha = {
  remessa: string;
  itinerario: string;
};

type ColumnKey = 'remessa' | 'itinerario';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  remessa: ['remessa', 'nf', 'numero nf', 'numero_nf', 'nº remessa', 'no remessa'],
  itinerario: ['itinerario', 'itinerário', 'intinerario'],
};

export class ParseItinerarioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseItinerarioError';
  }
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

function resolveColumnMap(headers: unknown[]): Partial<Record<ColumnKey, number>> {
  const map: Partial<Record<ColumnKey, number>> = {};

  for (const [key, aliases] of Object.entries(COLUMN_ALIASES) as [
    ColumnKey,
    string[],
  ][]) {
    for (const alias of aliases) {
      const index = headers.findIndex(
        (header) => normalizeHeader(header) === alias,
      );

      if (index >= 0) {
        map[key] = index;
        break;
      }
    }
  }

  return map;
}

function parseText(value: unknown): string {
  return String(value ?? '').trim();
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new ParseItinerarioError('Falha ao ler o arquivo'));
    };

    reader.onerror = () => {
      reject(new ParseItinerarioError('Falha ao ler o arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseItinerarioXlsx(file: File): Promise<ItinerarioLinha[]> {
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ParseItinerarioError('Arquivo sem planilhas válidas');
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new ParseItinerarioError('Planilha vazia ou inválida');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rows.length < 2) {
    throw new ParseItinerarioError(
      'Arquivo sem linhas de dados. Verifique o cabeçalho e o conteúdo.',
    );
  }

  const headers = rows[0] ?? [];
  const columnMap = resolveColumnMap(headers);
  const requiredColumns: ColumnKey[] = ['remessa', 'itinerario'];
  const missing = requiredColumns.filter(
    (column) => columnMap[column] === undefined,
  );

  if (missing.length > 0) {
    throw new ParseItinerarioError(
      `Colunas obrigatórias ausentes: ${missing.join(', ')}`,
    );
  }

  const aggregated = new Map<string, ItinerarioLinha>();
  const errors: string[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const lineNumber = index + 1;

    const remessa = parseText(row[columnMap.remessa!]);
    const itinerario = parseText(row[columnMap.itinerario!]);

    if (!remessa && !itinerario) {
      continue;
    }

    if (!remessa) {
      errors.push(`Linha ${lineNumber}: remessa ausente`);
      continue;
    }

    if (!itinerario) {
      continue;
    }

    aggregated.set(remessa, { remessa, itinerario });
  }

  if (errors.length > 0) {
    throw new ParseItinerarioError(errors.slice(0, 5).join('; '));
  }

  const linhas = [...aggregated.values()];

  if (linhas.length === 0) {
    throw new ParseItinerarioError(
      'Nenhum itinerário válido encontrado no arquivo',
    );
  }

  return linhas;
}
