import { eq } from 'drizzle-orm';

import type { UpdateUsuarioTerceiroInput } from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';
import type { UsuarioTerceiroRecord } from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { usuariosTerceiros } from '../providers/drizzle/config/migrations/schema.js';
import { mapUsuarioTerceiroRow } from './map-usuario-terceiro.drizzle.js';

export async function updateUsuarioTerceiroDb(
  db: DrizzleClient,
  id: number,
  data: UpdateUsuarioTerceiroInput,
): Promise<UsuarioTerceiroRecord | null> {
  const values: Partial<typeof usuariosTerceiros.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.nome !== undefined) values.nome = data.nome;
  if (data.email !== undefined) values.email = data.email.toLowerCase();
  if (data.role !== undefined) values.role = data.role;
  if (data.status !== undefined) values.status = data.status;
  if (data.passwordHash !== undefined) values.passwordHash = data.passwordHash;

  const [record] = await db
    .update(usuariosTerceiros)
    .set(values)
    .where(eq(usuariosTerceiros.id, id))
    .returning();

  return record ? mapUsuarioTerceiroRow(record) : null;
}

export async function blockUsuarioTerceiroDb(
  db: DrizzleClient,
  id: number,
): Promise<UsuarioTerceiroRecord | null> {
  const [record] = await db
    .update(usuariosTerceiros)
    .set({ status: 'bloqueado', updatedAt: new Date() })
    .where(eq(usuariosTerceiros.id, id))
    .returning();

  return record ? mapUsuarioTerceiroRow(record) : null;
}
