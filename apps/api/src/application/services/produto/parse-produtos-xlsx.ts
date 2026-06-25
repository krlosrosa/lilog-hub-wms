import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

import type { CreateProdutoInput } from '../../../domain/model/produto/produto.model.js';

export type ErroImportacaoProduto = {
  linha: number;
  sku: string;
  campo: string;
  mensagem: string;
};

export type ParseProdutosXlsxResult = {
  items: CreateProdutoInput[];
  erros: ErroImportacaoProduto[];
};

type ColumnKey =
  | 'codSku'
  | 'descricao'
  | 'shelfLife'
  | 'ean'
  | 'dum'
  | 'tipoPeso'
  | 'pesoLiqCx'
  | 'pesoLiqUn'
  | 'unCx'
  | 'cxPallet'
  | 'linha'
  | 'empresa';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  codSku: ['cod_sku', 'codsku', 'sku', 'codigo sku', 'cod sku'],
  descricao: ['descricao_sku', 'descricao sku', 'descricao', 'descricao produto'],
  shelfLife: ['shelf_life', 'shelf life', 'shelflife', 'vida util'],
  ean: ['ean'],
  dum: ['dum'],
  tipoPeso: ['tipo_peso', 'tipo peso', 'tipopeso', 'tipo'],
  pesoLiqCx: ['peso_liq(cx)', 'peso liq(cx)', 'peso liquido caixa', 'peso liq cx', 'peso_liq_cx'],
  pesoLiqUn: ['peso_liq(un)', 'peso liq(un)', 'peso liquido unidade', 'peso liq un', 'peso_liq_un'],
  unCx: ['un_cx', 'un cx', 'unidades por caixa', 'unidades_por_caixa', 'un/cx'],
  cxPallet: ['cx_pallet', 'cx pallet', 'caixas por palete', 'caixas_por_palete', 'cx/pallet'],
  linha: ['linha', 'categoria', 'linha produto'],
  empresa: ['empresa', 'nome empresa'],
};

const LINHA_TO_CATEGORIA: Record<string, CreateProdutoInput['categoria']> = {
  seca: 'seco',
  seco: 'seco',
  refr: 'refrigerado',
  refrigerado: 'refrigerado',
  queijo: 'queijo',
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

  for (const [key, aliases] of Object.entries(COLUMN_ALIASES) as [ColumnKey, string[]][]) {
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

function parseOptionalText(value: unknown): string | null {
  const text = parseText(value);
  return text.length > 0 ? text : null;
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

function parseOptionalPositiveInteger(value: unknown): number | null {
  const n = parseOptionalNumber(value);
  if (n === null) return null;
  const int = Math.round(n);
  return int > 0 ? int : null;
}

function toNumericString(value: unknown): string | null {
  const n = parseOptionalNumber(value);
  if (n === null) return null;
  return String(n);
}

function mapCategoria(raw: string): CreateProdutoInput['categoria'] | null {
  const normalized = raw.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return LINHA_TO_CATEGORIA[normalized] ?? null;
}

export function parseProdutosXlsx(buffer: Buffer): ParseProdutosXlsxResult {
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

  const requiredColumns: ColumnKey[] = ['codSku', 'descricao', 'linha', 'empresa'];
  const missing = requiredColumns.filter((col) => columnMap[col] === undefined);

  if (missing.length > 0) {
    throw new BadRequestException(
      `Colunas obrigatórias ausentes no cabeçalho: ${missing.join(', ')}. Cabeçalhos encontrados: ${(headers as unknown[]).map((h) => String(h)).join(', ')}`,
    );
  }

  const seenSkus = new Set<string>();
  const erros: ErroImportacaoProduto[] = [];
  const items: CreateProdutoInput[] = [];

  const addErro = (linha: number, sku: string, campo: string, mensagem: string) => {
    erros.push({ linha, sku, campo, mensagem });
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const lineNumber = i + 1;

    const rawSku = parseText(row[columnMap.codSku!]);
    const sku = String(rawSku).trim();

    if (!sku) continue;

    let rowValid = true;

    const descricao = parseText(row[columnMap.descricao!]);
    if (!descricao) {
      addErro(lineNumber, sku, 'Descricao_SKU', 'Descrição ausente ou vazia');
      rowValid = false;
    }

    const empresaRaw = parseText(row[columnMap.empresa!]);
    const empresaUpper = empresaRaw.toUpperCase();
    const validEmpresas: string[] = ['LDB', 'ITB', 'DPA'];

    if (!empresaRaw) {
      addErro(lineNumber, sku, 'Empresa', 'Empresa ausente');
      rowValid = false;
    } else if (!validEmpresas.includes(empresaUpper)) {
      addErro(
        lineNumber,
        sku,
        'Empresa',
        `Valor "${empresaRaw}" inválido — use LDB, ITB ou DPA`,
      );
      rowValid = false;
    }

    const linhaRaw = parseText(row[columnMap.linha!]);
    const categoria = mapCategoria(linhaRaw);

    if (!linhaRaw) {
      addErro(lineNumber, sku, 'Linha', 'Categoria (Linha) ausente');
      rowValid = false;
    } else if (!categoria) {
      addErro(
        lineNumber,
        sku,
        'Linha',
        `Valor "${linhaRaw}" inválido — use SECA, REFR ou Queijo`,
      );
      rowValid = false;
    }

    if (!rowValid) continue;

    if (seenSkus.has(sku)) {
      continue;
    }
    seenSkus.add(sku);

    const tipoRaw =
      columnMap.tipoPeso !== undefined
        ? parseText(row[columnMap.tipoPeso]).toUpperCase()
        : 'PPAD';
    const validTipos: string[] = ['PVAR', 'PPAR', 'PPAD'];
    const tipo = validTipos.includes(tipoRaw)
      ? (tipoRaw as CreateProdutoInput['tipo'])
      : ('PPAD' as CreateProdutoInput['tipo']);

    const ean =
      columnMap.ean !== undefined ? parseOptionalText(row[columnMap.ean]) : null;
    const dum =
      columnMap.dum !== undefined ? parseOptionalText(row[columnMap.dum]) : null;
    const shelfLife =
      columnMap.shelfLife !== undefined
        ? parseOptionalPositiveInteger(row[columnMap.shelfLife])
        : null;
    const pesoLiquidoUnidade =
      columnMap.pesoLiqUn !== undefined
        ? toNumericString(row[columnMap.pesoLiqUn])
        : null;
    const pesoLiquidoCaixa =
      columnMap.pesoLiqCx !== undefined
        ? toNumericString(row[columnMap.pesoLiqCx])
        : null;
    const unidadesPorCaixa =
      columnMap.unCx !== undefined
        ? parseOptionalPositiveInteger(row[columnMap.unCx])
        : null;
    const caixasPorPalete =
      columnMap.cxPallet !== undefined
        ? parseOptionalPositiveInteger(row[columnMap.cxPallet])
        : null;

    items.push({
      produtoId: sku,
      sku,
      descricao,
      empresa: empresaUpper as CreateProdutoInput['empresa'],
      categoria: categoria!,
      tipo,
      ean,
      dum,
      shelfLife,
      pesoLiquidoUnidade,
      pesoLiquidoCaixa,
      pesoLiquidoPalete: null,
      pesoBrutoUnidade: null,
      pesoBrutoCaixa: null,
      pesoBrutoPalete: null,
      unidadesPorCaixa,
      caixasPorPalete,
    });
  }

  if (items.length === 0 && erros.length === 0) {
    throw new BadRequestException('Nenhum produto encontrado no arquivo');
  }

  return { items, erros };
}
