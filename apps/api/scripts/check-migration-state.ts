import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const env = readFileSync('.env', 'utf8');
let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';
if (
  (url.startsWith('"') && url.endsWith('"')) ||
  (url.startsWith("'") && url.endsWith("'"))
) {
  url = url.slice(1, -1);
}

if (!url) {
  throw new Error('DATABASE_URL not found');
}

const sql = postgres(url);

try {
  const cols = await sql<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'recebimento'
      AND table_name = 'pre_recebimentos'
    ORDER BY ordinal_position
  `;
  console.log('pre_recebimentos columns:', cols.map((c) => c.column_name));

  const mig = await sql<
    { id: number; hash: string; created_at: number }[]
  >`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 8
  `;
  console.log('recent migrations:', mig);
} finally {
  await sql.end();
}
