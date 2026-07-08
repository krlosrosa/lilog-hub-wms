import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const migrationPath = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations/0092_tarefas_armazenagem.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf8');
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map((part) => part.trim())
  .filter(Boolean);
const hash = createHash('sha256').update(migrationSql).digest('hex');

const sql = postgres(loadDatabaseUrl(), { max: 1 });

const backfillSql = `
WITH grupos AS (
  SELECT
    ia.id AS item_id,
    ia.demanda_id,
    ia.unitizador_id,
    ia.endereco_sugerido_id,
    ia.endereco_confirmado_id,
    ia.status,
    ROW_NUMBER() OVER (
      PARTITION BY ia.demanda_id, COALESCE(ia.unitizador_id::text, ia.id::text)
      ORDER BY ia.created_at, ia.id
    ) AS item_ordem
  FROM armazenagem.itens_armazenagem ia
  WHERE ia.tarefa_id IS NULL
),
tarefas_inseridas AS (
  INSERT INTO armazenagem.tarefas_armazenagem (
    demanda_id,
    unitizador_id,
    sequencia,
    status,
    endereco_sugerido_id,
    endereco_confirmado_id,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (g.demanda_id, COALESCE(g.unitizador_id::text, g.item_id::text))
    g.demanda_id,
    g.unitizador_id,
    DENSE_RANK() OVER (
      PARTITION BY g.demanda_id
      ORDER BY COALESCE(g.unitizador_id::text, g.item_id::text)
    )::int AS sequencia,
    CASE
      WHEN g.status = 'armazenado' THEN 'armazenada'::tarefa_armazenagem_status
      WHEN g.status = 'divergente' THEN 'divergente'::tarefa_armazenagem_status
      WHEN g.status = 'em_andamento' THEN 'em_andamento'::tarefa_armazenagem_status
      ELSE 'pendente'::tarefa_armazenagem_status
    END,
    g.endereco_sugerido_id,
    g.endereco_confirmado_id,
    NOW(),
    NOW()
  FROM grupos g
  WHERE g.item_ordem = 1
  RETURNING id, demanda_id, unitizador_id
)
UPDATE armazenagem.itens_armazenagem ia
SET tarefa_id = ti.id,
    updated_at = NOW()
FROM tarefas_inseridas ti
WHERE ia.demanda_id = ti.demanda_id
  AND (
    (ia.unitizador_id IS NOT NULL AND ia.unitizador_id = ti.unitizador_id)
    OR (
      ia.unitizador_id IS NULL
      AND ti.unitizador_id IS NULL
      AND ia.id IN (
        SELECT g.item_id
        FROM grupos g
        INNER JOIN tarefas_inseridas ti2 ON ti2.id = ti.id
        WHERE g.demanda_id = ti2.demanda_id
          AND g.unitizador_id IS NULL
          AND g.item_id = ia.id
      )
    )
  );
`;

try {
  const existing = await sql<{ hash: string }[]>`
    SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
  `;

  if (existing.length > 0) {
    console.log('Migration 0092 already applied');
    process.exit(0);
  }

  const tableExists = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'armazenagem'
        AND table_name = 'tarefas_armazenagem'
    ) AS exists
  `;

  const alreadyMigrated = tableExists[0]?.exists === true;

  await sql.begin(async (tx) => {
    if (!alreadyMigrated) {
      for (const statement of statements) {
        console.log(
          'Running:',
          statement.slice(0, 80).replace(/\s+/g, ' '),
          '...',
        );
        await tx.unsafe(statement);
      }

      console.log('Running backfill for tarefas_armazenagem ...');
      await tx.unsafe(backfillSql);
    }

    await tx`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${String(Date.now())})
    `;
  });

  console.log(
    alreadyMigrated
      ? 'Tarefas armazenagem already in place; recorded migration 0092'
      : 'Migration 0092 applied successfully',
  );
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
