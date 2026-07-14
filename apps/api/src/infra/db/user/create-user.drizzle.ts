import type { CreateUserInput } from '../../../domain/model/user/user.model.js';
import type { UserRecord } from '../../../domain/repositories/user/user.repository.js';
import { resolveInternalUserEmail } from '../../../shared/utils/internal-user-email.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { users } from '../providers/drizzle/config/migrations/schema.js';
import { mapUserRow } from './map-user.drizzle.js';

export async function createUserDb(
  db: DrizzleClient,
  data: CreateUserInput,
): Promise<UserRecord> {
  const [record] = await db
    .insert(users)
    .values({
      id: data.id,
      name: data.name,
      email: resolveInternalUserEmail(data.id, data.email),
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status,
      funcionarioId: data.funcionarioId,
      mustChangePassword: data.mustChangePassword ?? false,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create user');
  }

  return mapUserRow(record);
}
