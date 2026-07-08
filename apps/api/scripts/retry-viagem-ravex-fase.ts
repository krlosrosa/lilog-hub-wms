import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Queue } from 'bullmq';

import {
  EXPEDICAO_TRANSPORTE_QUEUE,
  JOB_SINCRONIZAR_VIAGEM_RAVEX,
  type FaseSincronizacaoViagemRavex,
} from '../src/infra/queues/expedicao-transporte.queue.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnv(): void {
  const content = readFileSync(envPath, 'utf-8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

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
}

function printUsage(): void {
  console.log(`
Uso:
  npx tsx scripts/retry-viagem-ravex-fase.ts <transporteId> [fase] [unidadeId]

Exemplo:
  npx tsx scripts/retry-viagem-ravex-fase.ts f71a1137-2f2a-4478-be27-970053bb3016 verificar_anomalias UN-SEED-001

Fases válidas:
  buscar_viagem | aguardar_inicio | aguardar_fim | verificar_anomalias | gerar_demanda_devolucao
`.trim());
}

async function main(): Promise<void> {
  loadEnv();

  const transporteId = process.argv[2];
  const fase = (process.argv[3] ?? 'verificar_anomalias') as FaseSincronizacaoViagemRavex;
  const unidadeId = process.argv[4] ?? 'UN-SEED-001';

  if (!transporteId) {
    printUsage();
    process.exit(1);
  }

  const password = process.env.REDIS_PASSWORD;
  const queue = new Queue(EXPEDICAO_TRANSPORTE_QUEUE, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      ...(password ? { password } : {}),
    },
  });

  const jobId = `viagem-ravex-${transporteId}-${fase}`;
  const existing = await queue.getJob(jobId);

  if (existing) {
    const state = await existing.getState();
    console.log(`Job existente "${jobId}" em estado "${state}" — removendo antes de reenfileirar`);
    await existing.remove();
  }

  await queue.add(
    JOB_SINCRONIZAR_VIAGEM_RAVEX,
    {
      transporteId,
      unidadeId,
      fase,
    },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );

  console.log(`Job reenfileirado: ${jobId}`);

  await queue.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
