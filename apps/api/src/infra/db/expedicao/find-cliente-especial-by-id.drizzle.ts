import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { clientesEspeciais } from '../providers/drizzle/config/migrations/schema.js';
import { mapClienteEspecialRow } from './map-cliente-especial.drizzle.js';

export async function findClienteEspecialByIdDb(db: DrizzleClient, id: string) {
  const [row] = await db
    .select()
    .from(clientesEspeciais)
    .where(eq(clientesEspeciais.id, id))
    .limit(1);

  return row ? mapClienteEspecialRow(row) : null;
}
