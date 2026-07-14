import { FUNCIONARIO_CARGOS, parseFuncionarioCargo } from '@lilog/contracts';
import * as XLSX from 'xlsx';

import { downloadBlobArquivo } from '@/lib/api';
import type { FuncionarioCargoApi } from '@/features/pessoas/types/pessoa.api';
import type { EquipeApi } from '@/features/sessao-operacao/types/equipe.api';

export const IMPORT_TEMPLATE_HEADERS = [
  'matricula',
  'nome',
  'cargo',
  'dataAdmissao',
  'criarUsuario',
  'senhaInicial',
] as const;

export const IMPORT_CARGOS = FUNCIONARIO_CARGOS;

const REF_SHEET_NAME = '_ref';
const ORIENTACOES_SHEET_NAME = 'Orientações';

const EXAMPLE_ROW = [
  '421934',
  'João Silva',
  'separador',
  '2024-01-15',
  'sim',
  '123456',
];

const ORIENTACOES: Array<[string, string]> = [
  [
    'matricula',
    'Obrigatório. ID numérico único na unidade (ex: 421934). Será usado como login quando criarUsuario = sim.',
  ],
  ['nome', 'Obrigatório. Nome completo do colaborador.'],
  [
    'cargo',
    `Obrigatório. Aceita código (${IMPORT_CARGOS.join(', ')}) ou nome legível (ex: Operador Empilhadeira).`,
  ],
  ['dataAdmissao', 'Obrigatório. Formato AAAA-MM-DD (ex: 2024-01-15).'],
  [
    'criarUsuario',
    'Obrigatório. sim ou nao. Se sim, cria acesso ao sistema com perfil operador.',
  ],
  [
    'senhaInicial',
    'Obrigatório quando criarUsuario = sim. Mínimo 6 caracteres. Ignorado quando criarUsuario = nao. O usuário será obrigado a trocar a senha no primeiro login.',
  ],
  [
    'Abas',
    'Cada aba representa uma equipe. Preencha os funcionários na aba correspondente à equipe desejada.',
  ],
];

export type ParsedImportRow = {
  id: string;
  sheetName: string;
  equipeId: string;
  equipeNome: string;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargoApi;
  dataAdmissao: string;
  criarUsuario: boolean;
  senhaInicial?: string;
  erros: string[];
};

export type ParsedImportResult = {
  rows: ParsedImportRow[];
  totalValidos: number;
  totalInvalidos: number;
};

function sanitizeSheetName(nome: string): string {
  const sanitized = nome
    .replace(/[\\/?*[\]:]/g, ' ')
    .trim()
    .slice(0, 31);

  return sanitized.length > 0 ? sanitized : 'Equipe';
}

function buildUniqueSheetName(nome: string, usedNames: Set<string>): string {
  const baseName = sanitizeSheetName(nome);
  let candidate = baseName;
  let suffix = 2;

  const isUsed = (name: string) =>
    Array.from(usedNames).some(
      (used) => used.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'),
    );

  while (isUsed(candidate)) {
    const suffixText = ` (${suffix})`;
    candidate = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function applyWorkbookSheetVisibility(
  workbook: XLSX.WorkBook,
  hiddenSheetNames: Set<string>,
): void {
  if (!workbook.Workbook) {
    workbook.Workbook = {};
  }

  workbook.Workbook.Sheets = workbook.SheetNames.map((name) => ({
    name,
    Hidden: hiddenSheetNames.has(name) ? 1 : 0,
  }));
}

function normalizeSimNao(value: unknown): boolean | null {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (normalized === 'sim' || normalized === 's' || normalized === 'true') {
    return true;
  }

  if (normalized === 'nao' || normalized === 'não' || normalized === 'n' || normalized === 'false') {
    return false;
  }

  return null;
}

function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    const month = String(parsed.m).padStart(2, '0');
    const day = String(parsed.d).padStart(2, '0');

    return `${parsed.y}-${month}-${day}`;
  }

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return text;
  }

  const brMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }

  return null;
}

function isRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => String(cell ?? '').trim() === '');
}

function validateRow(
  row: Record<string, unknown>,
  context: {
    sheetName: string;
    equipeId: string;
    equipeNome: string;
    rowIndex: number;
    matriculasVistas: Set<string>;
  },
): ParsedImportRow {
  const erros: string[] = [];
  const matricula = String(row.matricula ?? '').trim();
  const nome = String(row.nome ?? '').trim();
  const cargoRaw = String(row.cargo ?? '').trim();
  const cargo = parseFuncionarioCargo(cargoRaw);
  const dataAdmissao = parseExcelDate(row.dataAdmissao);
  const criarUsuario = normalizeSimNao(row.criarUsuario);
  const senhaInicial = String(row.senhaInicial ?? '').trim();

  if (!matricula) {
    erros.push('Matrícula é obrigatória');
  } else if (!/^\d+$/.test(matricula)) {
    erros.push('Matrícula deve ser numérica');
  } else if (context.matriculasVistas.has(matricula)) {
    erros.push('Matrícula duplicada no arquivo');
  } else {
    context.matriculasVistas.add(matricula);
  }

  if (!nome) {
    erros.push('Nome é obrigatório');
  } else if (nome.length < 3) {
    erros.push('Nome deve ter ao menos 3 caracteres');
  }

  if (!cargoRaw) {
    erros.push('Cargo é obrigatório');
  } else if (!cargo) {
    erros.push(`Cargo inválido. Use: ${IMPORT_CARGOS.join(', ')}`);
  }

  if (!dataAdmissao) {
    erros.push('Data de admissão inválida (use AAAA-MM-DD)');
  }

  if (criarUsuario === null) {
    erros.push('criarUsuario deve ser sim ou nao');
  } else if (criarUsuario && senhaInicial.length < 6) {
    erros.push('Senha inicial é obrigatória (mínimo 6 caracteres) quando criarUsuario = sim');
  }

  return {
    id: `${context.sheetName}-${context.rowIndex}`,
    sheetName: context.sheetName,
    equipeId: context.equipeId,
    equipeNome: context.equipeNome,
    matricula,
    nome,
    cargo: cargo ?? (cargoRaw as FuncionarioCargoApi),
    dataAdmissao: dataAdmissao ?? '',
    criarUsuario: criarUsuario ?? false,
    senhaInicial: senhaInicial || undefined,
    erros,
  };
}

export function downloadImportTemplate(equipes: EquipeApi[]): void {
  if (equipes.length === 0) {
    return;
  }

  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>([REF_SHEET_NAME, ORIENTACOES_SHEET_NAME]);
  const refRows: Array<[string, string, string]> = [['nomeAba', 'equipeId', 'equipeNome']];

  for (const equipe of equipes) {
    const sheetName = buildUniqueSheetName(equipe.nome, usedSheetNames);
    refRows.push([sheetName, equipe.id, equipe.nome]);

    const sheet = XLSX.utils.aoa_to_sheet([
      [...IMPORT_TEMPLATE_HEADERS],
      EXAMPLE_ROW,
    ]);

    sheet['!cols'] = IMPORT_TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  const refSheet = XLSX.utils.aoa_to_sheet(refRows);
  refSheet['!cols'] = [{ wch: 24 }, { wch: 38 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(workbook, refSheet, REF_SHEET_NAME);

  const orientacoesSheet = XLSX.utils.aoa_to_sheet([
    ['Campo', 'Descrição'],
    ...ORIENTACOES,
  ]);
  orientacoesSheet['!cols'] = [{ wch: 18 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, orientacoesSheet, ORIENTACOES_SHEET_NAME);

  applyWorkbookSheetVisibility(workbook, new Set([REF_SHEET_NAME]));

  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlobArquivo(
    blob,
    `modelo-importacao-pessoas-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function parseImportFile(
  file: File,
  equipesDisponiveis: EquipeApi[],
): Promise<ParsedImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });

  const refSheet = workbook.Sheets[REF_SHEET_NAME];

  if (!refSheet) {
    throw new Error(
      'Planilha inválida. Use o modelo gerado pelo sistema (aba _ref ausente).',
    );
  }

  const refData = XLSX.utils.sheet_to_json<Record<string, string>>(refSheet, {
    defval: '',
  });

  const sheetToEquipe = new Map<
    string,
    { equipeId: string; equipeNome: string }
  >();

  for (const row of refData) {
    const nomeAba = String(row.nomeAba ?? '').trim();
    const equipeId = String(row.equipeId ?? '').trim();
    const equipeNome = String(row.equipeNome ?? '').trim();

    if (!nomeAba || !equipeId) {
      continue;
    }

    sheetToEquipe.set(nomeAba, { equipeId, equipeNome });
  }

  const rows: ParsedImportRow[] = [];
  const matriculasVistas = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === REF_SHEET_NAME || sheetName === ORIENTACOES_SHEET_NAME) {
      continue;
    }

    const equipeInfo = sheetToEquipe.get(sheetName);
    const equipeFallback = equipesDisponiveis.find(
      (equipe) => equipe.nome === sheetName,
    );

    const equipeId = equipeInfo?.equipeId ?? equipeFallback?.id ?? '';
    const equipeNome = equipeInfo?.equipeNome ?? equipeFallback?.nome ?? sheetName;

    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      continue;
    }

    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
    });

    if (rawRows.length <= 1) {
      continue;
    }

    const headers = (rawRows[0] ?? []).map((header) =>
      String(header ?? '').trim(),
    );

    for (let index = 1; index < rawRows.length; index += 1) {
      const values = rawRows[index] ?? [];

      if (isRowEmpty(values)) {
        continue;
      }

      const rowRecord: Record<string, unknown> = {};

      headers.forEach((header, headerIndex) => {
        if (header) {
          rowRecord[header] = values[headerIndex];
        }
      });

      const parsedRow = validateRow(rowRecord, {
        sheetName,
        equipeId,
        equipeNome,
        rowIndex: index + 1,
        matriculasVistas,
      });

      if (!equipeId) {
        parsedRow.erros.push('Equipe da aba não reconhecida');
      }

      rows.push(parsedRow);
    }
  }

  const totalInvalidos = rows.filter((row) => row.erros.length > 0).length;

  return {
    rows,
    totalValidos: rows.length - totalInvalidos,
    totalInvalidos,
  };
}
