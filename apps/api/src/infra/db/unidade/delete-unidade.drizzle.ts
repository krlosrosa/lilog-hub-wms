import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { unidades } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteUnidadeDb(db: DrizzleClient, id: string) {
  await db.delete(unidades).where(eq(unidades.id, id));
}
