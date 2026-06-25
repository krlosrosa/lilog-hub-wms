/**
 * db:reset — wipes ALL schemas and data so migrations run from scratch.
 *
 * USE ONLY IN DEVELOPMENT.
 *
 * After reset, run: npm run db:migrate
 * Or use: npm run db:fresh (reset + migrate in one command)
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

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

const sql = postgres(DATABASE_URL, { max: 1 });

async function reset() {
  console.log('Resetting database (dropping all schemas)...');

  await sql.unsafe(`
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    DROP SCHEMA IF EXISTS audit CASCADE;
    DROP SCHEMA IF EXISTS auth CASCADE;
    DROP SCHEMA IF EXISTS master_data CASCADE;
    DROP SCHEMA IF EXISTS armazenagem CASCADE;
    DROP SCHEMA IF EXISTS doca CASCADE;
    DROP SCHEMA IF EXISTS recebimento CASCADE;
    DROP SCHEMA IF EXISTS estoque CASCADE;
    DROP SCHEMA IF EXISTS documento CASCADE;
    DROP SCHEMA IF EXISTS inventory CASCADE;
    DROP SCHEMA IF EXISTS units CASCADE;
    DROP SCHEMA IF EXISTS products CASCADE;
    DROP SCHEMA IF EXISTS wms CASCADE;
    DROP SCHEMA IF EXISTS core CASCADE;
    DROP SCHEMA IF EXISTS scheduling CASCADE;
    DROP SCHEMA IF EXISTS loyalty CASCADE;
    DROP SCHEMA IF EXISTS coupons CASCADE;
    DROP TABLE IF EXISTS public.audit_logs CASCADE;
    DROP TABLE IF EXISTS public.movement_records CASCADE;
    DROP TYPE IF EXISTS public.cluster_type CASCADE;
    DROP TYPE IF EXISTS public.empresa_type CASCADE;
    DROP TYPE IF EXISTS public.curva_abc_type CASCADE;
    DROP TYPE IF EXISTS public.endereco_status_type CASCADE;
    DROP TYPE IF EXISTS public.endereco_tipo_type CASCADE;
    DROP TYPE IF EXISTS public.endereco_tipo_estrutura_type CASCADE;
    DROP TYPE IF EXISTS public.produto_endereco_papel_type CASCADE;
    DROP TYPE IF EXISTS public.doca_situacao_type CASCADE;
    DROP TYPE IF EXISTS public.doca_tipo_type CASCADE;
    DROP TYPE IF EXISTS public.operacao_doca_prioridade_type CASCADE;
    DROP TYPE IF EXISTS public.operacao_doca_situacao_type CASCADE;
    DROP TYPE IF EXISTS public.operacao_doca_tipo_type CASCADE;
    DROP TYPE IF EXISTS public.pre_recebimento_situacao_type CASCADE;
    DROP TYPE IF EXISTS public.recebimento_situacao_type CASCADE;
    DROP TYPE IF EXISTS public.tipo_divergencia_type CASCADE;
    DROP TYPE IF EXISTS public.contagem_tipo CASCADE;
    DROP TYPE IF EXISTS public.demanda_contagem_prioridade CASCADE;
    DROP TYPE IF EXISTS public.demanda_contagem_status CASCADE;
    DROP TYPE IF EXISTS public.demanda_contagem_tipo CASCADE;
    DROP TYPE IF EXISTS public.demanda_endereco_status CASCADE;
    DROP TYPE IF EXISTS public.inventario_status CASCADE;
    DROP TYPE IF EXISTS public.inventario_tipo CASCADE;
    DROP TYPE IF EXISTS public.movement_type CASCADE;
    DROP TYPE IF EXISTS public.documento_status CASCADE;
  `);

  console.log('Database reset complete.');
  console.log('Run: npm run db:migrate');

  await sql.end();
}

reset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
