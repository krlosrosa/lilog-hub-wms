import type { CreateDocaInput } from '../../../domain/model/doca/doca.model.js';
import type { BulkCreateDocasResult } from '../../../domain/repositories/doca/doca.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { docas } from '../providers/drizzle/config/migrations/schema.js';
import { mapDocaRow, toDocaInsertValues } from './map-doca.drizzle.js';

export async function bulkCreateDocasDb(
  db: DrizzleClient,
  items: CreateDocaInput[],
): Promise<BulkCreateDocasResult> {
  if (items.length === 0) {
    return { criadas: 0, duplicadas: 0, items: [] };
  }

  const createdItems: BulkCreateDocasResult['items'] = [];
  let duplicadas = 0;

  for (const item of items) {
    const [record] = await db
      .insert(docas)
      .values(toDocaInsertValues(item))
      .onConflictDoNothing({
        target: [docas.unidadeId, docas.codigo],
      })
      .returning();

    if (record) {
      createdItems.push(mapDocaRow(record));
      continue;
    }

    duplicadas += 1;
  }

  return {
    criadas: createdItems.length,
    duplicadas,
    items: createdItems,
  };
}
