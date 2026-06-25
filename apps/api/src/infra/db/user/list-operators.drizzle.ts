import { and, eq, inArray } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { users } from '../providers/drizzle/config/migrations/schema.js';

export async function listOperatorsDb(db: DrizzleClient) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(
      and(
        inArray(users.role, ['operator', 'admin']),
        eq(users.status, 'ativo'),
      ),
    )
    .orderBy(users.name);

  return rows.map((row) => ({
    value: String(row.id),
    label: `${row.name} (${row.role === 'admin' ? 'Admin' : 'Operações'})`,
  }));
}
