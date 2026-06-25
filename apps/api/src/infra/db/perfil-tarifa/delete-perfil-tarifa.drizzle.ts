import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { perfisTarifas } from '../providers/drizzle/config/migrations/schema.js';

export async function deletePerfilTarifaDb(db: DrizzleClient, id: string) {
  await db.delete(perfisTarifas).where(eq(perfisTarifas.id, id));
}
