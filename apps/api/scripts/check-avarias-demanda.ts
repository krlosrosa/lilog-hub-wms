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

const codigoDemanda = process.argv[2] ?? 'RVX-18627637';
const sql = postgres(loadDatabaseUrl());

try {
  const demanda = await sql`
    SELECT id, codigo_demanda, unidade_id, status
    FROM devolucao.demandas_devolucao
    WHERE codigo_demanda = ${codigoDemanda}
  `;

  console.log('Demanda:', JSON.stringify(demanda, null, 2));

  if (demanda.length === 0) {
    process.exit(0);
  }

  const demandaId = demanda[0].id;
  const unidadeId = demanda[0].unidade_id;

  const avarias = await sql`
    SELECT a.*, d.unidade_id
    FROM devolucao.devolucao_avarias a
    INNER JOIN devolucao.demandas_devolucao d ON d.id = a.demanda_id
    WHERE a.demanda_id = ${demandaId}
  `;

  console.log('Avarias:', JSON.stringify(avarias, null, 2));

  const itensAvariados = await sql`
    SELECT di.id, di.sku, di.condicao, di.qtd_conferida
    FROM devolucao.devolucao_itens di
    INNER JOIN devolucao.devolucao_notas_fiscais nf ON nf.id = di.devolucao_nf_id
    WHERE nf.demanda_id = ${demandaId}
      AND di.condicao = 'avariado'
  `;

  console.log('Itens avariados:', JSON.stringify(itensAvariados, null, 2));

  const itemAvaria = await sql`
    SELECT di.id, di.sku, di.condicao, di.qtd_conferida
    FROM devolucao.devolucao_itens di
    WHERE di.id = 'c84a697a-e54c-4040-a012-e6f4b98c4136'
  `;

  console.log('Item vinculado à avaria:', JSON.stringify(itemAvaria, null, 2));
  console.log('unidadeId:', unidadeId);
} finally {
  await sql.end();
}
