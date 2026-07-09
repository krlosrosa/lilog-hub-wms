import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations',
);
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

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function main() {
  const sql = postgres(loadDatabaseUrl(), { max: 1 });

  try {
    const appliedRows = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
    const applied = new Set(appliedRows.map((row) => row.hash as string));

    const files = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    const pending: string[] = [];

    for (const file of files) {
      const content = readFileSync(resolve(migrationsDir, file), 'utf-8');
      const hash = sha256(content);
      if (!applied.has(hash)) {
        pending.push(file);
      }
    }

    console.log(`Pending migrations (${pending.length}):`);
    for (const file of pending) {
      console.log(`- ${file}`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
