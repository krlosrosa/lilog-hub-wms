import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const content = readFileSync(envPath, 'utf-8');
const match = content.match(/^DATABASE_URL=(.+)$/m);

if (!match) {
  throw new Error('DATABASE_URL not found in .env');
}

const url = match[1].trim().replace(/^["']|["']$/g, '');
const sql = postgres(url, { max: 1 });

type Check = {
  name: string;
  ok: boolean;
  value: unknown;
};

const checks: Check[] = [];

const migrations = await sql`
  SELECT id, hash, created_at
  FROM drizzle.__drizzle_migrations
  ORDER BY id DESC
  LIMIT 3`;
checks.push({
  name: 'ultimas migrations aplicadas',
  ok: migrations.length >= 2,
  value: migrations,
});

const migration0021Path = resolve(
  __dirname,
  '../src/infra/db/providers/drizzle/config/migrations/0021_mapa_grupos_lote_unique.sql',
);
const hash0021 = createHash('sha256')
  .update(readFileSync(migration0021Path, 'utf-8'))
  .digest('hex');
const applied0021 = migrations.find((m) => m.hash === hash0021);
checks.push({
  name: 'migration 0021 aplicada',
  ok: applied0021 != null,
  value: applied0021 ?? 'NOT FOUND',
});

const oldTable = await sql`SELECT to_regclass('expedicao.mapa_grupo_etapas') AS regclass`;
checks.push({
  name: 'mapa_grupo_etapas removida',
  ok: oldTable[0].regclass === null,
  value: oldTable[0].regclass,
});

const columns = await sql`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'expedicao'
    AND table_name = 'mapa_grupos'
    AND column_name IN ('processo', 'iniciado_em', 'finalizado_em', 'tempo_esperado')
  ORDER BY column_name`;
checks.push({
  name: 'colunas novas em mapa_grupos',
  ok: columns.length === 4,
  value: columns.map((c) => c.column_name),
});

const enums = await sql`
  SELECT typname FROM pg_type
  WHERE typname IN (
    'mapa_grupo_etapa_status_type',
    'mapa_grupo_processo_type',
    'mapa_grupo_etapa_type'
  )`;
const enumNames = enums.map((e) => e.typname);
checks.push({
  name: 'enum processo presente',
  ok: enumNames.includes('mapa_grupo_processo_type'),
  value: enumNames,
});
checks.push({
  name: 'enums legados removidos',
  ok:
    !enumNames.includes('mapa_grupo_etapa_status_type') &&
    !enumNames.includes('mapa_grupo_etapa_type'),
  value: enumNames,
});

const constraints = await sql`
  SELECT conname FROM pg_constraint
  WHERE conrelid = 'expedicao.mapa_grupos'::regclass
    AND contype = 'u'`;
const constraintNames = constraints.map((c) => c.conname);
checks.push({
  name: 'unique por lote (mapa_lote_id, micro_uuid, processo)',
  ok: constraintNames.includes('mapa_grupos_lote_micro_uuid_processo_unique'),
  value: constraintNames,
});
checks.push({
  name: 'unique global antigo removido',
  ok: !constraintNames.includes('mapa_grupos_micro_uuid_processo_unique'),
  value: constraintNames,
});

const nullProcesso = await sql`SELECT COUNT(*)::int AS count FROM expedicao.mapa_grupos WHERE processo IS NULL`;
checks.push({
  name: 'nenhum processo nulo',
  ok: nullProcesso[0].count === 0,
  value: nullProcesso[0].count,
});

const suffix = await sql`SELECT COUNT(*)::int AS count FROM expedicao.mapa_grupos WHERE micro_uuid LIKE '%-conferencia'`;
checks.push({
  name: 'sem sufixo -conferencia legado',
  ok: suffix[0].count === 0,
  value: suffix[0].count,
});

const dupes = await sql`
  SELECT mapa_lote_id, micro_uuid, processo, COUNT(*)::int AS count
  FROM expedicao.mapa_grupos
  GROUP BY mapa_lote_id, micro_uuid, processo
  HAVING COUNT(*) > 1`;
checks.push({
  name: 'sem duplicata por lote',
  ok: dupes.length === 0,
  value: dupes,
});

const dist = await sql`
  SELECT processo, COUNT(*)::int AS count
  FROM expedicao.mapa_grupos
  GROUP BY processo
  ORDER BY processo`;
checks.push({
  name: 'distribuicao de processos',
  ok: true,
  value: dist,
});

const failed = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ passed: failed.length === 0, checks }, null, 2));

await sql.end();
process.exit(failed.length === 0 ? 0 : 1);
