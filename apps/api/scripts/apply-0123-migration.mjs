import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations/0123_recebimento_quantidade_paletes.sql',
);

const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
const databaseUrl = match?.[1]?.replace(/^["']|["']$/g, '');

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const migrationSql = readFileSync(migrationPath, 'utf-8');
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map((statement) => statement.trim())
  .filter(Boolean);

const hash = createHash('sha256').update(migrationSql).digest('hex');
const sql = postgres(databaseUrl);

try {
  const existing = await sql`
    SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
  `;

  if (existing.length > 0) {
    console.log('Migration 0123_recebimento_quantidade_paletes already applied.');
    process.exit(0);
  }

  await sql.begin(async (tx) => {
    for (const statement of statements) {
      await tx.unsafe(statement);
    }
  });

  const recorded = await sql`
    SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash} LIMIT 1
  `;

  if (recorded.length === 0) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${Date.now().toString()})
    `;
  }

  const columnCheck = await sql`
    SELECT
      to_regclass('recebimento.pre_recebimentos') AS pre_recebimentos,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'recebimento'
          AND table_name = 'pre_recebimentos'
          AND column_name = 'quantidade_paletes_esperada'
      ) AS has_esperada,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'recebimento'
          AND table_name = 'recebimentos'
          AND column_name = 'quantidade_paletes'
      ) AS has_recebida
  `;

  console.log('Migration 0123_recebimento_quantidade_paletes applied successfully.');
  console.log('Column check:', columnCheck[0] ?? null);
} catch (error) {
  console.error('Failed to apply migration:', error);
  process.exit(1);
} finally {
  await sql.end();
}
