/**
 * backfill-recebimento-alocacoes — cria alocações retroativas para recebimentos
 * em conferência iniciados pelo próprio conferente (sem atribuição do líder).
 *
 * Run: pnpm --filter api db:backfill:recebimento-alocacoes
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../src/infra/db/providers/drizzle/config/migrations/schema.js';
import { listRecebimentosEmConferenciaSemAlocacaoDb } from '../src/infra/db/recebimento/backfill-recebimento-alocacoes.drizzle.js';
import { criarAlocacaoIniciadaRetroativaDb } from '../src/infra/db/recebimento/criar-alocacao-recebimento.drizzle.js';
import { findSessaoFuncionarioRecebimentoAbertaDb } from '../src/infra/db/sessao-operacao/find-sessao-funcionario-recebimento-aberta.drizzle.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnv(): void {
  try {
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
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env optional if DATABASE_URL is already in environment
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Check apps/api/.env');
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client, { schema });

async function main(): Promise<void> {
  const pendentes = await listRecebimentosEmConferenciaSemAlocacaoDb(db);

  console.log(
    `Encontrados ${pendentes.length} recebimento(s) em conferência sem alocação ativa.`,
  );

  let criados = 0;
  let ignorados = 0;
  let erros = 0;

  for (const item of pendentes) {
    const vinculo = await findSessaoFuncionarioRecebimentoAbertaDb(
      db,
      item.unidadeId,
      item.responsavelId,
    );

    if (!vinculo) {
      ignorados += 1;
      console.warn(
        `Ignorado ${item.preRecebimentoId}: conferente ${item.responsavelId} sem sessão aberta de recebimento.`,
      );
      continue;
    }

    try {
      await criarAlocacaoIniciadaRetroativaDb(db, {
        preRecebimentoId: item.preRecebimentoId,
        sessaoId: vinculo.sessaoId,
        sessaoFuncionarioId: vinculo.sessaoFuncionarioId,
        funcionarioId: vinculo.funcionarioId,
        inicioEm: item.dataInicio,
      });
      criados += 1;
      console.log(`Alocação criada para pré-recebimento ${item.preRecebimentoId}`);
    } catch (error) {
      erros += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Erro em ${item.preRecebimentoId}: ${message}`,
      );
    }
  }

  console.log(
    `Backfill concluído. Criados: ${criados}, ignorados: ${ignorados}, erros: ${erros}`,
  );
}

try {
  await main();
} finally {
  await client.end();
}
