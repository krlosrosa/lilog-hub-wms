import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const content = readFileSync(envPath, 'utf-8');
const match = content.match(/^DATABASE_URL=(.+)$/m);

if (!match) {
  throw new Error('DATABASE_URL not found in .env');
}

const url = match[1].trim().replace(/^["']|["']$/g, '');
const sql = postgres(url, { max: 1 });

type Check = {
  name: string;
  ok: boolean;
  value: unknown;
};

const checks: Check[] = [];

const migrationsDir = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations',
);
const migrationFile = readdirSync(migrationsDir).find(
  (file) => file.startsWith('0023_') && file.endsWith('.sql'),
);

if (!migrationFile) {
  throw new Error('Migration 0023 not found in migrations directory');
}

const migrationPath = resolve(migrationsDir, migrationFile);
const migrationHash = createHash('sha256')
  .update(readFileSync(migrationPath, 'utf-8'))
  .digest('hex');

const appliedMigrations = await sql`
  SELECT id, hash, created_at
  FROM drizzle.__drizzle_migrations
  ORDER BY id DESC
  LIMIT 5`;

const applied0023 = appliedMigrations.find((m) => m.hash === migrationHash);
checks.push({
  name: 'migration 0023 aplicada',
  ok: applied0023 != null,
  value: applied0023 ?? { migrationFile, migrationHash, appliedMigrations },
});

const tableRegclass = await sql`
  SELECT to_regclass('sessao_operacao.sessao_funcionario_pausas') AS regclass`;
checks.push({
  name: 'tabela sessao_operacao.sessao_funcionario_pausas existe',
  ok: tableRegclass[0].regclass != null,
  value: tableRegclass[0].regclass,
});

const expectedTables = [
  'equipes',
  'equipe_funcionarios',
  'escalas_trabalho',
  'sessoes_trabalho',
  'sessao_funcionarios',
  'sessao_funcionario_pausas',
];

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'sessao_operacao'
  ORDER BY table_name`;

const tableNames = tables.map((t) => t.table_name);
checks.push({
  name: 'seis tabelas em sessao_operacao',
  ok:
    tableNames.length === expectedTables.length &&
    expectedTables.every((name) => tableNames.includes(name)),
  value: tableNames,
});

const enumCheck = await sql`
  SELECT typname, enumlabel
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE typname = 'sessao_pausa_tipo_type'
  ORDER BY enumsortorder`;

const enumLabels = enumCheck.map((e) => e.enumlabel);
checks.push({
  name: 'enum sessao_pausa_tipo_type com valores termica, refeicao, outros',
  ok:
    enumLabels.length === 3 &&
    enumLabels.includes('termica') &&
    enumLabels.includes('refeicao') &&
    enumLabels.includes('outros'),
  value: enumLabels,
});

const pausaColumns = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'sessao_operacao'
    AND table_name = 'sessao_funcionario_pausas'
  ORDER BY ordinal_position`;

const columnNames = pausaColumns.map((c) => c.column_name);
const expectedColumns = [
  'id',
  'sessao_funcionario_id',
  'tipo',
  'inicio',
  'fim',
  'registrado_por_user_id',
  'observacao',
  'created_at',
  'updated_at',
];
checks.push({
  name: 'colunas esperadas em sessao_funcionario_pausas',
  ok: expectedColumns.every((col) => columnNames.includes(col)),
  value: columnNames,
});

const partialUniqueIndex = await sql`
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'sessao_operacao'
    AND tablename = 'sessao_funcionario_pausas'
    AND indexname = 'sessao_funcionario_pausas_um_aberto_idx'`;

checks.push({
  name: 'índice único parcial sessao_funcionario_pausas_um_aberto_idx',
  ok:
    partialUniqueIndex.length === 1 &&
    partialUniqueIndex[0].indexdef.toLowerCase().includes('where') &&
    partialUniqueIndex[0].indexdef.toLowerCase().includes('fim'),
  value: partialUniqueIndex[0] ?? null,
});

const fkToSessaoFuncionarios = await sql`
  SELECT con.conname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  JOIN pg_class frel ON frel.oid = con.confrelid
  JOIN pg_namespace fnsp ON fnsp.oid = frel.relnamespace
  WHERE nsp.nspname = 'sessao_operacao'
    AND rel.relname = 'sessao_funcionario_pausas'
    AND con.contype = 'f'
    AND fnsp.nspname = 'sessao_operacao'
    AND frel.relname = 'sessao_funcionarios'`;

checks.push({
  name: 'FK sessao_funcionario_pausas -> sessao_funcionarios',
  ok: fkToSessaoFuncionarios.length >= 1,
  value: fkToSessaoFuncionarios.map((f) => f.conname),
});

const failed = checks.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      passed: failed.length === 0,
      migrationFile,
      tableCount: tableNames.length,
      checks,
    },
    null,
    2,
  ),
);

await sql.end();
process.exit(failed.length === 0 ? 0 : 1);
