import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centrosOrigem } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteCentroOrigemDb(db: DrizzleClient, centro: string) {
  await db.delete(centrosOrigem).where(eq(centrosOrigem.centro, centro));
}
