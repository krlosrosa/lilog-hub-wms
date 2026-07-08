import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDatabaseUrl(): string {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }
  if (!url) throw new Error('DATABASE_URL not found');
  return url;
}

function migrationHash(relativePath: string): string {
  const content = readFileSync(
    resolve(__dirname, '../src/infra/db/providers/drizzle/config/migrations', relativePath),
    'utf8',
  );
  return createHash('sha256').update(content).digest('hex');
}

const url = loadDatabaseUrl();
const sql = postgres(url);

try {
  const all = await sql<{ id: number; hash: string }[]>`
    SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id
  `;

  const checks = [
    { tag: '0073', file: '0073_recebimento_cascade_delete.sql' },
    { tag: '0074', file: '0074_recebimento_checklist_conditions_jsonb.sql' },
    { tag: '0075', file: '0075_recebimento_status_flow.sql' },
    { tag: '0076', file: '0076_cnc_gestao_completa.sql' },
  ];

  for (const { tag, file } of checks) {
    const hash = migrationHash(file);
    const found = all.find((row) => row.hash === hash);
    console.log(`${tag}: ${found ? `applied (id ${found.id})` : 'MISSING'}`);
  }

  const enums = await sql<{ enumlabel: string }[]>`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'pre_recebimento_situacao_type'
    ORDER BY e.enumsortorder
  `;
  console.log('pre_recebimento_situacao_type:', enums.map((r) => r.enumlabel).join(', '));

  const col = await sql<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'recebimento'
      AND table_name = 'checklist_recebimento'
      AND column_name = 'conditions'
  `;
  console.log('checklist conditions column:', col.length > 0 ? 'exists' : 'missing');
} finally {
  await sql.end();
}
