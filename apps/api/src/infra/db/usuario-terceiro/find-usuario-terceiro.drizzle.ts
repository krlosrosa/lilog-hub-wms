import { eq } from 'drizzle-orm';

import type { UsuarioTerceiroRecord } from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { usuariosTerceiros } from '../providers/drizzle/config/migrations/schema.js';
import { mapUsuarioTerceiroRow } from './map-usuario-terceiro.drizzle.js';

export async function findUsuarioTerceiroByEmailDb(
  db: DrizzleClient,
  email: string,
): Promise<UsuarioTerceiroRecord | null> {
  const [row] = await db
    .select()
    .from(usuariosTerceiros)
    .where(eq(usuariosTerceiros.email, email.toLowerCase()))
    .limit(1);

  return row ? mapUsuarioTerceiroRow(row) : null;
}

export async function findUsuarioTerceiroByIdDb(
  db: DrizzleClient,
  id: number,
): Promise<UsuarioTerceiroRecord | null> {
  const [row] = await db
    .select()
    .from(usuariosTerceiros)
    .where(eq(usuariosTerceiros.id, id))
    .limit(1);

  return row ? mapUsuarioTerceiroRow(row) : null;
}
