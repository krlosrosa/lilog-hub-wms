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
  (file) => file.startsWith('0022_') && file.endsWith('.sql'),
);

if (!migrationFile) {
  throw new Error('Migration 0022 not found in migrations directory');
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

const applied0022 = appliedMigrations.find((m) => m.hash === migrationHash);
checks.push({
  name: 'migration 0022 aplicada',
  ok: applied0022 != null,
  value: applied0022 ?? { migrationFile, migrationHash, appliedMigrations },
});

const schemaRegclass = await sql`
  SELECT to_regclass('sessao_operacao.equipes') AS regclass`;
checks.push({
  name: 'schema sessao_operacao.equipes existe',
  ok: schemaRegclass[0].regclass != null,
  value: schemaRegclass[0].regclass,
});

const expectedTables = [
  'equipes',
  'equipe_funcionarios',
  'escalas_trabalho',
  'sessoes_trabalho',
  'sessao_funcionarios',
];

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'sessao_operacao'
  ORDER BY table_name`;

const tableNames = tables.map((t) => t.table_name);
checks.push({
  name: 'cinco tabelas em sessao_operacao',
  ok:
    tableNames.length === expectedTables.length &&
    expectedTables.every((name) => tableNames.includes(name)),
  value: tableNames,
});

const enums = await sql`
  SELECT typname
  FROM pg_type
  WHERE typname IN (
    'sessao_trabalho_status_type',
    'sessao_presenca_status_type'
  )
  ORDER BY typname`;

const enumNames = enums.map((e) => e.typname);
checks.push({
  name: 'enums de sessao criados',
  ok:
    enumNames.includes('sessao_trabalho_status_type') &&
    enumNames.includes('sessao_presenca_status_type'),
  value: enumNames,
});

const cruzaMeiaNoiteColumn = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'sessao_operacao'
    AND table_name = 'escalas_trabalho'
    AND column_name = 'cruza_meia_noite'`;

checks.push({
  name: 'coluna cruza_meia_noite em escalas_trabalho',
  ok:
    cruzaMeiaNoiteColumn.length === 1 &&
    cruzaMeiaNoiteColumn[0].data_type === 'boolean' &&
    cruzaMeiaNoiteColumn[0].is_nullable === 'NO',
  value: cruzaMeiaNoiteColumn[0] ?? null,
});

const foreignKeys = await sql`
  SELECT
    rel.relname AS table_name,
    fnsp.nspname AS foreign_table_schema,
    frel.relname AS foreign_table_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  JOIN pg_class frel ON frel.oid = con.confrelid
  JOIN pg_namespace fnsp ON fnsp.oid = frel.relnamespace
  WHERE nsp.nspname = 'sessao_operacao'
    AND con.contype = 'f'`;

const fkTargets = foreignKeys.map(
  (fk) => `${fk.foreign_table_schema}.${fk.foreign_table_name}`,
);
checks.push({
  name: 'FKs para master_data.unidades',
  ok: fkTargets.includes('master_data.unidades'),
  value: [...new Set(fkTargets)],
});
checks.push({
  name: 'FKs para auth.funcionarios',
  ok: fkTargets.includes('auth.funcionarios'),
  value: [...new Set(fkTargets)],
});
checks.push({
  name: 'FKs para auth.users',
  ok: fkTargets.includes('auth.users'),
  value: [...new Set(fkTargets)],
});

const uniqueConstraints = await sql`
  SELECT
    rel.relname AS table_name,
    con.conname AS constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'sessao_operacao'
    AND con.contype = 'u'
  ORDER BY rel.relname, con.conname`;

const constraintNames = uniqueConstraints.map((c) => c.constraint_name);
checks.push({
  name: 'unique escala_id + data_referencia em sessoes_trabalho',
  ok: constraintNames.includes('sessoes_trabalho_escala_data_referencia_unique'),
  value: constraintNames,
});
checks.push({
  name: 'unique equipe_id + funcionario_id em equipe_funcionarios',
  ok: constraintNames.includes('equipe_funcionarios_equipe_funcionario_unique'),
  value: constraintNames,
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
