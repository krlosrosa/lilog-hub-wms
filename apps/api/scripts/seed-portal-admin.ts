import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDatabaseUrl(): string {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  let url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() ?? '';

  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }

  if (!url) {
    throw new Error('DATABASE_URL not found in apps/api/.env');
  }

  return url;
}

const email = process.env.PORTAL_ADMIN_EMAIL ?? 'admin@portal.local';
const password = process.env.PORTAL_ADMIN_PASSWORD ?? 'admin123';
const nome = process.env.PORTAL_ADMIN_NOME ?? 'Administrador Portal';

const sql = postgres(loadDatabaseUrl(), { max: 1 });

try {
  const existing = await sql<{ id: number }[]>`
    SELECT id FROM auth.usuarios_terceiros WHERE email = ${email.toLowerCase()}
  `;

  if (existing.length > 0) {
    console.log(`Portal admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO auth.usuarios_terceiros (nome, email, password_hash, role, status)
    VALUES (${nome}, ${email.toLowerCase()}, ${passwordHash}, 'admin', 'ativo')
  `;

  console.log('Portal admin created successfully');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
} catch (error) {
  console.error('Seed failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
