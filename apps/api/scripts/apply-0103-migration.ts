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

  if (!url) {
    throw new Error('DATABASE_URL not found in apps/api/.env');
  }

  return url;
}

const migrationPath = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations/0103_processo_debito_interacoes.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf8');
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map((part) => part.trim())
  .filter(Boolean);
const hash = createHash('sha256').update(migrationSql).digest('hex');

const sql = postgres(loadDatabaseUrl(), { max: 1 });

try {
  const existing = await sql<{ hash: string }[]>`
    SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
  `;

  if (existing.length > 0) {
    console.log('Migration 0103 already applied');
    process.exit(0);
  }

  const tableExists = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'cobranca_transportadora'
        AND table_name = 'processo_debito_interacoes'
    ) AS exists
  `;

  const alreadyApplied = tableExists[0]?.exists;

  await sql.begin(async (tx) => {
    if (!alreadyApplied) {
      for (const statement of statements) {
        console.log(
          'Running:',
          statement.slice(0, 80).replace(/\s+/g, ' '),
          '...',
        );
        await tx.unsafe(statement);
      }
    }

    await tx`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${String(Date.now())})
    `;
  });

  console.log(
    alreadyApplied
      ? 'Schema already present; recorded migration 0103'
      : 'Migration 0103 applied successfully',
  );
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
