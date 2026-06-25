import type { CreateUnidadeInput } from '../../../domain/model/unidade/unidade.model.js';
import type { UnidadeWithCentros } from '../../../domain/repositories/unidade/unidade.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapCentroRow, mapUnidadeRow } from './map-unidade.drizzle.js';

export async function createUnidadeDb(
  db: DrizzleClient,
  data: CreateUnidadeInput,
): Promise<UnidadeWithCentros> {
  return db.transaction(async (tx) => {
    const [unidadeRow] = await tx
      .insert(unidades)
      .values({
        id: data.id,
        nome: data.nome,
        cluster: data.cluster,
        nomeFilial: data.nomeFilial,
      })
      .returning();

    if (!unidadeRow) {
      throw new Error('Failed to create unidade');
    }

    const centrosInput = data.centros ?? [];
    const centrosRows =
      centrosInput.length > 0
        ? await tx
            .insert(centros)
            .values(
              centrosInput.map((centro) => ({
                unidadeId: data.id,
                centro: centro.centro,
                empresa: centro.empresa,
                nome: centro.nome,
              })),
            )
            .returning()
        : [];

    return {
      ...mapUnidadeRow(unidadeRow),
      centros: centrosRows.map(mapCentroRow),
    };
  });
}
