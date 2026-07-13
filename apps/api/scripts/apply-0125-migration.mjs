import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations/0125_sessao_funcionario_apoio.sql',
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
    console.log('Migration 0125_sessao_funcionario_apoio already applied.');
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
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'sessao_operacao'
        AND table_name = 'sessao_funcionarios'
        AND column_name = 'tipo_vinculo'
    ) AS has_tipo_vinculo
  `;

  console.log('Migration 0125_sessao_funcionario_apoio applied successfully.');
  console.log('Column check:', columnCheck[0] ?? null);
} catch (error) {
  console.error('Failed to apply migration:', error);
  process.exit(1);
} finally {
  await sql.end();
}
