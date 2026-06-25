import { eq } from 'drizzle-orm';

import type { UpdateEnderecoData } from '../../../domain/model/endereco/endereco.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { enderecos } from '../providers/drizzle/config/migrations/schema.js';
import { findEnderecoByIdDb } from './find-endereco.drizzle.js';
import { toEnderecoUpdateValues } from './map-endereco.drizzle.js';

export async function updateEnderecoDb(
  db: DrizzleClient,
  id: string,
  data: UpdateEnderecoData,
) {
  const [record] = await db
    .update(enderecos)
    .set(toEnderecoUpdateValues(data))
    .where(eq(enderecos.id, id))
    .returning({ id: enderecos.id });

  if (!record) {
    return null;
  }

  return findEnderecoByIdDb(db, id);
}
