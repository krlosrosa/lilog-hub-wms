import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadDatabaseUrl(): string {
  const content = readFileSync(envPath, 'utf-8');
  const match = content.match(/DATABASE_URL="([^"]+)"/);

  if (!match?.[1]) {
    throw new Error('DATABASE_URL não encontrada');
  }

  return match[1];
}

const viagemId = Number(process.argv[2] ?? 19380955);
const sql = postgres(loadDatabaseUrl());

try {
  const transportes = await sql<
    Array<{ id: string; viagem_id: number | null; unidade_id: string }>
  >`
    SELECT id, viagem_id, unidade_id
    FROM expedicao.transportes
    WHERE viagem_id = ${viagemId}
    LIMIT 5
  `;

  console.log(JSON.stringify(transportes, null, 2));
} finally {
  await sql.end();
}
