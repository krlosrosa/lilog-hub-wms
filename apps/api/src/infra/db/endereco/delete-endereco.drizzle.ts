import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { enderecos } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteEnderecoDb(db: DrizzleClient, id: string) {
  await db.delete(enderecos).where(eq(enderecos.id, id));
}
