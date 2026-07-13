import * as XLSX from 'xlsx';

import type {
  ItemPreRecebimentoFormValues,
  NotaFiscalPreRecebimentoFormValues,
} from '@/features/recebimento/types/recebimento-cadastro.schema';

type ColumnKey =
  | 'sku'
  | 'produtoDescricao'
  | 'quantidade'
  | 'unidadeMedida'
  | 'lote'
  | 'peso'
  | 'validade'
  | 'numeroNf'
  | 'serie'
  | 'chaveAcesso'
  | 'numeroRemessa'
  | 'fornecedorNome'
  | 'placa'
  | 'transportadoraNome'
  | 'numeroOcr'
  | 'numeroTransporte'
  | 'centroOrigem'
  | 'dataAgendada';

const UNIDADE_CAIXA = 'CX';
const HORARIO_PREVISAO_PADRAO = '08:00';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  sku: [
    'sku',
    'material',
    'cod item',
    'cod. item',
    'cód. item',
    'codigo item',
    'cod produto',
    'produto',
  ],
  produtoDescricao: [
    'texto breve material',
    'descricao material',
    'descricao produto',
    'descricao',
  ],
  quantidade: [
    'qntd fornecida',
    'qntd. fornecida',
    'quantidade',
    'quantidade fornecida',
    'qtd',
    'qtde',
    'qty',
    'total(unid.vda.)',
    'total (unid.vda.)',
  ],
  unidadeMedida: [
    'unidade',
    'unidade medida',
    'unid.armaz.',
    'unid armaz',
    'caixa',
    'cx',
    'um',
    'un',
  ],
  lote: ['lote', 'numero lote', 'no lote', 'n lote', 'cod lote'],
  peso: ['peso', 'peso bruto', 'peso liquido', 'peso líquido', 'peso_kg'],
  validade: ['validade', 'validade esperada', 'dt validade', 'data validade'],
  numeroNf: [
    'nfe',
    'nf',
    'numero nf',
    'nº nf',
    'no nf',
    'nota fiscal',
    'numero_nf',
  ],
  serie: ['serie', 'série', 'nf serie'],
  chaveAcesso: ['chave acesso', 'chave nf', 'chave_acesso', 'chave de acesso'],
  numeroRemessa: ['remessa', 'numero remessa', 'nº remessa', 'no remessa'],
  fornecedorNome: [
    'fornecedor',
    'nome fornecedor',
    'nome 1',
    'emitente',
    'centro fornecedor',
  ],
  placa: ['placa', 'placa veiculo', 'placa veículo'],
  transportadoraNome: [
    'nome do transportador',
    'transportador',
    'transportadora',
    'nome transportadora',
  ],
  numeroOcr: [
    'ocr - no',
    'ocr no',
    'ocr',
    'numero ocr',
    'nº ocr',
    'no ocr',
    'documento ocr',
  ],
  numeroTransporte: [
    'no transporte',
    'n transporte',
    'numero transporte',
    'nº transporte',
    'transporte',
    'n transporte(dt)',
    'numero transporte(dt)',
  ],
  centroOrigem: [
    'centro origem',
    'centro de origem',
    'cd. origem',
    'cd origem',
    'origem',
  ],
  dataAgendada: [
    'data agendada',
    'dt agendada',
    'data prevista',
    'previsao chegada',
    'previsao de chegada',
  ],
};

export type RecebimentoXlsxCabecalho = {
  transportadoraNome?: string;
  placa?: string;
  numeroOcr?: string;
  numeroTransporte?: string;
  centroOrigem?: string;
  horarioPrevisto?: string;
};

export type RecebimentoXlsxDemanda = {
  cabecalho: RecebimentoXlsxCabecalho;
  itens: ItemPreRecebimentoFormValues[];
  notasFiscais: NotaFiscalPreRecebimentoFormValues[];
};

export type RecebimentoXlsxResult = {
  demandas: RecebimentoXlsxDemanda[];
  erros: string[];
};

export class ParseRecebimentoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseRecebimentoError';
  }
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[º°]/g, 'o')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveDefaultUnidadeMedida(
  headers: unknown[],
  columnMap: Partial<Record<ColumnKey, number>>,
): string {
  const quantidadeIndex = columnMap.quantidade;
  if (quantidadeIndex === undefined) {
    return 'UN';
  }

  const quantidadeHeader = normalizeHeader(headers[quantidadeIndex]);
  if (
    quantidadeHeader === 'qntd fornecida' ||
    quantidadeHeader.includes('qntd fornecida') ||
    quantidadeHeader.includes('quantidade fornecida')
  ) {
    return UNIDADE_CAIXA;
  }

  return 'UN';
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
        !normalized.includes('transportador') &&
        !normalized.includes('tipo')
      );
    });

    if (index >= 0) {
      map.numeroTransporte = index;
    }
  }

  if (map.numeroOcr === undefined) {
    const index = headers.findIndex((header) => {
      const normalized = normalizeHeader(header);
      return normalized.includes('ocr') && !normalized.includes('criacao');
    });

    if (index >= 0) {
      map.numeroOcr = index;
    }
  }

  return map;
}

function parseText(value: unknown): string {
  return String(value ?? '').trim();
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

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseDataAgendada(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${HORARIO_PREVISAO_PADRAO}`;
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return undefined;
  }

  const matchDmy = raw.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (matchDmy) {
    return `${matchDmy[3]}-${matchDmy[2]}-${matchDmy[1]}T${HORARIO_PREVISAO_PADRAO}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${HORARIO_PREVISAO_PADRAO}`;
  }

  return undefined;
}

function parseDateInput(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return undefined;
  }

  const match = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}T00:00`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  return undefined;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new ParseRecebimentoError('Falha ao ler o arquivo'));
    };

    reader.onerror = () => {
      reject(new ParseRecebimentoError('Falha ao ler o arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function extractRowCabecalho(
  row: unknown[],
  columnMap: Partial<Record<ColumnKey, number>>,
): RecebimentoXlsxCabecalho {
  const readText = (key: ColumnKey): string | undefined => {
    const index = columnMap[key];
    if (index === undefined) {
      return undefined;
    }

    const value = parseText(row[index]);
    return value || undefined;
  };

  const horarioIndex = columnMap.dataAgendada;
  const horarioPrevisto =
    horarioIndex !== undefined
      ? parseDataAgendada(row[horarioIndex])
      : undefined;

  return {
    transportadoraNome: readText('transportadoraNome'),
    placa: readText('placa')?.toUpperCase(),
    numeroOcr: readText('numeroOcr'),
    numeroTransporte: readText('numeroTransporte'),
    centroOrigem: readText('centroOrigem'),
    horarioPrevisto,
  };
}

type DemandaAccumulator = {
  cabecalho: RecebimentoXlsxCabecalho;
  itens: ItemPreRecebimentoFormValues[];
  notasMap: Map<string, NotaFiscalPreRecebimentoFormValues>;
};

export async function parseRecebimentoXlsx(
  file: File,
): Promise<RecebimentoXlsxResult> {
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ParseRecebimentoError('Arquivo sem planilhas válidas');
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new ParseRecebimentoError('Planilha vazia ou inválida');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rows.length < 2) {
    throw new ParseRecebimentoError(
      'Arquivo sem linhas de dados. Verifique o cabeçalho e o conteúdo.',
    );
  }

  const headers = rows[0] ?? [];
  const columnMap = resolveColumnMap(headers);
  const defaultUnidadeMedida = resolveDefaultUnidadeMedida(headers, columnMap);

  if (columnMap.sku === undefined) {
    throw new ParseRecebimentoError(
      'Coluna de SKU/produto não encontrada na planilha',
    );
  }

  if (columnMap.quantidade === undefined) {
    throw new ParseRecebimentoError(
      'Coluna de quantidade não encontrada na planilha',
    );
  }

  if (columnMap.numeroOcr === undefined) {
    throw new ParseRecebimentoError(
      'Coluna OCR não encontrada na planilha. Cada OCR representa uma demanda (veículo).',
    );
  }

  const erros: string[] = [];
  const demandasMap = new Map<string, DemandaAccumulator>();

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const lineNumber = index + 1;

    const sku = parseText(row[columnMap.sku!]);
    const quantidade = parseNumber(row[columnMap.quantidade!]);
    const numeroOcr = parseText(row[columnMap.numeroOcr!]);
    const unidadeMedida =
      columnMap.unidadeMedida !== undefined
        ? parseText(row[columnMap.unidadeMedida]).toUpperCase() ||
          defaultUnidadeMedida
        : defaultUnidadeMedida;

    const produtoDescricao =
      columnMap.produtoDescricao !== undefined
        ? parseText(row[columnMap.produtoDescricao])
        : '';

    if (!sku && !quantidade && !numeroOcr) {
      continue;
    }

    if (!numeroOcr) {
      erros.push(`Linha ${lineNumber}: OCR ausente — cada linha deve ter OCR para agrupar a demanda`);
      continue;
    }

    if (!sku) {
      erros.push(`Linha ${lineNumber}: SKU/produto ausente (OCR ${numeroOcr})`);
      continue;
    }

    if (quantidade === null) {
      erros.push(
        `Linha ${lineNumber}: quantidade inválida para SKU ${sku} (OCR ${numeroOcr})`,
      );
      continue;
    }

    let demanda = demandasMap.get(numeroOcr);
    if (!demanda) {
      demanda = {
        cabecalho: {
          ...extractRowCabecalho(row, columnMap),
          numeroOcr,
        },
        itens: [],
        notasMap: new Map(),
      };
      demandasMap.set(numeroOcr, demanda);
    }

    demanda.itens.push({
      produtoId: sku,
      produtoLabel: produtoDescricao || sku,
      quantidadeEsperada: quantidade,
      unidadeMedida: unidadeMedida || defaultUnidadeMedida,
      loteEsperado:
        columnMap.lote !== undefined
          ? parseText(row[columnMap.lote]) || undefined
          : undefined,
      pesoEsperado:
        columnMap.peso !== undefined
          ? parseNumber(row[columnMap.peso])?.toString()
          : undefined,
      validadeEsperada:
        columnMap.validade !== undefined
          ? parseDateInput(row[columnMap.validade])
          : undefined,
    });

    if (columnMap.numeroNf !== undefined) {
      const numeroNf = parseText(row[columnMap.numeroNf]);
      if (numeroNf && !demanda.notasMap.has(numeroNf)) {
        demanda.notasMap.set(numeroNf, {
          numeroNf,
          serie:
            columnMap.serie !== undefined
              ? parseText(row[columnMap.serie]) || undefined
              : undefined,
          chaveAcesso:
            columnMap.chaveAcesso !== undefined
              ? parseText(row[columnMap.chaveAcesso]) || undefined
              : undefined,
          numeroRemessa:
            columnMap.numeroRemessa !== undefined
              ? parseText(row[columnMap.numeroRemessa]) || undefined
              : undefined,
          fornecedorNome:
            columnMap.fornecedorNome !== undefined
              ? parseText(row[columnMap.fornecedorNome]) || undefined
              : undefined,
        });
      }
    }
  }

  const demandas: RecebimentoXlsxDemanda[] = [...demandasMap.values()].map(
    (demanda) => ({
      cabecalho: demanda.cabecalho,
      itens: demanda.itens,
      notasFiscais: [...demanda.notasMap.values()],
    }),
  );

  if (demandas.length === 0 && erros.length === 0) {
    throw new ParseRecebimentoError(
      'Nenhuma demanda válida encontrada na planilha',
    );
  }

  return {
    demandas,
    erros,
  };
}
