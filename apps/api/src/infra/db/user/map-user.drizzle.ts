import type { UserRecord } from '../../../domain/repositories/user/user.repository.js';
import type { users } from '../providers/drizzle/config/migrations/schema.js';

export function mapUserRow(
  row: typeof users.$inferSelect,
  unidadeId: string | null = null,
): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    status: row.status as UserRecord['status'],
    mustChangePassword: row.mustChangePassword,
    funcionarioId: row.funcionarioId,
    unidadeId,
    createdAt: row.createdAt,
  };
}
