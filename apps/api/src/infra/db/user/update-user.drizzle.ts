import { eq } from 'drizzle-orm';

import type { UpdateUserInput } from '../../../domain/model/user/user.model.js';
import type { UserRecord } from '../../../domain/repositories/user/user.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { users } from '../providers/drizzle/config/migrations/schema.js';
import { mapUserRow } from './map-user.drizzle.js';

export async function updateUserDb(
  db: DrizzleClient,
  id: number,
  data: UpdateUserInput,
): Promise<UserRecord | null> {
  const values: Partial<typeof users.$inferInsert> = {};

  if (data.name !== undefined) values.name = data.name;
  if (data.email !== undefined) values.email = data.email.toLowerCase();
  if (data.role !== undefined) values.role = data.role;
  if (data.status !== undefined) values.status = data.status;
  if (data.funcionarioId !== undefined) values.funcionarioId = data.funcionarioId;
  if (data.passwordHash !== undefined) values.passwordHash = data.passwordHash;

  const [record] = await db
    .update(users)
    .set(values)
    .where(eq(users.id, id))
    .returning();

  return record ? mapUserRow(record) : null;
}

export async function blockUserDb(
  db: DrizzleClient,
  id: number,
): Promise<UserRecord | null> {
  const [record] = await db
    .update(users)
    .set({ status: 'bloqueado' })
    .where(eq(users.id, id))
    .returning();

  return record ? mapUserRow(record) : null;
}

export async function unblockUserDb(
  db: DrizzleClient,
  id: number,
): Promise<UserRecord | null> {
  const [record] = await db
    .update(users)
    .set({ status: 'ativo' })
    .where(eq(users.id, id))
    .returning();

  return record ? mapUserRow(record) : null;
}

export async function blockUsersByFuncionarioIdDb(
  db: DrizzleClient,
  funcionarioId: number,
): Promise<number> {
  const rows = await db
    .update(users)
    .set({ status: 'bloqueado' })
    .where(eq(users.funcionarioId, funcionarioId))
    .returning({ id: users.id });

  return rows.length;
}
