/**
 * Remove dados da unidade seed de dev (UN-SEED-001).
 * Run: pnpm --filter api exec tsx scripts/remove-seed-unidade.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_UNIDADE_ID = 'UN-SEED-001';

function loadDatabaseUrl(): string {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';

  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }

  if (!url) {
    throw new Error('DATABASE_URL not found in apps/api/.env');
  }

  return url;
}

const sql = postgres(loadDatabaseUrl(), { max: 1 });

try {
  const [unidade] = await sql<{ id: string }[]>`
    SELECT id FROM master_data.unidades WHERE id = ${SEED_UNIDADE_ID}
  `;

  if (!unidade) {
    console.log(`Unidade seed ${SEED_UNIDADE_ID} não encontrada — nada a remover.`);
    process.exit(0);
  }

  await sql`DELETE FROM estoque.enderecos WHERE unidade_id = ${SEED_UNIDADE_ID}`;
  await sql`DELETE FROM estoque.depositos WHERE unidade_id = ${SEED_UNIDADE_ID}`;
  await sql`DELETE FROM master_data.centros WHERE unidade_id = ${SEED_UNIDADE_ID}`;

  await sql`
    UPDATE auth.users
    SET funcionario_id = NULL
    WHERE funcionario_id IN (
      SELECT id FROM auth.funcionarios WHERE unidade_id = ${SEED_UNIDADE_ID}
    )
  `;

  await sql`
    DELETE FROM auth.users
    WHERE id IN (421932, 421933)
      AND funcionario_id IN (
        SELECT id FROM auth.funcionarios WHERE unidade_id = ${SEED_UNIDADE_ID}
      )
  `;

  await sql`DELETE FROM auth.funcionarios WHERE unidade_id = ${SEED_UNIDADE_ID}`;
  await sql`DELETE FROM master_data.unidades WHERE id = ${SEED_UNIDADE_ID}`;

  console.log(`Unidade seed ${SEED_UNIDADE_ID} removida com sucesso.`);
} catch (error) {
  console.error('Falha ao remover unidade seed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
