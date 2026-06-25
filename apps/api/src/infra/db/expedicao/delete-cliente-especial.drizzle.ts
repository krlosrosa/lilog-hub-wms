import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { clientesEspeciais } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteClienteEspecialDb(db: DrizzleClient, id: string) {
  await db.delete(clientesEspeciais).where(eq(clientesEspeciais.id, id));
}
