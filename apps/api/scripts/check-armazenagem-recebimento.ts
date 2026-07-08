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

const sql = postgres(loadDatabaseUrl());

try {
  const recs = await sql`
    SELECT r.id, r.situacao, r.modo_unitizacao, r.data_fim,
           COUNT(ir.id)::int AS itens,
           COUNT(ir.unitizador_id)::int AS com_palete
    FROM recebimento.recebimentos r
    LEFT JOIN recebimento.itens_recebimento ir ON ir.recebimento_id = r.id
    GROUP BY r.id, r.situacao, r.modo_unitizacao, r.data_fim
    ORDER BY r.created_at DESC
    LIMIT 10
  `;

  console.log('=== RECEBIMENTOS RECENTES ===');
  console.table(recs);

  const demandas = await sql`
    SELECT d.id, d.recebimento_id, d.status, d.modo_unitizacao,
           (SELECT COUNT(*)::int FROM armazenagem.tarefas_armazenagem t WHERE t.demanda_id = d.id) AS tarefas,
           (SELECT COUNT(*)::int FROM armazenagem.itens_armazenagem i WHERE i.demanda_id = d.id) AS itens
    FROM armazenagem.demandas_armazenagem d
    ORDER BY d.created_at DESC
    LIMIT 10
  `;

  console.log('=== DEMANDAS ARMAZENAGEM ===');
  console.table(demandas);

  const unitizadores = await sql`
    SELECT u.id, u.codigo, u.status, u.recebimento_id
    FROM armazenagem.unitizadores u
    ORDER BY u.created_at DESC
    LIMIT 10
  `;

  console.log('=== UNITIZADORES RECENTES ===');
  console.table(unitizadores);

  const semDemanda = await sql`
    SELECT r.id, r.situacao, r.modo_unitizacao,
           COUNT(ir.unitizador_id)::int AS com_palete
    FROM recebimento.recebimentos r
    INNER JOIN recebimento.itens_recebimento ir ON ir.recebimento_id = r.id
    LEFT JOIN armazenagem.demandas_armazenagem d ON d.recebimento_id = r.id
    WHERE ir.unitizador_id IS NOT NULL
      AND d.id IS NULL
    GROUP BY r.id, r.situacao, r.modo_unitizacao
    ORDER BY r.created_at DESC
    LIMIT 10
  `;

  console.log('=== RECEBIMENTOS COM PALETE SEM DEMANDA ===');
  console.table(semDemanda);

  const recId = '65947b68-8581-471e-a3ee-cf4e9bbe70d6';
  const itensRec = await sql`
    SELECT ir.id, ir.produto_id, ir.quantidade_recebida, ir.unitizador_id, u.codigo AS palete
    FROM recebimento.itens_recebimento ir
    LEFT JOIN armazenagem.unitizadores u ON u.id = ir.unitizador_id
    WHERE ir.recebimento_id = ${recId}
  `;
  console.log('=== ITENS RECEBIMENTO ATUAL ===');
  console.table(itensRec);
} finally {
  await sql.end();
}
