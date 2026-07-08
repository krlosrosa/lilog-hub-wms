import type { CreateCncInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cncItens,
  naoConformidades,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapCncItemRow,
  mapCncRow,
  toCncInsertValues,
  toCncItemInsertValues,
} from './map-cnc.drizzle.js';

export async function createCncDb(db: DrizzleClient, data: CreateCncInput) {
  return db.transaction(async (tx) => {
    const [cncRow] = await tx
      .insert(naoConformidades)
      .values(toCncInsertValues(data))
      .returning();

    if (!cncRow) {
      throw new Error('Failed to create CNC');
    }

    const itemRows =
      data.itens.length > 0
        ? await tx
            .insert(cncItens)
            .values(
              data.itens.map((item) => toCncItemInsertValues(cncRow.id, item)),
            )
            .returning()
        : [];

    return {
      ...mapCncRow(cncRow),
      itens: itemRows.map(mapCncItemRow),
    };
  });
}
