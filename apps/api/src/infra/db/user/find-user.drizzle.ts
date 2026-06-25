import { and, eq } from 'drizzle-orm';

import type { UserRecord } from '../../../domain/repositories/user/user.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  funcionarios,
  users,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapUserRow } from './map-user.drizzle.js';

export async function findUserByEmailDb(
  db: DrizzleClient,
  email: string,
): Promise<UserRecord | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return row ? mapUserRow(row) : null;
}

export async function findUserByIdDb(
  db: DrizzleClient,
  id: number,
): Promise<UserRecord | null> {
  const [row] = await db
    .select({
      user: users,
      unidadeId: funcionarios.unidadeId,
    })
    .from(users)
    .leftJoin(funcionarios, eq(users.funcionarioId, funcionarios.id))
    .where(eq(users.id, id))
    .limit(1);

  return row ? mapUserRow(row.user, row.unidadeId) : null;
}

export async function findActiveUserByFuncionarioIdDb(
  db: DrizzleClient,
  funcionarioId: number,
): Promise<UserRecord | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.funcionarioId, funcionarioId),
        eq(users.status, 'ativo'),
      ),
    )
    .limit(1);

  return row ? mapUserRow(row) : null;
}
