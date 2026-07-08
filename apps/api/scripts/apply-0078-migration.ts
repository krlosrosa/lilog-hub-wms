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
  '../src/infra/db/providers/drizzle/config/migrations/0078_rename_endereco_tipo_doca_to_area_operacional.sql',
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
    console.log('Migration 0078 already applied');
    process.exit(0);
  }

  const enumValues = await sql<{ enumlabel: string }[]>`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'endereco_tipo_type'
    ORDER BY e.enumsortorder
  `;

  const labels = enumValues.map((row) => row.enumlabel);

  if (labels.includes('area_operacional')) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${String(Date.now())})
    `;
    console.log(
      'Enum already has area_operacional; recorded migration 0078',
    );
    process.exit(0);
  }

  if (!labels.includes('doca')) {
    throw new Error(
      `Cannot rename doca: enum values are ${labels.join(', ')}`,
    );
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

  console.log('Migration 0078 applied successfully');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
