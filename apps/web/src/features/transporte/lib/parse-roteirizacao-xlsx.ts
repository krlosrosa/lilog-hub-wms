import * as XLSX from 'xlsx';

import type {
  NivelPrioridadeTransporte,
  TipoVeiculo,
} from '@/features/transporte/types/transporte.schema';

export type RoteirizacaoLinha = {
  numeroTransporte: string;
  placa: string;
  itinerario?: string;
  nivelPrioridade?: NivelPrioridadeTransporte;
  largada?: Date;
  cidade?: string;
  bairro?: string;
};

type ColumnKey =
  | 'numeroTransporte'
  | 'placa'
  | 'itinerario'
  | 'nivelPrioridade'
  | 'largada'
  | 'cidade'
  | 'bairro';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  numeroTransporte: [
    'transporte',
    'nº transporte',
    'no transporte',
    'n transporte',
    'numero transporte',
    'nº transporte(dt)',
    'no transporte(dt)',
    'n transporte(dt)',
    'numero transporte(dt)',
    'numero transporte (dt)',
    'transporte(dt)',
  ],
  placa: ['placa', 'identif.externo 1', 'identif externo 1', 'identificador externo 1'],
  itinerario: ['intinerario', 'itinerario'],
  nivelPrioridade: ['nivel prioridade', 'nível prioridade', 'nivel de prioridade'],
  largada: ['largada'],
  cidade: ['cidade'],
  bairro: ['bairro'],
};

export class ParseRoteirizacaoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseRoteirizacaoError';
  }
}

export function stripLeadingZeros(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const stripped = trimmed.replace(/^0+/, '');
  return stripped || '0';
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

  if (map.numeroTransporte === undefined) {
    const index = headers.findIndex((header) => {
      const normalized = normalizeHeader(header);
      return (
        normalized.includes('transporte') &&
        !normalized.includes('roteirizado')
      );
    });

    if (index >= 0) {
      map.numeroTransporte = index;
    }
  }

  return map;
}

function parseText(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizarPlaca(value: string): string {
  const raw = parseText(value).toUpperCase();
  if (!raw) {
    return '';
  }

  const semSufixoUf = raw.split('-')[0] ?? raw;
  return semSufixoUf.slice(0, 7);
}

export function mapearVeiculoRoteirizado(value: unknown): TipoVeiculo | null {
  const normalized = normalizeHeader(value)
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return null;
  }

  if (normalized.includes('bitrem')) {
    return 'Bitrem';
  }

  if (normalized.includes('carreta')) {
    return 'Carreta';
  }

  if (
    normalized.includes('3/4') ||
    normalized.includes('3 4') ||
    normalized.includes('truck')
  ) {
    return 'Truck_3_4';
  }

  if (normalized.includes('van')) {
    return 'VUC';
  }

  if (normalized.includes('toco')) {
    return 'Toco';
  }

  if (normalized.includes('vuc')) {
    return 'VUC';
  }

  return null;
}

export function mapearNivelPrioridade(
  value: unknown,
): NivelPrioridadeTransporte | undefined {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return undefined;
  }

  if (num === 1) {
    return 'urgente';
  }

  if (num === 2) {
    return 'prioritaria';
  }

  if (num === 3) {
    return 'normal';
  }

  if (num >= 4) {
    return 'baixa';
  }

  return undefined;
}

export function parseExcelSerialDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) {
    return undefined;
  }

  const ms = (num - 25569) * 86400000;
  const date = new Date(ms);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new ParseRoteirizacaoError('Falha ao ler o arquivo'));
    };

    reader.onerror = () => {
      reject(new ParseRoteirizacaoError('Falha ao ler o arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseRoteirizacaoXlsx(
  file: File,
): Promise<RoteirizacaoLinha[]> {
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ParseRoteirizacaoError('Arquivo sem planilhas válidas');
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new ParseRoteirizacaoError('Planilha vazia ou inválida');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rows.length < 2) {
    throw new ParseRoteirizacaoError(
      'Arquivo sem linhas de dados. Verifique o cabeçalho e o conteúdo.',
    );
  }

  const headers = rows[0] ?? [];
  const columnMap = resolveColumnMap(headers);
  const requiredColumns: ColumnKey[] = ['numeroTransporte', 'placa'];
  const missing = requiredColumns.filter(
    (column) => columnMap[column] === undefined,
  );

  if (missing.length > 0) {
    throw new ParseRoteirizacaoError(
      `Colunas obrigatórias ausentes: ${missing.join(', ')}`,
    );
  }

  const aggregated = new Map<string, RoteirizacaoLinha>();
  const errors: string[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const lineNumber = index + 1;

    const numeroTransporte = stripLeadingZeros(
      parseText(row[columnMap.numeroTransporte!]),
    );
    const placa = normalizarPlaca(parseText(row[columnMap.placa!]));
    const itinerario =
      columnMap.itinerario !== undefined
        ? parseText(row[columnMap.itinerario]) || undefined
        : undefined;
    const nivelPrioridade =
      columnMap.nivelPrioridade !== undefined
        ? mapearNivelPrioridade(row[columnMap.nivelPrioridade])
        : undefined;
    const largada =
      columnMap.largada !== undefined
        ? parseExcelSerialDate(row[columnMap.largada])
        : undefined;
    const cidade =
      columnMap.cidade !== undefined
        ? parseText(row[columnMap.cidade]) || undefined
        : undefined;
    const bairro =
      columnMap.bairro !== undefined
        ? parseText(row[columnMap.bairro]) || undefined
        : undefined;

    if (!numeroTransporte && !placa) {
      continue;
    }

    if (!numeroTransporte) {
      errors.push(`Linha ${lineNumber}: Transporte ausente`);
      continue;
    }

    if (!placa) {
      errors.push(`Linha ${lineNumber}: placa ausente`);
      continue;
    }

    if (!aggregated.has(numeroTransporte)) {
      aggregated.set(numeroTransporte, {
        numeroTransporte,
        placa,
        ...(itinerario ? { itinerario } : {}),
        ...(nivelPrioridade ? { nivelPrioridade } : {}),
        ...(largada ? { largada } : {}),
        ...(cidade ? { cidade } : {}),
        ...(bairro ? { bairro } : {}),
      });
    }
  }

  if (errors.length > 0) {
    throw new ParseRoteirizacaoError(errors.slice(0, 5).join('; '));
  }

  const linhas = [...aggregated.values()];

  if (linhas.length === 0) {
    throw new ParseRoteirizacaoError(
      'Nenhuma alocação válida encontrada no arquivo',
    );
  }

  return linhas;
}
