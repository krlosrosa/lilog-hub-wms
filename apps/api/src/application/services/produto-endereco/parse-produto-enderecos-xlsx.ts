import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

import {
  ProdutoEnderecoPapelSchema,
  type ProdutoEnderecoPapel,
} from '../../../domain/model/produto-endereco/produto-endereco.model.js';

export type ErroImportacaoProdutoEndereco = {
  linha: number;
  endereco: string;
  sku: string;
  campo: string;
  mensagem: string;
};

export type ProdutoEnderecoImportRow = {
  linha: number;
  centroId: string;
  enderecoMascarado: string;
  sku: string;
  produtoId: string;
  papel: ProdutoEnderecoPapel;
  ordem: number;
  ativo: boolean;
};

export type ParseProdutoEnderecosXlsxResult = {
  items: ProdutoEnderecoImportRow[];
  erros: ErroImportacaoProdutoEndereco[];
};

type ColumnKey =
  | 'centroId'
  | 'endereco'
  | 'sku'
  | 'produtoId'
  | 'papel'
  | 'ordem'
  | 'ativo';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  centroId: ['centro id', 'centro_id', 'centroid'],
  endereco: ['endereco', 'endereço', 'endereco mascarado', 'endereço mascarado'],
  sku: ['sku', 'cod_sku', 'cod sku'],
  produtoId: ['produto id', 'produto_id', 'produtoid', 'codigo produto'],
  papel: ['papel', 'tipo alocacao', 'tipo alocação'],
  ordem: ['ordem', 'sequencia', 'sequência', 'posicao', 'posição'],
  ativo: ['ativo', 'status', 'habilitado'],
};

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

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? '').trim().replace(',', '.');
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAtivo(value: unknown): boolean | null {
  const raw = parseText(value).toLowerCase();

  if (!raw) return null;

  if (['sim', 's', 'true', '1', 'ativo', 'yes', 'y'].includes(raw)) {
    return true;
  }

  if (['nao', 'não', 'n', 'false', '0', 'inativo', 'no'].includes(raw)) {
    return false;
  }

  return null;
}

function parsePapel(value: unknown): ProdutoEnderecoPapel | null {
  const raw = parseText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_');

  if (!raw) return null;

  const aliases: Record<string, ProdutoEnderecoPapel> = {
    picking_primario: 'picking_primario',
    picking_primaria: 'picking_primario',
    primario: 'picking_primario',
    primaria: 'picking_primario',
    picking_secundario: 'picking_secundario',
    picking_secundaria: 'picking_secundario',
    secundario: 'picking_secundario',
    secundaria: 'picking_secundario',
    pulmao: 'pulmao',
    pulmão: 'pulmao',
  };

  const mapped = aliases[raw];
  if (mapped) return mapped;

  const parsed = ProdutoEnderecoPapelSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function parseProdutoEnderecosXlsx(
  buffer: Buffer,
): ParseProdutoEnderecosXlsxResult {
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

  const requiredColumns: ColumnKey[] = ['centroId', 'endereco'];
  const missing = requiredColumns.filter((col) => columnMap[col] === undefined);

  if (missing.length > 0) {
    throw new BadRequestException(
      `Colunas obrigatórias ausentes no cabeçalho: ${missing.join(', ')}. Cabeçalhos encontrados: ${(headers as unknown[]).map((header) => String(header)).join(', ')}`,
    );
  }

  const erros: ErroImportacaoProdutoEndereco[] = [];
  const items: ProdutoEnderecoImportRow[] = [];

  const addErro = (
    linha: number,
    endereco: string,
    sku: string,
    campo: string,
    mensagem: string,
  ) => {
    erros.push({ linha, endereco, sku, campo, mensagem });
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const lineNumber = i + 1;

    const enderecoMascarado = parseText(row[columnMap.endereco!]).toUpperCase();
    const sku = parseText(columnMap.sku !== undefined ? row[columnMap.sku] : '');
    const produtoId = parseText(
      columnMap.produtoId !== undefined ? row[columnMap.produtoId] : '',
    );

    if (!enderecoMascarado && !sku && !produtoId) {
      continue;
    }

    if (!enderecoMascarado) {
      addErro(
        lineNumber,
        enderecoMascarado,
        sku,
        'Endereço',
        'Endereço ausente ou vazio',
      );
      continue;
    }

    if (!sku && !produtoId) {
      continue;
    }

    const centroId = parseText(row[columnMap.centroId!]);
    if (!centroId) {
      addErro(
        lineNumber,
        enderecoMascarado,
        sku,
        'Centro ID',
        'Centro ID ausente ou vazio',
      );
      continue;
    }

    const papelRaw =
      columnMap.papel !== undefined ? row[columnMap.papel] : undefined;
    const papel = parsePapel(papelRaw);

    if (parseText(papelRaw) && !papel) {
      addErro(
        lineNumber,
        enderecoMascarado,
        sku,
        'Papel',
        `Valor "${parseText(papelRaw)}" inválido — use picking_primario, picking_secundario ou pulmao`,
      );
      continue;
    }

    const ordemRaw =
      columnMap.ordem !== undefined ? row[columnMap.ordem] : undefined;
    const ordemParsed = parseOptionalNumber(ordemRaw);
    const ordem =
      ordemParsed !== null ? Math.round(ordemParsed) : ordemRaw === undefined || parseText(ordemRaw) === '' ? 1 : null;

    if (ordem === null || ordem < 1 || ordem > 32767) {
      addErro(
        lineNumber,
        enderecoMascarado,
        sku,
        'Ordem',
        'Ordem inválida — informe um número inteiro entre 1 e 32767',
      );
      continue;
    }

    const ativoRaw =
      columnMap.ativo !== undefined ? row[columnMap.ativo] : undefined;
    const ativo = parseAtivo(ativoRaw);

    if (parseText(ativoRaw) && ativo === null) {
      addErro(
        lineNumber,
        enderecoMascarado,
        sku,
        'Ativo',
        `Valor "${parseText(ativoRaw)}" inválido — use SIM ou NÃO`,
      );
      continue;
    }

    items.push({
      linha: lineNumber,
      centroId,
      enderecoMascarado,
      sku,
      produtoId,
      papel: papel ?? 'picking_primario',
      ordem,
      ativo: ativo ?? true,
    });
  }

  if (items.length === 0 && erros.length === 0) {
    throw new BadRequestException(
      'Nenhuma linha com SKU ou Produto ID encontrada no arquivo',
    );
  }

  return { items, erros };
}
