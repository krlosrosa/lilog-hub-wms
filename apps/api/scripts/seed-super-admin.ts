/**
 * seed-super-admin — cria o usuário admin da Web WMS (auth.users).
 *
 * Safe for production / first-time setup. Idempotent.
 *
 * Run:
 *   pnpm --filter api db:seed-super-admin
 *
 * Production (required envs):
 *   SUPER_ADMIN_ID=421931
 *   SUPER_ADMIN_PASSWORD=<strong-password>
 *   SUPER_ADMIN_NOME="Carlos Roberto"
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

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

function parsePositiveInt(value: string | undefined, label: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return parsed;
}

loadEnv();

const isProduction = process.env.NODE_ENV === 'production';
const forceReset = process.env.SUPER_ADMIN_FORCE_RESET === 'true';

const userId = parsePositiveInt(
  process.env.SUPER_ADMIN_ID ?? (isProduction ? undefined : '421931'),
  'SUPER_ADMIN_ID',
);

const password =
  process.env.SUPER_ADMIN_PASSWORD ?? (isProduction ? undefined : '123456');

const nome = process.env.SUPER_ADMIN_NOME ?? 'Super Admin';
const role = process.env.SUPER_ADMIN_ROLE ?? 'admin';

if (!password) {
  console.error(
    'ERROR: SUPER_ADMIN_PASSWORD is required (mandatory in production).',
  );
  process.exit(1);
}

if (isProduction && password.length < 8) {
  console.error('ERROR: SUPER_ADMIN_PASSWORD must have at least 8 characters in production.');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Check apps/api/.env');
  process.exit(1);
}

const email = buildInternalUserEmail(userId);
const sql = postgres(DATABASE_URL, { max: 1 });

async function main() {
  const existing = await sql<{ id: number }[]>`
    SELECT id FROM auth.users WHERE id = ${userId}
  `;

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing.length > 0) {
    if (!forceReset) {
      console.log(`Super admin already exists: ID ${userId}`);
      return;
    }

    await sql`
      UPDATE auth.users
      SET name = ${nome},
          email = ${email},
          password_hash = ${passwordHash},
          role = ${role},
          status = 'ativo'
      WHERE id = ${userId}
    `;

    console.log(`Super admin updated: ID ${userId}`);
    console.log(`Nome: ${nome}`);
    console.log(`Role: ${role}`);
    return;
  }

  await sql`
    INSERT INTO auth.users (id, name, email, password_hash, role, status, funcionario_id)
    VALUES (${userId}, ${nome}, ${email}, ${passwordHash}, ${role}, 'ativo', NULL)
  `;

  console.log('Super admin created successfully');
  console.log(`ID: ${userId}`);
  console.log(`Nome: ${nome}`);
  console.log(`Role: ${role}`);
  console.log(`Email (interno): ${email}`);

  if (!isProduction) {
    console.log(`Password: ${password}`);
  } else {
    console.log('Password: (hidden — set via SUPER_ADMIN_PASSWORD)');
  }
}

try {
  await main();
} catch (error) {
  console.error('Seed failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
