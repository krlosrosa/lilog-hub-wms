import * as XLSX from 'xlsx';

export type ValorizacaoDebitoLinha = {
  sku: string;
  valorPorKg: number;
};

type ColumnKey = 'sku' | 'valorPorKg';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  sku: ['material', 'sku', 'codigo', 'código', 'cod produto', 'codigo produto'],
  valorPorKg: [
    'valor p/ kg',
    'valor p/kg',
    'valor por kg',
    'valor/kg',
    'val.utiliz.livre',
    'valor utiliz livre',
  ],
};

export class ParseValorizacaoDebitoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseValorizacaoDebitoError';
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

function parseSku(value: unknown): string {
  return String(value ?? '').trim();
}

function parseValorPorKg(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value)
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new ParseValorizacaoDebitoError('Falha ao ler o arquivo'));
    };

    reader.onerror = () => {
      reject(new ParseValorizacaoDebitoError('Falha ao ler o arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseValorizacaoDebitoXlsx(
  file: File,
): Promise<Map<string, number>> {
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ParseValorizacaoDebitoError('Planilha vazia ou inválida');
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new ParseValorizacaoDebitoError('Planilha vazia ou inválida');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (rows.length < 2) {
    throw new ParseValorizacaoDebitoError(
      'A planilha deve conter cabeçalho e ao menos uma linha de dados',
    );
  }

  const headers = rows[0] ?? [];
  const columnMap = resolveColumnMap(headers);

  if (columnMap.sku == null) {
    throw new ParseValorizacaoDebitoError(
      'Coluna "Material" (SKU) não encontrada na planilha',
    );
  }

  if (columnMap.valorPorKg == null) {
    throw new ParseValorizacaoDebitoError(
      'Coluna "VALOR P/ KG" não encontrada na planilha',
    );
  }

  const mapa = new Map<string, number>();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (!Array.isArray(row)) {
      continue;
    }

    const sku = parseSku(row[columnMap.sku]);
    const valorPorKg = parseValorPorKg(row[columnMap.valorPorKg]);

    if (!sku || valorPorKg == null) {
      continue;
    }

    mapa.set(sku, valorPorKg);
  }

  if (mapa.size === 0) {
    throw new ParseValorizacaoDebitoError(
      'Nenhum SKU com valor por KG válido foi encontrado na planilha',
    );
  }

  return mapa;
}
