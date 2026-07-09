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
  const pendingTags = process.argv.slice(2);
  const tagsToApply =
    pendingTags.length > 0
      ? pendingTags
      : ['0111_offline_import_logs'];
  const sql = postgres(loadDatabaseUrl(), { max: 1 });

  try {
    for (const tag of pendingTags) {
      const filePath = resolve(migrationsDir, `${tag}.sql`);
      const content = readFileSync(filePath, 'utf-8');
      const hash = sha256(content);

      const existing = await sql`
        SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash} LIMIT 1
      `;

      if (existing.length > 0) {
        console.log(`Skipping ${tag} (already recorded)`);
        continue;
      }

      console.log(`Applying ${tag}...`);
      await sql.unsafe(content);

      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${hash}, ${Date.now()})
      `;

      console.log(`Applied ${tag}`);
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
  console.error('Migration failed:', error);
  process.exit(1);
});
