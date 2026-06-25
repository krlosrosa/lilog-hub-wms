/**
 * Ajusta quantidades de itens pendentes de armazenagem para refletir
 * o saldo real em AGUARD_ARM (corrige demandas geradas antes do alinhamento).
 *
 * Run: npx tsx scripts/align-demanda-armazenagem-quantidades.ts [demandaId]
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import { resolveSaldoOrigemArmazenagem } from '../src/domain/services/resolve-saldo-origem-armazenagem.js';
import { resolveDocumentoRefByRecebimentoIdDb } from '../src/infra/db/armazenagem/resolve-documento-ref-recebimento.drizzle.js';
import { listSaldosDb } from '../src/infra/db/estoque/list-saldos.drizzle.js';
import { updateItemQuantidadeArmazenagemDb } from '../src/infra/db/armazenagem/demanda-armazenagem.drizzle.js';
import * as schema from '../src/infra/db/providers/drizzle/config/migrations/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnv(): void {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv();

const demandaIdFilter = process.argv[2];
const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

const demandas = demandaIdFilter
  ? await db
      .select()
      .from(schema.demandasArmazenagem)
      .where(eq(schema.demandasArmazenagem.id, demandaIdFilter))
  : await db
      .select()
      .from(schema.demandasArmazenagem)
      .where(eq(schema.demandasArmazenagem.status, 'em_andamento'));

let atualizados = 0;

for (const demanda of demandas) {
  const itens = await db
    .select()
    .from(schema.itensArmazenagem)
    .where(eq(schema.itensArmazenagem.demandaId, demanda.id));

  const documentoRef = await resolveDocumentoRefByRecebimentoIdDb(
    db as never,
    demanda.recebimentoId,
  );

  for (const item of itens) {
    if (item.status === 'armazenado') continue;

    const saldos = await listSaldosDb(db as never, {
      unidadeId: demanda.unidadeId,
      depositoCodigo: 'AGUARD_ARM',
      produtoId: item.produtoId,
    });

    const saldoOrigem = resolveSaldoOrigemArmazenagem(saldos, {
      lote: item.lote,
      numeroSerie: item.numeroSerie,
      documentoRefsPrioridade: documentoRef ? [documentoRef, ''] : [''],
    });

    if (!saldoOrigem) continue;

    const quantidadeAtual = Number(item.quantidade);
    const quantidadeAlinhada = Math.min(
      quantidadeAtual,
      saldoOrigem.quantidadeDisponivel,
    );

    if (quantidadeAlinhada > 0 && quantidadeAlinhada !== quantidadeAtual) {
      await updateItemQuantidadeArmazenagemDb(
        db as never,
        item.id,
        quantidadeAlinhada,
      );
      console.log(
        `Item ${item.id.slice(0, 8)}: ${quantidadeAtual} -> ${quantidadeAlinhada} ${item.unidadeMedida}`,
      );
      atualizados += 1;
    }
  }
}

console.log(`Itens atualizados: ${atualizados}`);
await client.end();
