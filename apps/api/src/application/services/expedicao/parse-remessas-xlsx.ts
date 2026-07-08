import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

import type {
  RemessaInput,
  RemessaItemInput,
} from '../../../domain/repositories/expedicao/upload-lote.repository.js';
import { parseCodigoCelula, parseLote } from './parse-codigo-celula.js';

type ColumnKey =
  | 'numeroTransporte'
  | 'remessa'
  | 'empresa'
  | 'codCliente'
  | 'cliente'
  | 'cidade'
  | 'peso'
  | 'volume'
  | 'sku'
  | 'lote'
  | 'dataFabricacao'
  | 'quantidade'
  | 'unidadeMedida';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  numeroTransporte: [
    'nº transporte(dt)',
    'no transporte(dt)',
    'n transporte(dt)',
    'numero transporte(dt)',
    'numero transporte (dt)',
    'transporte(dt)',
  ],
  remessa: ['remessa', 'nf', 'numero nf', 'numero_nf', 'nº remessa'],
  empresa: ['nome empresa', 'empresa'],
  codCliente: [
    'cód. cliente',
    'cod. cliente',
    'cod cliente',
    'codcliente',
    'cod_cliente',
  ],
  cliente: ['nome cliente', 'cliente', 'destinatario', 'destinatário'],
  cidade: ['cidade'],
  peso: ['peso bruto', 'peso', 'peso liquido', 'peso líquido', 'peso_kg'],
  volume: ['volume', 'vol', 'volume m3', 'volume_m3'],
  sku: ['cod. item', 'cód. item', 'sku', 'cod sku', 'cod_sku', 'codigo sku'],
  lote: [
    'lote',
    'numero lote',
    'no lote',
    'n lote',
    'nº lote',
    'cod lote',
    'cod. lote',
    'codigo lote',
  ],
  dataFabricacao: ['dt.fabricacao', 'dt fabricacao', 'data fabricacao', 'data_fabricacao', 'fabricacao'],
  quantidade: [
    'total(unid.vda.)',
    'total (unid.vda.)',
    'quantidade',
    'qtde',
    'qty',
    'qtd',
  ],
  unidadeMedida: [
    'unid.armaz.',
    'unid armaz',
    'unidade',
    'unidade medida',
    'um',
    'un',
    'unidade_medida',
  ],
};

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
      return normalized.includes('transporte') && normalized.includes('dt');
    });

    if (index >= 0) {
      map.numeroTransporte = index;
    }
  }

  if (map.lote === undefined) {
    const index = headers.findIndex((header) => {
      const normalized = normalizeHeader(header);
      return normalized.includes('lote') && !normalized.includes('fabric');
    });

    if (index >= 0) {
      map.lote = index;
    }
  }

  return map;
}

function getCellRawValue(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number | undefined,
): unknown {
  if (colIndex === undefined) {
    return undefined;
  }

  const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
  const cell = sheet[address];

  if (!cell) {
    return undefined;
  }

  return cell.v;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseText(value: unknown): string {
  return String(value ?? '').trim();
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const match = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // yyyy-mm-dd passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  return null;
}

function buildAggregationKey(
  numeroTransporte: string,
  remessa: string,
  codCliente: string,
): string {
  return `${numeroTransporte}::${remessa}::${codCliente}`;
}

function buildItemFromRow(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  row: unknown[],
  columnMap: Partial<Record<ColumnKey, number>>,
  pesoLinha: number,
  lineNumber: number,
  errors: string[],
): RemessaItemInput | null {
  if (
    columnMap.sku === undefined ||
    columnMap.quantidade === undefined ||
    columnMap.unidadeMedida === undefined
  ) {
    return null;
  }

  const sku = parseCodigoCelula(
    getCellRawValue(sheet, rowIndex, columnMap.sku) ?? row[columnMap.sku],
  );
  const quantidade = parseNumber(row[columnMap.quantidade]);
  const unidadeMedida = parseText(row[columnMap.unidadeMedida]).toUpperCase();
  const lote =
    columnMap.lote !== undefined
      ? parseLote(
          getCellRawValue(sheet, rowIndex, columnMap.lote) ??
            row[columnMap.lote],
        )
      : null;

  const dataFabricacao =
    columnMap.dataFabricacao !== undefined
      ? parseDate(row[columnMap.dataFabricacao])
      : null;

  if (!sku && quantidade === null && !unidadeMedida) {
    return null;
  }

  if (!sku) {
    errors.push(`Linha ${lineNumber}: SKU ausente`);
    return null;
  }

  if (quantidade === null || quantidade <= 0) {
    errors.push(`Linha ${lineNumber}: quantidade inválida para SKU ${sku}`);
    return null;
  }

  if (!unidadeMedida) {
    errors.push(`Linha ${lineNumber}: unidade de medida ausente para SKU ${sku}`);
    return null;
  }

  return {
    sku,
    produtoId: null,
    lote,
    dataFabricacao,
    faixa: null,
    peso: pesoLinha,
    quantidade,
    unidadeMedida,
    quantidadeNormalizadaUnidades: 0,
  };
}

export function parseRemessasXlsx(buffer: Buffer): RemessaInput[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new BadRequestException('Arquivo sem planilhas válidas');
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new BadRequestException('Planilha vazia ou inválida');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rows.length < 2) {
    throw new BadRequestException(
      'Arquivo sem linhas de dados. Verifique o cabeçalho e o conteúdo.',
    );
  }

  const headers = rows[0] ?? [];
  const columnMap = resolveColumnMap(headers);
  const requiredColumns: ColumnKey[] = [
    'numeroTransporte',
    'remessa',
    'empresa',
    'codCliente',
    'cliente',
    'peso',
    'sku',
    'quantidade',
    'unidadeMedida',
  ];

  const missing = requiredColumns.filter((column) => columnMap[column] === undefined);

  if (missing.length > 0) {
    throw new BadRequestException(
      `Colunas obrigatórias ausentes: ${missing.join(', ')}`,
    );
  }

  const aggregated = new Map<string, RemessaInput>();
  const errors: string[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const lineNumber = index + 1;

    const numeroTransporte = stripLeadingZeros(
      parseText(row[columnMap.numeroTransporte!]),
    );
    const remessa = parseText(row[columnMap.remessa!]);
    const empresa = parseText(row[columnMap.empresa!]);
    const codCliente = stripLeadingZeros(parseText(row[columnMap.codCliente!]));
    const cliente = parseText(row[columnMap.cliente!]);
    const cidade =
      columnMap.cidade !== undefined
        ? parseText(row[columnMap.cidade])
        : 'Não informado';
    const peso = parseNumber(row[columnMap.peso!]);
    const volume =
      columnMap.volume !== undefined
        ? parseNumber(row[columnMap.volume])
        : 0;

    if (!numeroTransporte && !remessa && !empresa && !cliente) {
      continue;
    }

    if (!numeroTransporte || !remessa || !empresa || !codCliente || !cliente) {
      errors.push(`Linha ${lineNumber}: campos de identificação incompletos`);
      continue;
    }

    if (peso === null || peso < 0) {
      errors.push(`Linha ${lineNumber}: peso inválido`);
      continue;
    }

    if (volume !== null && volume < 0) {
      errors.push(`Linha ${lineNumber}: volume inválido`);
      continue;
    }

    const item = buildItemFromRow(
      sheet,
      index,
      row,
      columnMap,
      peso,
      lineNumber,
      errors,
    );

    if (!item) {
      continue;
    }

    const key = buildAggregationKey(numeroTransporte, remessa, codCliente);
    const atual = aggregated.get(key);

    if (atual) {
      atual.peso = Math.round((atual.peso + peso) * 1000) / 1000;
      atual.volume = Math.round((atual.volume + (volume ?? 0)) * 1000) / 1000;
      atual.itens.push(item);
      continue;
    }

    aggregated.set(key, {
      numeroTransporte,
      remessa,
      empresa,
      codCliente,
      cliente,
      cidade: cidade || 'Não informado',
      peso,
      volume: volume ?? 0,
      itens: [item],
    });
  }

  if (errors.length > 0) {
    throw new BadRequestException(errors.slice(0, 5).join('; '));
  }

  const remessas = [...aggregated.values()];

  if (remessas.length === 0) {
    throw new BadRequestException('Nenhuma remessa válida encontrada no arquivo');
  }

  return remessas;
}
