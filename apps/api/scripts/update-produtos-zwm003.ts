import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE_PATH = resolve(
  __dirname,
  '../../../exemplos/base_zwm003.xlsx'
);

type ProdutoZwm003Row = {
  linha: number;
  sku: string;
  grupo: string;
  ean: string;
  dum: string | null;
};

type ColumnKey = 'sku' | 'grupo' | 'ean' | 'dum';

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  sku: ['material', 'sku', 'cod_sku', 'cod sku'],
  grupo: ['linha sap', 'grupo'],
  ean: ['cod.ean/dun cx_01', 'cod ean/dun cx_01', 'ean', 'ean cx_01'],
  dum: ['cod.ean/dun cx_02', 'cod ean/dun cx_02', 'dum', 'dun', 'dum cx_02'],
};

function loadDatabaseUrl(): string {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';

  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }

  if (!url) {
    throw new Error('DATABASE_URL not found in apps/api/.env');
  }

  return url;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeCellText(value: unknown): string {
  return String(value ?? '').trim();
}

function resolveColumnMap(headers: unknown[]): Record<ColumnKey, number> {
  const map = {} as Partial<Record<ColumnKey, number>>;

  for (const [key, aliases] of Object.entries(COLUMN_ALIASES) as [
    ColumnKey,
    string[],
  ][]) {
    const index = headers.findIndex((header) =>
      aliases.includes(normalizeText(header))
    );

    if (index >= 0) {
      map[key] = index;
    }
  }

  const missing = (Object.keys(COLUMN_ALIASES) as ColumnKey[]).filter(
    (key) => map[key] === undefined
  );

  if (missing.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes: ${missing.join(', ')}. Cabeçalhos encontrados: ${headers.map((header) => String(header)).join(', ')}`
    );
  }

  return map as Record<ColumnKey, number>;
}

function parseProdutosZwm003(filePath: string): ProdutoZwm003Row[] {
  const workbook = XLSX.read(readFileSync(filePath), {
    type: 'buffer',
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Arquivo sem planilhas válidas');
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('Planilha vazia ou inválida');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  });

  if (rows.length < 2) {
    throw new Error('Arquivo sem linhas de dados');
  }

  const columnMap = resolveColumnMap(rows[0] ?? []);
  const items: ProdutoZwm003Row[] = [];
  const seenSkus = new Map<string, number>();
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const linha = i + 1;
    const sku = normalizeCellText(row[columnMap.sku]);
    const grupo = normalizeCellText(row[columnMap.grupo]);
    const ean = normalizeCellText(row[columnMap.ean]);
    const dum = normalizeCellText(row[columnMap.dum]);

    if (!sku) {
      errors.push(`Linha ${linha}: Material/SKU vazio`);
      continue;
    }

    if (seenSkus.has(sku)) {
      errors.push(
        `Linha ${linha}: SKU duplicado (${sku}), primeira ocorrência na linha ${seenSkus.get(sku)}`
      );
      continue;
    }

    seenSkus.set(sku, linha);

    if (!grupo) {
      errors.push(`Linha ${linha}: Linha SAP/grupo vazio para SKU ${sku}`);
    }

    if (!ean) {
      errors.push(`Linha ${linha}: EAN vazio para SKU ${sku}`);
    }

    if (grupo.length > 100) {
      errors.push(
        `Linha ${linha}: grupo excede 100 caracteres para SKU ${sku}`
      );
    }

    if (ean.length > 20) {
      errors.push(`Linha ${linha}: EAN excede 20 caracteres para SKU ${sku}`);
    }

    if (dum.length > 20) {
      errors.push(`Linha ${linha}: DUM excede 20 caracteres para SKU ${sku}`);
    }

    items.push({
      linha,
      sku,
      grupo,
      ean,
      dum: dum || null,
    });
  }

  if (errors.length > 0) {
    throw new Error(`Planilha inválida:\n${errors.join('\n')}`);
  }

  return items;
}

function readArgs(): { apply: boolean; filePath: string } {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const fileArg = args.find((arg) => arg.startsWith('--file='));
  const filePath = fileArg
    ? resolve(process.cwd(), fileArg.slice('--file='.length))
    : DEFAULT_FILE_PATH;

  return { apply, filePath };
}

const { apply, filePath } = readArgs();
const items = parseProdutosZwm003(filePath);
const sql = postgres(loadDatabaseUrl(), { max: 1 });

try {
  const columnExists = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'master_data'
        AND table_name = 'produtos'
        AND column_name = 'grupo'
    ) AS exists
  `;

  if (!columnExists[0]?.exists) {
    throw new Error(
      'Coluna master_data.produtos.grupo não existe. Execute scripts/apply-0083-migration.ts antes.'
    );
  }

  const skus = items.map((item) => item.sku);
  const existing = await sql<{ sku: string }[]>`
    SELECT sku
    FROM master_data.produtos
    WHERE sku IN ${sql(skus)}
  `;
  const existingSkus = new Set(existing.map((row) => row.sku));
  const missing = items.filter((item) => !existingSkus.has(item.sku));
  const updatable = items.filter((item) => existingSkus.has(item.sku));

  console.log(`Arquivo: ${filePath}`);
  console.log(`Linhas válidas: ${items.length}`);
  console.log(`Produtos encontrados no banco: ${updatable.length}`);
  console.log(`SKUs não encontrados: ${missing.length}`);
  console.log(
    `Linhas com DUM vazio: ${items.filter((item) => item.dum === null).length}`
  );

  if (missing.length > 0) {
    console.log(
      `Amostra de SKUs não encontrados: ${missing
        .slice(0, 20)
        .map((item) => item.sku)
        .join(', ')}`
    );
  }

  if (!apply) {
    console.log(
      'Dry-run concluído. Execute novamente com --apply para atualizar.'
    );
    process.exit(0);
  }

  await sql.begin(async (tx) => {
    for (const item of updatable) {
      await tx`
        UPDATE master_data.produtos
        SET grupo = ${item.grupo},
            ean = ${item.ean},
            dum = ${item.dum},
            updated_at = now()
        WHERE sku = ${item.sku}
      `;
    }
  });

  console.log(
    `Atualização concluída: ${updatable.length} produto(s) atualizados.`
  );
} catch (error) {
  console.error('Falha ao atualizar produtos ZWM003:', error);
  process.exit(1);
} finally {
  await sql.end();
}
