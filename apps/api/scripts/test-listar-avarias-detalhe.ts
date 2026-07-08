import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { listarAvariasDetalheDemandaDb } from '../src/infra/db/devolucao/listar-avarias-detalhe-demanda.drizzle.js';

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

const demandaId = 'f83e8fc1-3328-4735-89d2-6568003cbd36';
const unidadeId = 'UN-SEED-001';

const client = postgres(loadDatabaseUrl());
const db = drizzle(client);

try {
  const avarias = await listarAvariasDetalheDemandaDb(db, demandaId, unidadeId);
  console.log(JSON.stringify(avarias, null, 2));
} finally {
  await client.end();
}
