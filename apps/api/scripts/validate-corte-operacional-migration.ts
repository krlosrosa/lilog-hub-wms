import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnv(): void {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não configurada');
  }

  const sql = postgres(url, { max: 1 });

  try {
    const migrations = await sql`
      SELECT id, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY id DESC
      LIMIT 3
    `;

    const schema = await sql`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name = 'corte_operacional'
    `;

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'corte_operacional'
      ORDER BY table_name
    `;

    const enumValues = await sql`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'corte_status_type'
      ORDER BY e.enumsortorder
    `;

    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'corte_operacional'
      ORDER BY indexname
    `;

    const migration0032 = await sql`
      SELECT id, created_at
      FROM drizzle.__drizzle_migrations
      WHERE created_at = 1782146000000
    `;

    const ok =
      schema.length === 1 &&
      tables.length === 2 &&
      tables.some((t) => t.table_name === 'cortes') &&
      tables.some((t) => t.table_name === 'corte_itens') &&
      enumValues.length === 4 &&
      migration0032.length === 1;

    console.log('--- Validação migration corte_operacional ---');
    console.log('Migration 0032 registrada:', migration0032);
    console.log('Schema corte_operacional:', schema);
    console.log('Tabelas:', tables.map((t) => t.table_name));
    console.log('Enum corte_status_type:', enumValues.map((e) => e.enumlabel));
    console.log('Índices:', indexes.map((i) => i.indexname));
    console.log('Resultado:', ok ? 'OK' : 'FALHOU');

    if (!ok) {
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
