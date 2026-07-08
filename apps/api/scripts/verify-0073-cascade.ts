import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';
if (
  (url.startsWith('"') && url.endsWith('"')) ||
  (url.startsWith("'") && url.endsWith("'"))
) {
  url = url.slice(1, -1);
}

const sql = postgres(url);

const rows = await sql<
  { conname: string; def: string }[]
>`SELECT conname, pg_get_constraintdef(oid) as def
  FROM pg_constraint
  WHERE conname IN (
    'recebimentos_pre_recebimento_id_pre_recebimentos_id_fk',
    'itens_pre_recebimento_pre_recebimento_id_pre_recebimentos_id_fk',
    'itens_recebimento_recebimento_id_recebimentos_id_fk',
    'demandas_armazenagem_recebimento_id_recebimentos_id_fk',
    'unitizadores_recebimento_id_recebimentos_id_fk'
  )
  ORDER BY conname`;

for (const row of rows) {
  console.log(`${row.conname}: ${row.def}`);
}

await sql.end();
