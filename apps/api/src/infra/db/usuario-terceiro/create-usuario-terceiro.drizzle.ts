import type { CreateUsuarioTerceiroInput } from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';
import type { UsuarioTerceiroRecord } from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { usuariosTerceiros } from '../providers/drizzle/config/migrations/schema.js';
import { mapUsuarioTerceiroRow } from './map-usuario-terceiro.drizzle.js';

export async function createUsuarioTerceiroDb(
  db: DrizzleClient,
  data: CreateUsuarioTerceiroInput,
): Promise<UsuarioTerceiroRecord> {
  const [record] = await db
    .insert(usuariosTerceiros)
    .values({
      nome: data.nome,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create usuario terceiro');
  }

  return mapUsuarioTerceiroRow(record);
}
