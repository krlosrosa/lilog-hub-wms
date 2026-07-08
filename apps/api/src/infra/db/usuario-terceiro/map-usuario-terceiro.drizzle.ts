import type { UsuarioTerceiroRecord } from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';
import type { usuariosTerceiros } from '../providers/drizzle/config/migrations/schema.js';

export function mapUsuarioTerceiroRow(
  row: typeof usuariosTerceiros.$inferSelect,
): UsuarioTerceiroRecord {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    status: row.status as UsuarioTerceiroRecord['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
