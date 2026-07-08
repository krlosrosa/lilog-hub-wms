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

const codigoDemanda = process.argv[2] ?? 'RVX-19380955';
const sql = postgres(loadDatabaseUrl());

try {
  const demandas = await sql`
    SELECT d.id, d.codigo_demanda, d.status, COUNT(nf.id)::int AS total_nfs
    FROM devolucao.demandas_devolucao d
    LEFT JOIN devolucao.devolucao_notas_fiscais nf ON nf.demanda_id = d.id
    WHERE d.codigo_demanda = ${codigoDemanda}
    GROUP BY d.id, d.codigo_demanda, d.status
  `;

  const itens = await sql`
    SELECT di.sku, di.produto_id, di.quantidade, di.peso_devolvido, nf.numero_nf
    FROM devolucao.devolucao_itens di
    INNER JOIN devolucao.devolucao_notas_fiscais nf ON nf.id = di.devolucao_nf_id
    INNER JOIN devolucao.demandas_devolucao d ON d.id = nf.demanda_id
    WHERE d.codigo_demanda = ${codigoDemanda}
    LIMIT 20
  `;

  console.log('Demanda:', JSON.stringify(demandas, null, 2));
  console.log('Itens:', JSON.stringify(itens, null, 2));
} finally {
  await sql.end();
}
