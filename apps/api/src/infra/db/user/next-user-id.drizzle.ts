import { sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { users } from '../providers/drizzle/config/migrations/schema.js';

export async function nextUserIdDb(db: DrizzleClient): Promise<number> {
  const [row] = await db
    .select({ nextId: sql<number>`coalesce(max(${users.id}), 0) + 1` })
    .from(users);

  return Number(row?.nextId ?? 1);
}
