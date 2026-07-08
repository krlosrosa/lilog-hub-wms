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

const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';
if (
  (url.startsWith('"') && url.endsWith('"')) ||
  (url.startsWith("'") && url.endsWith("'"))
) {
  url = url.slice(1, -1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const sql = postgres(url);

try {
  const applied = await sql<{ hash: string }[]>`
    SELECT hash FROM drizzle.__drizzle_migrations
  `;
  const appliedSet = new Set(applied.map((r) => r.hash));

  const missing: string[] = [];
  for (const file of files) {
    const content = readFileSync(resolve(migrationsDir, file), 'utf8');
    const hash = createHash('sha256').update(content).digest('hex');
    if (!appliedSet.has(hash)) {
      missing.push(`${file} (${hash.slice(0, 12)}...)`);
    }
  }

  console.log(`SQL files: ${files.length}, applied hashes: ${applied.length}`);
  if (missing.length === 0) {
    console.log('All migration files are recorded in __drizzle_migrations');
  } else {
    console.log('Missing migrations:');
    for (const m of missing) console.log(' -', m);
  }
} finally {
  await sql.end();
}
