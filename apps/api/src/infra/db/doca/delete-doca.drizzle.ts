import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { docas } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteDocaDb(db: DrizzleClient, id: string) {
  await db.delete(docas).where(eq(docas.id, id));
}
