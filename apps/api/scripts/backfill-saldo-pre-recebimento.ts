import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { eq, notInArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

try {
  const envContent = readFileSync(envPath, 'utf8');

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env optional if DATABASE_URL is already in environment
}

import { buildPreRecebimentoDocumentoRef } from '../src/domain/model/estoque/deposito.model.js';
import { toBaseUnits } from '../src/domain/services/unidade-medida.js';
import { ensureDepositosUnidadeDb } from '../src/infra/db/estoque/ensure-depositos-unidade.drizzle.js';
import { registrarEntradaDb } from '../src/infra/db/estoque/movimentar-estoque.drizzle.js';
import {
  itensPreRecebimento,
  movimentacoesEstoque,
  preRecebimentos,
  produtos,
} from '../src/infra/db/providers/drizzle/config/migrations/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Check apps/api/.env');
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
  const candidatos = await db
    .select({ preRecebimento: preRecebimentos })
    .from(preRecebimentos)
    .where(
      notInArray(preRecebimentos.situacao, ['finalizado', 'cancelado'] as const),
    );

  let processados = 0;

  for (const { preRecebimento } of candidatos) {
    const documentoRef = buildPreRecebimentoDocumentoRef(preRecebimento.id);

    const [movimento] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(movimentacoesEstoque)
      .where(eq(movimentacoesEstoque.documentoRef, documentoRef));

    if ((movimento?.total ?? 0) > 0) {
      continue;
    }

    const itens = await db
      .select({ item: itensPreRecebimento, produto: produtos })
      .from(itensPreRecebimento)
      .leftJoin(produtos, eq(itensPreRecebimento.produtoId, produtos.id))
      .where(eq(itensPreRecebimento.preRecebimentoId, preRecebimento.id));

    if (itens.length === 0) {
      continue;
    }

    const depositos = await ensureDepositosUnidadeDb(db, preRecebimento.unidadeId);
    const depositoTransf = depositos.find((item) => item.codigo === 'TRANSF');

    if (!depositoTransf) {
      throw new Error(
        `Depósito TRANSF não encontrado para unidade ${preRecebimento.unidadeId}`,
      );
    }

    for (const { item, produto } of itens) {
      const quantidadeUN = toBaseUnits(
        Number(item.quantidadeEsperada),
        item.unidadeMedida,
        produto?.unidadesPorCaixa ?? 1,
      );

      if (quantidadeUN <= 0) {
        continue;
      }

      await registrarEntradaDb(db, {
        unidadeId: preRecebimento.unidadeId,
        depositoId: depositoTransf.id,
        produtoId: item.produtoId,
        quantidade: quantidadeUN,
        unidadeMedida: 'UN',
        documentoRef,
        motivo: 'recebimento_provisorio',
        operatorId: null,
      });
    }

    processados += 1;
    console.log(`Saldo provisório criado para pré-recebimento ${preRecebimento.id}`);
  }

  console.log(`Backfill concluído. ${processados} pré-recebimento(s) atualizado(s).`);
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
