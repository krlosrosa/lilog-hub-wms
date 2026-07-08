import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';
if (
  (url.startsWith('"') && url.endsWith('"')) ||
  (url.startsWith("'") && url.endsWith("'"))
) {
  url = url.slice(1, -1);
}

const migrationPath = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations/0075_recebimento_status_flow.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf8');
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map((part) => part.trim())
  .filter(Boolean);

const hash = createHash('sha256').update(migrationSql).digest('hex');

const sql = postgres(url);

try {
  const existing = await sql<{ hash: string }[]>`
    SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
  `;

  if (existing.length > 0) {
    console.log('Migration 0075 already applied');
    process.exit(0);
  }

  const enumCheck = await sql<{ typname: string; enumlabel: string }[]>`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN (
      'pre_recebimento_situacao_type',
      'pre_recebimento_situacao_type_new',
      'recebimento_situacao_type',
      'recebimento_situacao_type_new'
    )
    ORDER BY t.typname, e.enumsortorder
  `;

  const hasNewFlow = enumCheck.some(
    (row) =>
      row.typname === 'pre_recebimento_situacao_type' &&
      row.enumlabel === 'liberado_para_conferencia',
  );

  if (hasNewFlow) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${String(Date.now())})
    `;
    console.log('Schema already on new flow; recorded migration 0075');
    process.exit(0);
  }

  await sql.begin(async (tx) => {
    for (const statement of statements) {
      console.log('Running:', statement.slice(0, 80).replace(/\s+/g, ' '), '...');
      await tx.unsafe(statement);
    }

    await tx`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${String(Date.now())})
    `;
  });

  console.log('Migration 0075 applied successfully');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
