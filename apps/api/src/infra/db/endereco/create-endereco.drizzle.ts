import type { CreateEnderecoData } from '../../../domain/model/endereco/endereco.model.js';
import type { EnderecoRecord } from '../../../domain/repositories/endereco/endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { enderecos } from '../providers/drizzle/config/migrations/schema.js';
import { findEnderecoByIdDb } from './find-endereco.drizzle.js';
import { toEnderecoInsertValues } from './map-endereco.drizzle.js';

export async function createEnderecoDb(
  db: DrizzleClient,
  data: CreateEnderecoData,
): Promise<EnderecoRecord> {
  const [record] = await db
    .insert(enderecos)
    .values(toEnderecoInsertValues(data))
    .returning();

  if (!record) {
    throw new Error('Failed to create endereco');
  }

  const created = await findEnderecoByIdDb(db, record.id);

  if (!created) {
    throw new Error('Failed to load created endereco');
  }

  return created;
}
