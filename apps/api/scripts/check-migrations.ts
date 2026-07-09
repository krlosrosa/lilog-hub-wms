import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadDatabaseUrl(): string {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (key !== 'DATABASE_URL') continue;
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }

  throw new Error('DATABASE_URL not found in .env');
}

async function main() {
  const sql = postgres(loadDatabaseUrl(), { max: 1 });

  try {
    const applied = await sql`
      SELECT id, hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 15
    `;
    console.log('Last applied migrations:');
    for (const row of applied) {
      console.log(`- ${row.created_at} | ${row.hash}`);
    }

    const table = await sql`
      SELECT to_regclass('recebimento.offline_import_logs') AS exists
    `;
    console.log('\noffline_import_logs exists:', table[0]?.exists ?? null);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
