import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoras } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteTransportadoraDb(db: DrizzleClient, id: string) {
  await db.delete(transportadoras).where(eq(transportadoras.id, id));
}
