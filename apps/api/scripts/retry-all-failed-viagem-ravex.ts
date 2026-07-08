import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Queue } from 'bullmq';

import {
  EXPEDICAO_TRANSPORTE_QUEUE,
  JOB_SINCRONIZAR_VIAGEM_RAVEX,
} from '../src/infra/queues/expedicao-transporte.queue.js';

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
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnv();
  const password = process.env.REDIS_PASSWORD;
  const queue = new Queue(EXPEDICAO_TRANSPORTE_QUEUE, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      ...(password ? { password } : {}),
    },
  });

  const failed = await queue.getJobs(['failed'], 0, 500);
  console.log(`Reenfileirando ${failed.length} job(s) failed...`);

  for (const job of failed) {
    if (job.name !== JOB_SINCRONIZAR_VIAGEM_RAVEX) {
      continue;
    }

    const data = job.data as {
      transporteId: string;
      unidadeId: string;
      fase: string;
    };

    const jobId = `viagem-ravex-${data.transporteId}-${data.fase}`;
    await job.remove();

    await queue.add(JOB_SINCRONIZAR_VIAGEM_RAVEX, data, {
      jobId,
      removeOnComplete: true,
      removeOnFail: 100,
    });

    console.log(`Reenfileirado: ${jobId}`);
  }

  await queue.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
