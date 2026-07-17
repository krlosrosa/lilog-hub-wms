/**
 * db:seed-dev — sandbox básico (unidade, operadores).
 *
 * USE ONLY IN DEVELOPMENT.
 * For production Web admin only, use: pnpm --filter api db:seed
 *
 * Run: pnpm --filter api db:seed-dev
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';

import { buildInternalUserEmail } from '../src/shared/utils/internal-user-email.js';

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

const SEED_UNIDADE_ID = 'UN-SEED-001';
const SEED_USER_ADMIN_ID = 421931;
const SEED_USER_OPERATOR_1_ID = 421932;
const SEED_USER_OPERATOR_2_ID = 421933;
const SEED_CENTRO_ID = '00000000-0000-4000-8000-000000000001';

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('123456', 10);

  await sql.unsafe(`
    INSERT INTO master_data.unidades (id, nome, cluster, nome_filial)
    VALUES ('${SEED_UNIDADE_ID}', 'CD Seed', 'Cross', 'Filial Seed')
    ON CONFLICT (id) DO UPDATE
      SET nome = EXCLUDED.nome,
          cluster = EXCLUDED.cluster,
          nome_filial = EXCLUDED.nome_filial;
  `);

  await sql.unsafe(`
    INSERT INTO auth.funcionarios (unidade_id, matricula, nome, cargo, situacao, data_admissao)
    VALUES
      ('${SEED_UNIDADE_ID}', '421931', 'Carlos Roberto', 'supervisor', 'ativo', '2020-01-01'),
      ('${SEED_UNIDADE_ID}', '421932', 'Ricardo Silva', 'conferente', 'ativo', '2020-01-01'),
      ('${SEED_UNIDADE_ID}', '421933', 'Ana Martins', 'separador', 'ativo', '2020-01-01')
    ON CONFLICT (unidade_id, matricula) DO UPDATE
      SET nome = EXCLUDED.nome,
          cargo = EXCLUDED.cargo,
          situacao = EXCLUDED.situacao;
  `);

  await sql.unsafe(`
    INSERT INTO auth.users (id, name, email, password_hash, role, funcionario_id)
    SELECT ${SEED_USER_ADMIN_ID}, 'Carlos Roberto', '${buildInternalUserEmail(SEED_USER_ADMIN_ID)}', '${passwordHash}', 'admin', f.id
      FROM auth.funcionarios f
      WHERE f.matricula = '421931' AND f.unidade_id = '${SEED_UNIDADE_ID}'
    ON CONFLICT (id) DO UPDATE
      SET name           = EXCLUDED.name,
          email          = EXCLUDED.email,
          password_hash  = EXCLUDED.password_hash,
          role           = EXCLUDED.role,
          funcionario_id = EXCLUDED.funcionario_id;

    INSERT INTO auth.users (id, name, email, password_hash, role, funcionario_id)
    SELECT ${SEED_USER_OPERATOR_1_ID}, 'Ricardo Silva', '${buildInternalUserEmail(SEED_USER_OPERATOR_1_ID)}', '${passwordHash}', 'operator', f.id
      FROM auth.funcionarios f
      WHERE f.matricula = '421932' AND f.unidade_id = '${SEED_UNIDADE_ID}'
    ON CONFLICT (id) DO UPDATE
      SET name           = EXCLUDED.name,
          email          = EXCLUDED.email,
          password_hash  = EXCLUDED.password_hash,
          role           = EXCLUDED.role,
          funcionario_id = EXCLUDED.funcionario_id;

    INSERT INTO auth.users (id, name, email, password_hash, role, funcionario_id)
    SELECT ${SEED_USER_OPERATOR_2_ID}, 'Ana Martins', '${buildInternalUserEmail(SEED_USER_OPERATOR_2_ID)}', '${passwordHash}', 'operator', f.id
      FROM auth.funcionarios f
      WHERE f.matricula = '421933' AND f.unidade_id = '${SEED_UNIDADE_ID}'
    ON CONFLICT (id) DO UPDATE
      SET name           = EXCLUDED.name,
          email          = EXCLUDED.email,
          password_hash  = EXCLUDED.password_hash,
          role           = EXCLUDED.role,
          funcionario_id = EXCLUDED.funcionario_id;
  `);

  await sql.unsafe(`
    INSERT INTO master_data.centros (id, unidade_id, centro, empresa, nome)
    VALUES ('${SEED_CENTRO_ID}', '${SEED_UNIDADE_ID}', '1001', 'LDB', 'Centro Seed')
    ON CONFLICT (id) DO UPDATE
      SET unidade_id = EXCLUDED.unidade_id,
          centro = EXCLUDED.centro,
          empresa = EXCLUDED.empresa,
          nome = EXCLUDED.nome;
  `);

  console.log('✓ Funcionários e usuários criados (421931 admin, 421932/421933 operators)');
  console.log(`✓ Centro seed: ${SEED_CENTRO_ID}`);

  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
