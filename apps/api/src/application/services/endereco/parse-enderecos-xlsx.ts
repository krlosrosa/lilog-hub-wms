import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { z } from 'zod';

import {
  CreateEnderecoBodySchema,
  CurvaAbcEnderecoSchema,
  EnderecoTipoEstruturaSchema,
  EnderecoTipoSchema,
  buildEnderecoCodigo,
  type EnderecoTipo,
  type EnderecoTipoEstrutura,
} from '../../../domain/model/endereco/endereco.model.js';

export type ErroImportacaoEndereco = {
  linha: number;
  codigo: string;
  campo: string;
  mensagem: string;
};

export type EnderecoImportRow = z.infer<typeof CreateEnderecoBodySchema> & {
  linha: number;
};

export type ParseEnderecosXlsxResult = {
  items: EnderecoImportRow[];
  erros: ErroImportacaoEndereco[];
};

type ColumnKey =
  | 'zona'
  | 'rua'
  | 'posicao'
  | 'nivel'
  | 'tipo'
  | 'tipoEstrutura'
  | 'larguraMm'
  | 'alturaMm'
  | 'profundidadeMm'
  | 'cargaMaxKg'
  | 'capacidadeVolume'
  | 'prioridadePicking'
  | 'coordenadaX'
  | 'coordenadaY'
  | 'coordenadaZ'
  | 'curvaAbc'
  | 'vinculoSkuFixo'
  | 'regraLoteUnico'
  | 'permiteMisturaValidade'
  | 'permiteFracionado'
  | 'observacao';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  zona: ['zona'],
  rua: ['rua'],
  posicao: ['posicao', 'posição'],
  nivel: ['nivel', 'nível'],
  tipo: ['tipo'],
  tipoEstrutura: ['tipo estrutura', 'tipo_estrutura', 'estrutura'],
  larguraMm: ['largura mm', 'largura_mm', 'largura'],
  alturaMm: ['altura mm', 'altura_mm', 'altura'],
  profundidadeMm: ['profundidade mm', 'profundidade_mm', 'profundidade'],
  cargaMaxKg: ['carga max kg', 'carga_max_kg', 'carga max', 'peso max', 'carga'],
  capacidadeVolume: ['capacidade volume', 'capacidade_volume', 'volume'],
  prioridadePicking: ['prioridade picking', 'prioridade_picking', 'prioridade'],
  coordenadaX: ['coordenada x', 'coordenada_x', 'coord x'],
  coordenadaY: ['coordenada y', 'coordenada_y', 'coord y'],
  coordenadaZ: ['coordenada z', 'coordenada_z', 'coord z'],
  curvaAbc: ['curva abc', 'curva_abc', 'curva', 'abc'],
  vinculoSkuFixo: ['vinculo sku fixo', 'vinculo_sku_fixo', 'sku fixo'],
  regraLoteUnico: ['regra lote unico', 'regra_lote_unico', 'lote unico', 'lote único'],
  permiteMisturaValidade: [
    'permite mistura validade',
    'permite_mistura_validade',
    'mistura validade',
  ],
  permiteFracionado: ['permite fracionado', 'permite_fracionado', 'fracionado'],
  observacao: ['observacao', 'observação', 'obs'],
};

const TIPO_VALUES = EnderecoTipoSchema.options.join(', ');
const TIPO_ESTRUTURA_VALUES = EnderecoTipoEstruturaSchema.options.join(', ');
const CURVA_ABC_VALUES = CurvaAbcEnderecoSchema.options.join(', ');

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

function parseRequiredPositiveNumber(
  value: unknown,
): { value: number | null; invalid: boolean } {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) {
    return { value: null, invalid: parseText(value) !== '' };
  }

  if (parsed <= 0) {
    return { value: null, invalid: true };
  }

  return { value: parsed, invalid: false };
}

function parseRequiredPositiveInteger(
  value: unknown,
): { value: number | null; invalid: boolean } {
  const parsed = parseRequiredPositiveNumber(value);
  if (parsed.invalid || parsed.value === null) {
    return parsed;
  }

  if (!Number.isInteger(parsed.value)) {
    return { value: null, invalid: true };
  }

  return parsed;
}

function parseBoolean(value: unknown): boolean | null {
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

function parseEnumValue<T extends string>(
  value: unknown,
  schema: z.ZodType<T>,
  aliases: Record<string, T>,
): T | null {
  const raw = parseText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_');

  if (!raw) return null;

  const mapped = aliases[raw];
  if (mapped) return mapped;

  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function parseTipo(value: unknown): EnderecoTipo | null {
  return parseEnumValue(value, EnderecoTipoSchema, {
    picking: 'picking',
    pulmao: 'pulmao',
    pulmão: 'pulmao',
    aereo: 'aereo',
    aéreo: 'aereo',
    recebimento: 'recebimento',
    expedicao: 'expedicao',
    expedição: 'expedicao',
    avaria: 'avaria',
    inventario: 'inventario',
    inventário: 'inventario',
    cross_docking: 'cross_docking',
    cross_dock: 'cross_docking',
    crossdock: 'cross_docking',
    area_operacional: 'area_operacional',
    area_operacional_: 'area_operacional',
    operacional: 'area_operacional',
  });
}

function parseTipoEstrutura(value: unknown): EnderecoTipoEstrutura | null {
  return parseEnumValue(value, EnderecoTipoEstruturaSchema, {
    'porta-palete': 'porta-palete',
    porta_palete: 'porta-palete',
    portapalete: 'porta-palete',
    'drive-in': 'drive-in',
    drive_in: 'drive-in',
    drivein: 'drive-in',
    'estante-dinamica': 'estante-dinamica',
    estante_dinamica: 'estante-dinamica',
    'flow-rack': 'flow-rack',
    flow_rack: 'flow-rack',
    piso: 'piso',
    staging: 'staging',
    'area-delimitada': 'area-delimitada',
    area_delimitada: 'area-delimitada',
    patio: 'patio',
    pátio: 'patio',
  });
}

function parseCurvaAbc(value: unknown) {
  const raw = parseText(value).toUpperCase();
  if (!raw) return null;

  const parsed = CurvaAbcEnderecoSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function getCell(row: unknown[], columnMap: Partial<Record<ColumnKey, number>>, key: ColumnKey) {
  const index = columnMap[key];
  return index === undefined ? undefined : row[index];
}

function isRowEmpty(row: unknown[]) {
  return row.every((cell) => parseText(cell) === '');
}

export function parseEnderecosXlsx(
  buffer: Buffer,
  unidadeId: string,
): ParseEnderecosXlsxResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName =
    workbook.SheetNames.find((name) => normalizeHeader(name) === 'dados') ??
    workbook.SheetNames[0];

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
    'zona',
    'tipo',
    'tipoEstrutura',
    'larguraMm',
    'alturaMm',
    'profundidadeMm',
    'cargaMaxKg',
  ];
  const missing = requiredColumns.filter((col) => columnMap[col] === undefined);

  if (missing.length > 0) {
    throw new BadRequestException(
      `Colunas obrigatórias ausentes no cabeçalho: ${missing.join(', ')}. Cabeçalhos encontrados: ${(headers as unknown[]).map((header) => String(header)).join(', ')}`,
    );
  }

  const erros: ErroImportacaoEndereco[] = [];
  const items: EnderecoImportRow[] = [];

  const addErro = (
    linha: number,
    codigo: string,
    campo: string,
    mensagem: string,
  ) => {
    erros.push({ linha, codigo, campo, mensagem });
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const lineNumber = i + 1;

    if (isRowEmpty(row)) {
      continue;
    }

    const zona = parseText(getCell(row, columnMap, 'zona'));
    const rua = parseText(getCell(row, columnMap, 'rua'));
    const posicao = parseText(getCell(row, columnMap, 'posicao'));
    const nivel = parseText(getCell(row, columnMap, 'nivel'));
    const codigoPreview = buildEnderecoCodigo(zona, rua, posicao, nivel);

    if (!zona) {
      addErro(lineNumber, codigoPreview, 'zona', 'Zona ausente ou vazia');
      continue;
    }

    const tipoRaw = getCell(row, columnMap, 'tipo');
    const tipo = parseTipo(tipoRaw);
    if (parseText(tipoRaw) && !tipo) {
      addErro(
        lineNumber,
        codigoPreview,
        'tipo',
        `Valor "${parseText(tipoRaw)}" inválido — use: ${TIPO_VALUES}`,
      );
      continue;
    }

    if (!tipo) {
      addErro(lineNumber, codigoPreview, 'tipo', 'Tipo ausente ou vazio');
      continue;
    }

    const tipoEstruturaRaw = getCell(row, columnMap, 'tipoEstrutura');
    const tipoEstrutura = parseTipoEstrutura(tipoEstruturaRaw);
    if (parseText(tipoEstruturaRaw) && !tipoEstrutura) {
      addErro(
        lineNumber,
        codigoPreview,
        'tipo_estrutura',
        `Valor "${parseText(tipoEstruturaRaw)}" inválido — use: ${TIPO_ESTRUTURA_VALUES}`,
      );
      continue;
    }

    if (!tipoEstrutura) {
      addErro(
        lineNumber,
        codigoPreview,
        'tipo_estrutura',
        'Tipo de estrutura ausente ou vazio',
      );
      continue;
    }

    const largura = parseRequiredPositiveInteger(getCell(row, columnMap, 'larguraMm'));
    if (largura.invalid || largura.value === null) {
      addErro(
        lineNumber,
        codigoPreview,
        'largura_mm',
        'Largura inválida — informe um número inteiro positivo',
      );
      continue;
    }

    const altura = parseRequiredPositiveInteger(getCell(row, columnMap, 'alturaMm'));
    if (altura.invalid || altura.value === null) {
      addErro(
        lineNumber,
        codigoPreview,
        'altura_mm',
        'Altura inválida — informe um número inteiro positivo',
      );
      continue;
    }

    const profundidade = parseRequiredPositiveInteger(
      getCell(row, columnMap, 'profundidadeMm'),
    );
    if (profundidade.invalid || profundidade.value === null) {
      addErro(
        lineNumber,
        codigoPreview,
        'profundidade_mm',
        'Profundidade inválida — informe um número inteiro positivo',
      );
      continue;
    }

    const cargaMaxKg = parseRequiredPositiveNumber(getCell(row, columnMap, 'cargaMaxKg'));
    if (cargaMaxKg.invalid || cargaMaxKg.value === null) {
      addErro(
        lineNumber,
        codigoPreview,
        'carga_max_kg',
        'Carga máxima inválida — informe um número positivo',
      );
      continue;
    }

    const capacidadeVolumeRaw = getCell(row, columnMap, 'capacidadeVolume');
    const capacidadeVolume = parseOptionalNumber(capacidadeVolumeRaw);
    if (parseText(capacidadeVolumeRaw) && (capacidadeVolume === null || capacidadeVolume <= 0)) {
      addErro(
        lineNumber,
        codigoPreview,
        'capacidade_volume',
        'Capacidade de volume inválida — informe um número positivo',
      );
      continue;
    }

    const prioridadeRaw = getCell(row, columnMap, 'prioridadePicking');
    const prioridadeParsed = parseOptionalNumber(prioridadeRaw);
    const prioridadePicking =
      prioridadeParsed !== null ? Math.round(prioridadeParsed) : null;

    if (
      parseText(prioridadeRaw) &&
      (prioridadePicking === null || !Number.isInteger(prioridadePicking))
    ) {
      addErro(
        lineNumber,
        codigoPreview,
        'prioridade_picking',
        'Prioridade de picking inválida — informe um número inteiro',
      );
      continue;
    }

    const curvaAbcRaw = getCell(row, columnMap, 'curvaAbc');
    const curvaAbc = parseCurvaAbc(curvaAbcRaw);
    if (parseText(curvaAbcRaw) && !curvaAbc) {
      addErro(
        lineNumber,
        codigoPreview,
        'curva_abc',
        `Valor "${parseText(curvaAbcRaw)}" inválido — use: ${CURVA_ABC_VALUES}`,
      );
      continue;
    }

    const booleanFields = [
      { key: 'vinculoSkuFixo' as const, label: 'vinculo_sku_fixo' },
      { key: 'regraLoteUnico' as const, label: 'regra_lote_unico' },
      { key: 'permiteMisturaValidade' as const, label: 'permite_mistura_validade' },
      { key: 'permiteFracionado' as const, label: 'permite_fracionado' },
    ] as const;

    let booleanError = false;

    const booleanValues: Record<
      (typeof booleanFields)[number]['key'],
      boolean
    > = {
      vinculoSkuFixo: false,
      regraLoteUnico: false,
      permiteMisturaValidade: false,
      permiteFracionado: false,
    };

    for (const field of booleanFields) {
      const raw = getCell(row, columnMap, field.key);
      const parsed = parseBoolean(raw);

      if (parseText(raw) && parsed === null) {
        addErro(
          lineNumber,
          codigoPreview,
          field.label,
          `Valor "${parseText(raw)}" inválido — use SIM ou NÃO`,
        );
        booleanError = true;
        break;
      }

      booleanValues[field.key] = parsed ?? false;
    }

    if (booleanError) {
      continue;
    }

    const optionalNumbers = [
      { key: 'coordenadaX' as const, label: 'coordenada_x' },
      { key: 'coordenadaY' as const, label: 'coordenada_y' },
      { key: 'coordenadaZ' as const, label: 'coordenada_z' },
    ] as const;

    const coordenadas: Partial<
      Record<(typeof optionalNumbers)[number]['key'], number>
    > = {};

    let coordenadaError = false;

    for (const field of optionalNumbers) {
      const raw = getCell(row, columnMap, field.key);
      const parsed = parseOptionalNumber(raw);

      if (parseText(raw) && parsed === null) {
        addErro(
          lineNumber,
          codigoPreview,
          field.label,
          'Coordenada inválida — informe um número',
        );
        coordenadaError = true;
        break;
      }

      if (parsed !== null) {
        coordenadas[field.key] = parsed;
      }
    }

    if (coordenadaError) {
      continue;
    }

    const observacao = parseText(getCell(row, columnMap, 'observacao'));

    const body = {
      unidadeId,
      zona,
      rua: rua || undefined,
      posicao: posicao || undefined,
      nivel: nivel || undefined,
      tipo,
      tipoEstrutura,
      larguraMm: largura.value,
      alturaMm: altura.value,
      profundidadeMm: profundidade.value,
      cargaMaxKg: cargaMaxKg.value,
      capacidadeVolume: capacidadeVolume ?? undefined,
      prioridadePicking: prioridadePicking ?? undefined,
      coordenadaX: coordenadas.coordenadaX,
      coordenadaY: coordenadas.coordenadaY,
      coordenadaZ: coordenadas.coordenadaZ,
      observacao: observacao || undefined,
      vinculoSkuFixo: booleanValues.vinculoSkuFixo,
      regraLoteUnico: booleanValues.regraLoteUnico,
      permiteMisturaValidade: booleanValues.permiteMisturaValidade,
      permiteFracionado: booleanValues.permiteFracionado,
      curvaAbc: curvaAbc ?? 'B',
    };

    const validated = CreateEnderecoBodySchema.safeParse(body);

    if (!validated.success) {
      const issue = validated.error.issues[0];
      addErro(
        lineNumber,
        codigoPreview,
        issue?.path.join('.') || 'linha',
        issue?.message || 'Dados inválidos na linha',
      );
      continue;
    }

    items.push({
      linha: lineNumber,
      ...validated.data,
    });
  }

  if (items.length === 0 && erros.length === 0) {
    throw new BadRequestException('Nenhuma linha de endereço encontrada no arquivo');
  }

  return { items, erros };
}
